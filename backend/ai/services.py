import os
import time
import hashlib
from dataclasses import dataclass

from django.core.cache import cache

import google.generativeai as genai
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception

from .prompts import SYSTEM_PROMPT


class ProviderRateLimit(Exception): ...
class ProviderUnavailable(Exception): ...


def _is_retryable(exc: Exception) -> bool:
    # google sdk exception'ları farklı gelebilir; güvenli tarafta kalalım
    msg = str(exc).lower()
    return any(k in msg for k in ["429", "rate", "timeout", "temporarily", "unavailable", "503", "502", "500"])


@dataclass
class AIResult:
    text: str
    from_cache: bool = False
    degraded: bool = False


class CircuitBreaker:
    def __init__(self):
        self.fail_threshold = int(os.getenv("AI_CB_FAIL_THRESHOLD", "3"))
        self.open_seconds = int(os.getenv("AI_CB_OPEN_SECONDS", "60"))

    def _key_fail(self) -> str:
        return "cb:gemini:fail_count"

    def _key_open_until(self) -> str:
        return "cb:gemini:open_until"

    def is_open(self) -> bool:
        open_until = cache.get(self._key_open_until())
        return bool(open_until and time.time() < float(open_until))

    def on_success(self) -> None:
        cache.delete(self._key_fail())
        cache.delete(self._key_open_until())

    def on_failure(self) -> None:
        fails = int(cache.get(self._key_fail(), 0)) + 1
        cache.set(self._key_fail(), fails, timeout=self.open_seconds * 5)
        if fails >= self.fail_threshold:
            cache.set(self._key_open_until(), time.time() + self.open_seconds, timeout=self.open_seconds)


class GeminiService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY missing")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")

    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=10),
        stop=stop_after_attempt(3),
        retry=retry_if_exception(_is_retryable),
        reraise=True,
    )
    def generate(self, prompt: str) -> str:
        resp = self.model.generate_content(prompt)
        text = getattr(resp, "text", None) or ""
        return text.strip()


class AIChatEngine:
    def __init__(self):
        self.ttl = int(os.getenv("AI_CACHE_TTL_SECONDS", "600"))
        self.cb = CircuitBreaker()
        self.provider = GeminiService()

    def _cache_key(self, message: str, product_id=None, supplier_id=None) -> str:
        payload = f"{message}|p={product_id}|s={supplier_id}"
        h = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        return f"ai:chat:{h}"

    def build_prompt(self, message: str, product_id=None, supplier_id=None) -> str:
        ctx = []
        if product_id is not None:
            ctx.append(f"product_id={product_id}")
        if supplier_id is not None:
            ctx.append(f"supplier_id={supplier_id}")
        ctx_txt = " ".join(ctx) if ctx else "no_context"
        return f"{SYSTEM_PROMPT}\n\nContext: {ctx_txt}\nUser: {message}\nAssistant:"

    def chat(self, message: str, product_id=None, supplier_id=None) -> AIResult:
        key = self._cache_key(message, product_id, supplier_id)
        cached = cache.get(key)

        # Circuit breaker açıksa direkt fallback
        if self.cb.is_open():
            if cached:
                return AIResult(text=cached, from_cache=True, degraded=True)
            return AIResult(
                text="AI servisinde geçici yoğunluk var. Lütfen biraz sonra tekrar deneyin veya mesajınızı kısaltın.",
                from_cache=False,
                degraded=True,
            )

        prompt = self.build_prompt(message, product_id, supplier_id)

        try:
            text = self.provider.generate(prompt)
            if not text:
                raise ProviderUnavailable("Empty response")
            cache.set(key, text, timeout=self.ttl)
            self.cb.on_success()
            return AIResult(text=text, from_cache=False, degraded=False)
        except Exception:
            # Case 2: 429/hata -> üstel geri çekilme + devre kesme + TTL cache fallback :contentReference[oaicite:1]{index=1}
            self.cb.on_failure()
            if cached:
                return AIResult(text=cached, from_cache=True, degraded=True)
            return AIResult(
                text="Şu an AI yanıtı üretilemiyor. Daha sonra tekrar deneyin (fallback mod).",
                from_cache=False,
                degraded=True,
            )
