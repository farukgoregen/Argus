"""
Home Feed API router for Django Ninja.

This module provides the home feed endpoint:
- GET /api/home-feed: Returns homepage sections with recent searches and products
"""
import math
import hashlib
from typing import Optional
from uuid import UUID

from ninja import Router, Query
from ninja.errors import HttpError

from django.db.models import Q, Case, When, Value, IntegerField
from django.core.cache import cache

from users.authentication import JWTAuth
from products.models import Product
from .models import SearchEvent
from .schemas import (
    HomeFeedResponseSchema,
    ProductCardSchema,
    RecentSearchItemSchema,
    PaginationInfoSchema,
)

router = Router(tags=["Home"])

# Cache timeout in seconds (2 minutes)
PRODUCTS_CACHE_TIMEOUT = 120


def _get_cache_key(page: int, page_size: int, q: Optional[str], category: Optional[str], 
                   seller_id: Optional[UUID], hide_out_of_stock: bool) -> str:
    """Generate a cache key for the products query."""
    key_parts = [
        "home_feed_products",
        str(page),
        str(page_size),
        q or "",
        category or "",
        str(seller_id) if seller_id else "",
        str(hide_out_of_stock),
    ]
    key_string = ":".join(key_parts)
    return hashlib.md5(key_string.encode()).hexdigest()


def _build_products_queryset(
    q: Optional[str],
    category: Optional[str],
    seller_id: Optional[UUID],
    hide_out_of_stock: bool,
):
    """
    Build the products queryset with filters and ordering.
    
    Ordering logic (best practice for "best available" products):
    1. In-stock products first (if not hiding out of stock)
    2. Recently updated products first (updated_at DESC)
    3. Product name ASC for stability
    
    If q is provided, applies search ranking:
    - rank 0: exact name match
    - rank 1: name starts with query
    - rank 2: name contains query
    - rank 3: category contains query
    Then orders by rank ASC, updated_at DESC, product_name ASC
    """
    # Base filter: only active products visible to buyers
    base_filter = Q(is_active=True)
    
    # Filter by seller if provided
    if seller_id:
        base_filter &= Q(owner_id=seller_id)
    
    # Filter by category if provided
    if category:
        base_filter &= Q(product_category__iexact=category)
    
    # Filter out-of-stock if requested
    if hide_out_of_stock:
        base_filter &= Q(stock_quantity__gt=0)
    
    queryset = Product.objects.filter(base_filter)
    
    # Apply search if q is provided
    if q and len(q.strip()) >= 2:
        q = q.strip()
        search_filter = Q(product_name__icontains=q) | Q(product_category__icontains=q)
        
        # Search ranking annotation
        rank_annotation = Case(
            When(condition=Q(product_name__iexact=q), then=Value(0)),
            When(condition=Q(product_name__istartswith=q), then=Value(1)),
            When(condition=Q(product_name__icontains=q), then=Value(2)),
            default=Value(3),
            output_field=IntegerField()
        )
        
        queryset = (
            queryset
            .filter(search_filter)
            .annotate(search_rank=rank_annotation)
            .order_by('search_rank', '-updated_at', 'product_name')
        )
    else:
        # Default ordering: in-stock first, then by updated_at desc, then name
        # Using Case/When to sort in-stock products first
        stock_priority = Case(
            When(stock_quantity__gt=0, then=Value(0)),
            default=Value(1),
            output_field=IntegerField()
        )
        
        queryset = (
            queryset
            .annotate(stock_priority=stock_priority)
            .order_by('stock_priority', '-updated_at', 'product_name')
        )
    
    return queryset


@router.get(
    "",
    auth=JWTAuth(),
    response={200: HomeFeedResponseSchema, 401: dict},
    summary="Get home feed",
    description="""
    Get the homepage feed with recent searches and paginated products.
    
    **Authentication required.**
    
    **Sections returned:**
    - `recent_searches`: Last 5 unique search queries by the authenticated user
    - `all_products`: Paginated list of products (max 20 per page)
    
    **Ordering:**
    - Without search: In-stock products first, then by recently updated, then by name
    - With search: Ranked by match quality (exact name > starts with > contains > category), 
      then by recently updated, then by name
    
    **Filters:**
    - `q`: Search query (min 2 chars, searches name and category)
    - `category`: Filter by exact category match
    - `seller_id`: Filter by seller (product owner)
    - `hide_out_of_stock`: Exclude out-of-stock products (default: false)
    
    **Note:** `page_size` is capped at 20 items maximum.
    """,
)
def get_home_feed(
    request,
    page: int = Query(1, ge=1, description="Page number (default: 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max: 20, default: 20)"),
    q: Optional[str] = Query(None, description="Search query (min 2 chars)"),
    category: Optional[str] = Query(None, description="Filter by category (exact match)"),
    seller_id: Optional[UUID] = Query(None, description="Filter by seller ID"),
    hide_out_of_stock: bool = Query(False, description="Hide out-of-stock products"),
):
    """
    Get the homepage feed for authenticated users.
    
    Returns sections:
    - recent_searches: User's last 5 unique searches
    - all_products: Paginated product list with filters
    """
    user = request.auth
    
    # Hard cap page_size at 20
    page_size = min(page_size, 20)
    
    # Validate search query length if provided
    if q and len(q.strip()) < 2:
        q = None  # Ignore too-short queries instead of erroring
    
    # Record search event if q is provided
    if q and q.strip():
        SearchEvent.record_search(user, q.strip())
    
    # ==========================================
    # Section 1: Recent Searches
    # ==========================================
    recent_searches = SearchEvent.get_recent_for_user(user, limit=5)
    recent_searches_section = {
        "key": "recent_searches",
        "title": "Recent searches",
        "items": [
            {"query": event.query, "searched_at": event.created_at}
            for event in recent_searches
        ],
    }
    
    # ==========================================
    # Section 2: All Products (with caching)
    # ==========================================
    cache_key = _get_cache_key(page, page_size, q, category, seller_id, hide_out_of_stock)
    cached_result = cache.get(cache_key)
    
    if cached_result:
        all_products_section = cached_result
    else:
        # Build queryset
        queryset = _build_products_queryset(q, category, seller_id, hide_out_of_stock)
        
        # Optimize with select_related and prefetch_related
        queryset = queryset.select_related('owner').prefetch_related('photos')
        
        # Get total count
        total = queryset.count()
        
        # Calculate pagination
        total_pages = math.ceil(total / page_size) if total > 0 else 1
        offset = (page - 1) * page_size
        
        # Get products for this page
        products = list(queryset[offset:offset + page_size])
        
        # Build items using schema resolution
        items = []
        for product in products:
            items.append({
                "id": product.id,
                "product_name": product.product_name,
                "product_category": product.product_category,
                "description_preview": (
                    product.description[:117] + "..." 
                    if product.description and len(product.description) > 120 
                    else product.description
                ),
                "photos": [
                    {
                        "id": photo.id,
                        "url": photo.image.url if photo.image else "",
                        "sort_order": photo.sort_order,
                        "created_at": photo.created_at,
                    }
                    for photo in product.photos.all().order_by('sort_order', 'created_at')
                ],
                "unit_price": product.unit_price,
                "sell_quantity": product.sell_quantity,
                "stock_quantity": product.stock_quantity,
                "stock_status": product.stock_status,
                "seller": {
                    "id": product.owner_id,
                    "display_name": _get_seller_display_name(product.owner),
                },
                "created_at": product.created_at,
                "updated_at": product.updated_at,
            })
        
        all_products_section = {
            "key": "all_products",
            "title": "All products",
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages,
                "has_next": page < total_pages,
                "has_prev": page > 1,
            },
            "items": items,
        }
        
        # Cache the result (don't cache user-specific searches, only product lists)
        cache.set(cache_key, all_products_section, PRODUCTS_CACHE_TIMEOUT)
    
    # ==========================================
    # Return combined response
    # ==========================================
    return {
        "sections": [
            recent_searches_section,
            all_products_section,
        ]
    }


def _get_seller_display_name(owner) -> str:
    """Get the display name for a seller."""
    if hasattr(owner, 'supplier_profile') and owner.supplier_profile:
        company_name = getattr(owner.supplier_profile, 'company_name', None)
        if company_name:
            return company_name
    return owner.username
