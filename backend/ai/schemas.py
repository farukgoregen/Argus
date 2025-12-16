from ninja import Schema
from typing import Optional

class AIChatRequestSchema(Schema):
    message: str
    product_id: Optional[int] = None
    supplier_id: Optional[int] = None

class AIChatResponseSchema(Schema):
    reply: str
    from_cache: bool
    degraded: bool
