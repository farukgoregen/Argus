"""
Public Product API router for Django Ninja.

This module provides public (no authentication required) buyer-facing endpoints:
- Product search across all sellers or filtered by seller
"""
import math
from typing import Optional, List
from uuid import UUID

from ninja import Router, Query
from ninja.errors import HttpError

from django.db.models import Q, Case, When, Value, IntegerField
from django.db.models.functions import Lower

from .models import Product
from .schemas import (
    ProductPhotoSchema,
    ErrorSchema,
)
from .public_schemas import (
    PublicProductListItemSchema,
    PaginatedPublicProductListSchema,
)

router = Router(tags=["Public Products"])


@router.get(
    "/search",
    response={200: PaginatedPublicProductListSchema, 422: ErrorSchema},
    summary="Search products (public)",
    description="Search for products across all sellers or within a specific seller's catalog. No authentication required.",
)
def search_products(
    request,
    q: str = Query(..., description="Search query (min 2 characters). Searches product name and category."),
    seller_id: Optional[UUID] = Query(None, description="Filter by seller (owner_id). If not provided, searches all sellers."),
    page: int = Query(1, ge=1, description="Page number (default: 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (default: 20, max: 100)"),
):
    """
    Public product search endpoint for buyers.
    
    **Search Behavior:**
    - Searches both product_name and product_category (case-insensitive)
    - Minimum query length: 2 characters
    
    **Ranking (results ordered by):**
    1. Exact name match (case-insensitive)
    2. Name starts with query
    3. Name contains query
    4. Category contains query
    
    **Filtering:**
    - Only active products are returned (is_active=True)
    - If seller_id is provided, only products from that seller are returned
    - If seller_id is not provided, products from all sellers are returned
    
    **Query Parameters:**
    - `q`: Search query (required, min 2 characters)
    - `seller_id`: Filter by seller UUID (optional)
    - `page`: Page number (default: 1)
    - `page_size`: Items per page (default: 20, max: 100)
    """
    # Validate query length
    q = q.strip()
    if len(q) < 2:
        raise HttpError(422, "Search query must be at least 2 characters")
    
    q_lower = q.lower()
    
    # Base filter: only active products
    base_filter = Q(is_active=True)
    
    # Filter by seller if provided
    if seller_id:
        base_filter &= Q(owner_id=seller_id)
    
    # Search filter: name OR category contains query
    search_filter = Q(product_name__icontains=q) | Q(product_category__icontains=q)
    
    # Build ranking annotation using Case/When
    # rank 0: exact product_name match (case-insensitive)
    # rank 1: product_name startswith query
    # rank 2: product_name contains query
    # rank 3: product_category contains query only (name doesn't match)
    rank_annotation = Case(
        # Exact name match (case-insensitive)
        When(
            condition=Q(product_name__iexact=q),
            then=Value(0)
        ),
        # Name starts with query
        When(
            condition=Q(product_name__istartswith=q),
            then=Value(1)
        ),
        # Name contains query
        When(
            condition=Q(product_name__icontains=q),
            then=Value(2)
        ),
        # Category contains query (name doesn't match, so this is category-only)
        default=Value(3),
        output_field=IntegerField()
    )
    
    # Build the query with annotation
    queryset = (
        Product.objects
        .filter(base_filter & search_filter)
        .annotate(search_rank=rank_annotation)
        .select_related('owner')
        .prefetch_related('photos')
        .order_by('search_rank', 'product_name', '-updated_at')
    )
    
    # Get total count
    total = queryset.count()
    
    # Paginate
    offset = (page - 1) * page_size
    products = queryset[offset:offset + page_size]
    
    pages = math.ceil(total / page_size) if total > 0 else 1
    
    return {
        "items": list(products),
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }
