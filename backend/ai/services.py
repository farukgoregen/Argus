import os
import re
import time
import json
import base64
import hashlib
import logging
import uuid
from dataclasses import dataclass
from typing import List, Optional, Dict, Any

from django.core.cache import cache

import google.generativeai as genai
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception

from .prompts import SYSTEM_PROMPT

logger = logging.getLogger(__name__)


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


# ========================
# Vision Keywords Service
# ========================

@dataclass
class VisionKeywordsResult:
    keywords: List[str]
    raw_text: Optional[str] = None
    request_id: str = ""


class VisionKeywordsService:
    """Extracts product search keywords from images using Gemini Vision."""
    
    ALLOWED_MIME_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}
    MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY missing")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")
    
    def _validate_image(self, file_bytes: bytes, mime_type: str, request_id: str) -> None:
        """Validate image file."""
        if mime_type not in self.ALLOWED_MIME_TYPES:
            logger.warning(f"[{request_id}] Invalid mime type: {mime_type}")
            raise ValueError(f"Invalid file type. Allowed: {', '.join(self.ALLOWED_MIME_TYPES)}")
        
        if len(file_bytes) > self.MAX_FILE_SIZE:
            logger.warning(f"[{request_id}] File too large: {len(file_bytes)} bytes")
            raise ValueError(f"File too large. Max size: {self.MAX_FILE_SIZE // (1024*1024)}MB")
    
    def _clean_keywords(self, raw_keywords: List[str]) -> List[str]:
        """Clean and normalize keywords."""
        cleaned = []
        for kw in raw_keywords[:2]:  # Max 2 keywords
            # Remove punctuation, trim whitespace
            kw = re.sub(r'[^\w\s]', '', kw).strip().lower()
            # Limit to 2 words max
            words = kw.split()[:2]
            if words:
                cleaned.append(" ".join(words))
        return cleaned
    
    def _parse_response(self, text: str, request_id: str) -> List[str]:
        """Parse Gemini response to extract keywords."""
        text = text.strip()
        
        # Try JSON parsing first
        try:
            # Try to find JSON in the response
            json_match = re.search(r'\{[^}]+\}', text)
            if json_match:
                data = json.loads(json_match.group())
                if isinstance(data.get("keywords"), list):
                    return self._clean_keywords(data["keywords"])
        except json.JSONDecodeError:
            pass
        
        # Try array parsing
        try:
            arr_match = re.search(r'\[[^\]]+\]', text)
            if arr_match:
                arr = json.loads(arr_match.group())
                if isinstance(arr, list):
                    return self._clean_keywords([str(x) for x in arr])
        except json.JSONDecodeError:
            pass
        
        # Fallback: split by comma or newline
        keywords = re.split(r'[,\n]', text)
        keywords = [k.strip() for k in keywords if k.strip()]
        
        logger.info(f"[{request_id}] Parsed keywords from plain text: {keywords[:2]}")
        return self._clean_keywords(keywords)
    
    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=5),
        stop=stop_after_attempt(2),
        retry=retry_if_exception(_is_retryable),
        reraise=True,
    )
    def extract_keywords(self, file_bytes: bytes, mime_type: str) -> VisionKeywordsResult:
        """Extract 1-2 keywords from an image."""
        request_id = str(uuid.uuid4())[:8]
        
        logger.info(f"[{request_id}] Processing image: {len(file_bytes)} bytes, {mime_type}")
        
        # Validate
        self._validate_image(file_bytes, mime_type, request_id)
        
        # Base64 encode
        image_b64 = base64.standard_b64encode(file_bytes).decode("utf-8")
        
        # Build prompt
        prompt_parts = [
            {
                "text": (
                    "You are an assistant that extracts product search keywords from images. "
                    "Look at this image and return EXACTLY 1 or 2 short keywords that best describe "
                    "the product or category shown. Output ONLY a JSON object like: "
                    '{"keywords": ["keyword1", "keyword2"]}. No sentences, no explanation.'
                )
            },
            {
                "inline_data": {
                    "mime_type": mime_type,
                    "data": image_b64
                }
            }
        ]
        
        try:
            response = self.model.generate_content(prompt_parts)
            raw_text = getattr(response, "text", "") or ""
            
            logger.info(f"[{request_id}] Gemini response: {raw_text[:200]}")
            
            keywords = self._parse_response(raw_text, request_id)
            
            if not keywords:
                logger.warning(f"[{request_id}] No keywords extracted")
                keywords = ["product"]  # Fallback
            
            return VisionKeywordsResult(
                keywords=keywords,
                raw_text=raw_text[:500] if raw_text else None,
                request_id=request_id
            )
        except Exception as e:
            logger.error(f"[{request_id}] Gemini error: {str(e)[:200]}")
            raise


# ========================
# Public Assistant Service
# ========================

ASSISTANT_SYSTEM_PROMPT = """You are Argus AI, a helpful assistant for a B2B sourcing and supply chain platform called Argus.

Your role:
- Help users navigate the platform (search products, view suppliers, manage watchlists, etc.)
- Answer questions about sourcing, pricing, and supply chain topics
- Suggest search queries when users ask for product recommendations
- Keep responses short, friendly, and actionable (2-3 sentences max)
- If user is not logged in, encourage them to sign up for full access
- Do NOT reveal technical implementation details or API information

Platform features:
- Product search with filters (category, price, supplier)
- Watchlist for tracking products
- AI-powered price insights
- Supplier profiles with trust scores
- Real-time chat with suppliers (for logged in users)

Current context will be provided about the user's route and login status."""


class PublicAssistantService:
    """AI assistant for both public and authenticated users."""
    
    RATE_LIMIT_WINDOW = 60  # seconds
    RATE_LIMIT_MAX = 20  # requests per window
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY missing")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")
    
    def _check_rate_limit(self, identifier: str) -> bool:
        """Check if request is within rate limits."""
        key = f"assistant_rate:{identifier}"
        count = cache.get(key, 0)
        if count >= self.RATE_LIMIT_MAX:
            return False
        cache.set(key, count + 1, timeout=self.RATE_LIMIT_WINDOW)
        return True
    
    def _build_context_string(self, context: Optional[Dict[str, Any]]) -> str:
        """Build context description for the prompt."""
        if not context:
            return "User is on an unknown page, login status unknown."
        
        parts = []
        
        route = context.get("route", "")
        if route:
            if "/dashboard" in route:
                parts.append("User is logged in and viewing their dashboard")
            elif "/login" in route:
                parts.append("User is on the login page")
            elif "/register" in route:
                parts.append("User is on the registration page")
            elif "/search" in route:
                parts.append("User is on the product search page")
            elif route == "/" or route == "":
                parts.append("User is on the homepage")
            else:
                parts.append(f"User is on page: {route}")
        
        user_type = context.get("user_type")
        if user_type:
            parts.append(f"User type: {user_type}")
        else:
            parts.append("User is not logged in")
        
        return " | ".join(parts) if parts else "No context available"
    
    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=5),
        stop=stop_after_attempt(2),
        retry=retry_if_exception(_is_retryable),
        reraise=True,
    )
    def chat(self, message: str, context: Optional[Dict[str, Any]] = None, identifier: str = "anonymous") -> str:
        """Generate assistant response."""
        request_id = str(uuid.uuid4())[:8]
        
        # Rate limit check
        if not self._check_rate_limit(identifier):
            logger.warning(f"[{request_id}] Rate limit exceeded for {identifier[:20]}")
            return "You're sending messages too quickly. Please wait a moment before trying again."
        
        logger.info(f"[{request_id}] Assistant request from {identifier[:20]}: {message[:50]}...")
        
        context_str = self._build_context_string(context)
        
        prompt = f"""{ASSISTANT_SYSTEM_PROMPT}

Context: {context_str}

User message: {message}

Respond helpfully and concisely:"""

        try:
            response = self.model.generate_content(prompt)
            reply = getattr(response, "text", "") or ""
            reply = reply.strip()
            
            if not reply:
                reply = "I'm sorry, I couldn't generate a response. Please try rephrasing your question."
            
            logger.info(f"[{request_id}] Response generated: {len(reply)} chars")
            return reply
            
        except Exception as e:
            logger.error(f"[{request_id}] Assistant error: {str(e)[:200]}")
            raise


# ========================
# Search Summary Service
# ========================

@dataclass
class SearchSummaryResult:
    best_deal: Optional[Dict[str, Any]] = None
    avg_price: float = 0.0
    suppliers_count: int = 0
    moq_warning: Optional[str] = None
    highlights: Optional[List[str]] = None


class SearchSummaryService:
    """Generates AI-powered search summaries using Gemini."""
    
    RATE_LIMIT_WINDOW = 60  # seconds
    RATE_LIMIT_MAX = 30  # requests per window
    CACHE_TTL = 600  # 10 minutes
    
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY", "")
        if not api_key:
            raise RuntimeError("GEMINI_API_KEY missing")
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-2.5-flash")
    
    def _check_rate_limit(self, identifier: str) -> bool:
        """Check if request is within rate limits."""
        key = f"search_summary_rate:{identifier}"
        count = cache.get(key, 0)
        if count >= self.RATE_LIMIT_MAX:
            return False
        cache.set(key, count + 1, timeout=self.RATE_LIMIT_WINDOW)
        return True
    
    def _compute_fallback(self, results: List[Dict[str, Any]]) -> SearchSummaryResult:
        """Compute a deterministic fallback summary without AI."""
        if not results:
            return SearchSummaryResult()
        
        prices = [r.get("unit_price", 0) for r in results if r.get("unit_price")]
        sellers = set(r.get("seller_name") for r in results if r.get("seller_name"))
        
        avg_price = sum(prices) / len(prices) if prices else 0
        min_price_idx = prices.index(min(prices)) if prices else 0
        best_item = results[min_price_idx] if results else None
        
        best_deal = None
        if best_item:
            best_deal = {
                "title": best_item.get("product_name", "Unknown"),
                "price": best_item.get("unit_price", 0),
                "seller": best_item.get("seller_name", "Unknown"),
                "product_id": best_item.get("id", ""),
            }
        
        return SearchSummaryResult(
            best_deal=best_deal,
            avg_price=round(avg_price, 2),
            suppliers_count=len(sellers),
            moq_warning=None,
            highlights=None,
        )
    
    def _cache_key(self, query: str, destination: Optional[Dict[str, Any]] = None) -> str:
        """Generate cache key."""
        dest_str = f"{destination.get('country', '')}-{destination.get('region', '')}" if destination else "none"
        payload = f"summary:{query.lower().strip()}:{dest_str}"
        h = hashlib.sha256(payload.encode("utf-8")).hexdigest()[:16]
        return f"ai:search_summary:{h}"
    
    def _parse_ai_response(self, text: str, results: List[Dict[str, Any]], request_id: str) -> SearchSummaryResult:
        """Parse AI response into structured result."""
        try:
            # Try to find JSON in response
            json_match = re.search(r'\{[^{}]*"best_deal"[^{}]*\}', text, re.DOTALL)
            if not json_match:
                json_match = re.search(r'\{.*\}', text, re.DOTALL)
            
            if json_match:
                data = json.loads(json_match.group())
                
                best_deal = data.get("best_deal")
                if best_deal and isinstance(best_deal, dict):
                    # Validate product_id exists
                    if not best_deal.get("product_id"):
                        # Find matching product
                        for r in results:
                            if r.get("product_name", "").lower() in best_deal.get("title", "").lower():
                                best_deal["product_id"] = r.get("id", "")
                                break
                
                return SearchSummaryResult(
                    best_deal=best_deal,
                    avg_price=float(data.get("avg_price", 0)),
                    suppliers_count=int(data.get("suppliers_count", 0)),
                    moq_warning=data.get("moq_warning"),
                    highlights=data.get("highlights"),
                )
        except (json.JSONDecodeError, ValueError, TypeError) as e:
            logger.warning(f"[{request_id}] Failed to parse AI response: {e}")
        
        # Fallback to computed summary
        return self._compute_fallback(results)
    
    @retry(
        wait=wait_exponential(multiplier=1, min=1, max=5),
        stop=stop_after_attempt(2),
        retry=retry_if_exception(_is_retryable),
        reraise=True,
    )
    def generate_summary(
        self, 
        query: str, 
        results: List[Dict[str, Any]], 
        destination: Optional[Dict[str, Any]] = None,
        identifier: str = "anonymous"
    ) -> SearchSummaryResult:
        """Generate AI-powered search summary."""
        request_id = str(uuid.uuid4())[:8]
        
        # Check cache first
        cache_key = self._cache_key(query, destination)
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"[{request_id}] Returning cached summary for '{query}'")
            return SearchSummaryResult(**cached)
        
        # Rate limit check
        if not self._check_rate_limit(identifier):
            logger.warning(f"[{request_id}] Rate limit exceeded, using fallback")
            return self._compute_fallback(results)
        
        logger.info(f"[{request_id}] Generating summary for '{query}' with {len(results)} results")
        
        # If no results, return empty
        if not results:
            return SearchSummaryResult()
        
        # Build prompt with results data
        results_text = "\n".join([
            f"- {r.get('product_name', 'Unknown')} | ${r.get('unit_price', 0):.2f} | "
            f"Seller: {r.get('seller_name', 'Unknown')} | MOQ: {r.get('sell_quantity', 1)} | "
            f"ID: {r.get('id', '')}"
            for r in results[:20]  # Limit to 20 items
        ])
        
        dest_text = ""
        if destination:
            dest_text = f"Destination: {destination.get('country', '')} {destination.get('region', '')}"
        
        prompt = f"""Analyze these product search results for the query "{query}" and return a JSON summary.
{dest_text}

Products found:
{results_text}

Return ONLY valid JSON in this exact format:
{{
  "best_deal": {{"title": "product name", "price": 123.45, "seller": "seller name", "product_id": "uuid"}},
  "avg_price": 150.00,
  "suppliers_count": 4,
  "moq_warning": "Some sellers require minimum 5 units" or null,
  "highlights": ["insight 1", "insight 2"] or null
}}

Rules:
- best_deal should be the lowest price item
- avg_price is the average of all prices
- suppliers_count is unique seller count
- moq_warning only if any sell_quantity > 1
- highlights: 1-2 brief insights about pricing trends or recommendations (optional)
"""

        try:
            response = self.model.generate_content(prompt)
            raw_text = getattr(response, "text", "") or ""
            
            logger.info(f"[{request_id}] AI response: {raw_text[:300]}")
            
            result = self._parse_ai_response(raw_text, results, request_id)
            
            # Cache the result
            cache_data = {
                "best_deal": result.best_deal,
                "avg_price": result.avg_price,
                "suppliers_count": result.suppliers_count,
                "moq_warning": result.moq_warning,
                "highlights": result.highlights,
            }
            cache.set(cache_key, cache_data, timeout=self.CACHE_TTL)
            
            return result
            
        except Exception as e:
            logger.error(f"[{request_id}] Search summary error: {str(e)[:200]}")
            # Return fallback on error
            return self._compute_fallback(results)
