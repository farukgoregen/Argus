from ninja import Router
from ninja.errors import HttpError
from django.contrib.auth.decorators import login_required
from typing import Dict
from .schemas import AIChatRequestSchema, AIChatResponseSchema
from .services import AIChatEngine

router = Router(tags=["ai"])
engine = AIChatEngine()

@router.post("/chat", response=AIChatResponseSchema)
@login_required
def ai_chat(request, payload: AIChatRequestSchema):
    result = engine.chat(
        message=payload.message,
        product_id=payload.product_id,
        supplier_id=payload.supplier_id,
    )
    return AIChatResponseSchema(
        reply=result.text,
        from_cache=result.from_cache,
        degraded=result.degraded,
    )
