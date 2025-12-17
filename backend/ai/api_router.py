from ninja import Router, File, UploadedFile
from ninja.errors import HttpError
from typing import Optional
import logging

from .schemas import (
    AIChatRequestSchema, 
    AIChatResponseSchema,
    VisionKeywordsResponseSchema,
    AssistantRequestSchema,
    AssistantResponseSchema,
    SearchSummaryRequestSchema,
    SearchSummaryResponseSchema,
    BestDeal,
)
from .services import AIChatEngine, VisionKeywordsService, PublicAssistantService, SearchSummaryService

logger = logging.getLogger(__name__)

router = Router(tags=["ai"])

# Lazy-loaded services
_chat_engine = None
_vision_service = None
_assistant_service = None
_search_summary_service = None


def get_chat_engine():
    global _chat_engine
    if _chat_engine is None:
        _chat_engine = AIChatEngine()
    return _chat_engine


def get_vision_service():
    global _vision_service
    if _vision_service is None:
        _vision_service = VisionKeywordsService()
    return _vision_service


def get_assistant_service():
    global _assistant_service
    if _assistant_service is None:
        _assistant_service = PublicAssistantService()
    return _assistant_service


def get_search_summary_service():
    global _search_summary_service
    if _search_summary_service is None:
        _search_summary_service = SearchSummaryService()
    return _search_summary_service


@router.post("/chat", response=AIChatResponseSchema, auth=None)
def ai_chat(request, payload: AIChatRequestSchema):
    """AI chat for authenticated users (dashboard context)."""
    if not request.user.is_authenticated:
        raise HttpError(401, "Authentication required")
    
    engine = get_chat_engine()
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


@router.post("/vision-keywords", response=VisionKeywordsResponseSchema, auth=None)
def vision_keywords(request, file: UploadedFile = File(...)):
    """
    Extract 1-2 product search keywords from an image using Gemini Vision.
    
    Returns:
        keywords: List of 1-2 keywords
        raw_text: Optional raw response for debugging
    """
    try:
        # Read file
        file_bytes = file.read()
        mime_type = file.content_type or "image/jpeg"
        
        if not file_bytes:
            raise HttpError(400, "Empty file uploaded")
        
        service = get_vision_service()
        result = service.extract_keywords(file_bytes, mime_type)
        
        return VisionKeywordsResponseSchema(
            keywords=result.keywords,
            raw_text=result.raw_text
        )
        
    except ValueError as e:
        # Validation errors
        raise HttpError(400, str(e))
    except RuntimeError as e:
        # Config errors
        logger.error(f"Vision service config error: {e}")
        raise HttpError(500, "AI service configuration error")
    except Exception as e:
        logger.error(f"Vision keywords error: {str(e)[:200]}")
        raise HttpError(500, "Failed to analyze image. Please try again.")


@router.post("/assistant", response=AssistantResponseSchema, auth=None)
def assistant(request, payload: AssistantRequestSchema):
    """
    Public AI assistant - works for both authenticated and unauthenticated users.
    
    Input:
        message: User's question
        context: Optional context about current route and user type
        
    Returns:
        reply: Assistant's response
    """
    try:
        # Get identifier for rate limiting
        if request.user.is_authenticated:
            identifier = f"user:{request.user.id}"
        else:
            # Use IP address for anonymous users
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                identifier = f"ip:{x_forwarded_for.split(',')[0].strip()}"
            else:
                identifier = f"ip:{request.META.get('REMOTE_ADDR', 'unknown')}"
        
        service = get_assistant_service()
        
        # Convert context to dict
        context_dict = None
        if payload.context:
            context_dict = {
                "route": payload.context.route,
                "user_type": payload.context.user_type,
                "page_state": payload.context.page_state,
            }
        
        reply = service.chat(
            message=payload.message,
            context=context_dict,
            identifier=identifier
        )
        
        return AssistantResponseSchema(reply=reply)
        
    except RuntimeError as e:
        logger.error(f"Assistant service config error: {e}")
        raise HttpError(500, "AI service configuration error")
    except Exception as e:
        logger.error(f"Assistant error: {str(e)[:200]}")
        raise HttpError(500, "Sorry, I couldn't process your request. Please try again.")


@router.post("/search-summary", response=SearchSummaryResponseSchema, auth=None)
def search_summary(request, payload: SearchSummaryRequestSchema):
    """
    Generate AI-powered search summary from product search results.
    
    Input:
        query: Search query string
        results: List of product results (id, name, category, price, seller, etc.)
        destination: Optional destination for shipping context
        
    Returns:
        best_deal: Best priced product with details
        avg_price: Average price across results
        suppliers_count: Number of unique suppliers
        moq_warning: Warning about minimum order quantities (if any)
        highlights: Optional AI insights
    """
    try:
        # Get identifier for rate limiting
        if request.user.is_authenticated:
            identifier = f"user:{request.user.id}"
        else:
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                identifier = f"ip:{x_forwarded_for.split(',')[0].strip()}"
            else:
                identifier = f"ip:{request.META.get('REMOTE_ADDR', 'unknown')}"
        
        service = get_search_summary_service()
        
        # Convert results to dicts
        results_dicts = [
            {
                "id": r.id,
                "product_name": r.product_name,
                "product_category": r.product_category,
                "unit_price": r.unit_price,
                "sell_quantity": r.sell_quantity,
                "seller_name": r.seller_name,
                "updated_at": r.updated_at,
            }
            for r in payload.results
        ]
        
        # Convert destination to dict
        destination_dict = None
        if payload.destination:
            destination_dict = {
                "country": payload.destination.country,
                "region": payload.destination.region,
            }
        
        result = service.generate_summary(
            query=payload.query,
            results=results_dicts,
            destination=destination_dict,
            identifier=identifier
        )
        
        # Convert to response schema
        best_deal_response = None
        if result.best_deal:
            best_deal_response = BestDeal(
                title=result.best_deal.get("title", ""),
                price=result.best_deal.get("price", 0),
                seller=result.best_deal.get("seller", ""),
                product_id=result.best_deal.get("product_id", ""),
            )
        
        return SearchSummaryResponseSchema(
            best_deal=best_deal_response,
            avg_price=result.avg_price,
            suppliers_count=result.suppliers_count,
            moq_warning=result.moq_warning,
            highlights=result.highlights,
        )
        
    except RuntimeError as e:
        logger.error(f"Search summary service config error: {e}")
        raise HttpError(500, "AI service configuration error")
    except Exception as e:
        logger.error(f"Search summary error: {str(e)[:200]}")
        raise HttpError(500, "Failed to generate search summary.")
