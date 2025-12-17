from ninja import Schema
from typing import Optional, List, Dict, Any

class AIChatRequestSchema(Schema):
    message: str
    product_id: Optional[int] = None
    supplier_id: Optional[int] = None

class AIChatResponseSchema(Schema):
    reply: str
    from_cache: bool
    degraded: bool


# Vision Keywords Schemas
class VisionKeywordsResponseSchema(Schema):
    keywords: List[str]
    raw_text: Optional[str] = None


# Public Assistant Schemas (for unauthenticated users too)
class AssistantContext(Schema):
    route: Optional[str] = None
    user_type: Optional[str] = None  # "buyer" | "supplier" | None
    page_state: Optional[Dict[str, Any]] = None


class AssistantRequestSchema(Schema):
    message: str
    context: Optional[AssistantContext] = None


class AssistantResponseSchema(Schema):
    reply: str


# Search Summary Schemas
class SearchResultItem(Schema):
    id: str
    product_name: str
    product_category: Optional[str] = None
    unit_price: float
    sell_quantity: Optional[int] = None
    seller_name: Optional[str] = None
    updated_at: Optional[str] = None


class SearchDestination(Schema):
    country: Optional[str] = None
    region: Optional[str] = None


class SearchSummaryRequestSchema(Schema):
    query: str
    results: List[SearchResultItem]
    destination: Optional[SearchDestination] = None


class BestDeal(Schema):
    title: str
    price: float
    seller: str
    product_id: str


class SearchSummaryResponseSchema(Schema):
    best_deal: Optional[BestDeal] = None
    avg_price: float
    suppliers_count: int
    moq_warning: Optional[str] = None
    highlights: Optional[List[str]] = None
