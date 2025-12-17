"""
Watchlist API router for Django Ninja.

This module provides watchlist endpoints:
- GET /api/watchlist: List user's watchlist with pagination
- POST /api/watchlist: Add product to watchlist
- DELETE /api/watchlist/{product_id}: Remove product from watchlist
- GET /api/watchlist/ids: Get list of product IDs in watchlist
"""
import math
from uuid import UUID
from typing import List

from ninja import Router, Query
from ninja.errors import HttpError

from django.db.models import Prefetch

from users.authentication import JWTAuth
from products.models import Product
from .models import WatchlistItem
from .schemas import (
    WatchlistItemSchema,
    WatchlistListResponseSchema,
    WatchlistAddRequestSchema,
    WatchlistIdsResponseSchema,
    PaginationInfoSchema,
)

router = Router(tags=["Watchlist"])


def _get_seller_display_name(owner) -> str:
    """Get the display name for a seller."""
    if hasattr(owner, 'supplier_profile') and owner.supplier_profile:
        company_name = getattr(owner.supplier_profile, 'company_name', None)
        if company_name:
            return company_name
    return owner.username


def _build_watchlist_item_response(watchlist_item) -> dict:
    """Build a watchlist item response dict with product details."""
    product = watchlist_item.product
    
    return {
        "id": watchlist_item.id,
        "created_at": watchlist_item.created_at,
        "product": {
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
            "stock_quantity": product.stock_quantity,
            "stock_status": product.stock_status,
            "seller": {
                "id": product.owner_id,
                "display_name": _get_seller_display_name(product.owner),
            },
            "updated_at": product.updated_at,
        }
    }


@router.get(
    "",
    auth=JWTAuth(),
    response={200: WatchlistListResponseSchema, 401: dict},
    summary="List watchlist items",
    description="""
    Get the current user's watchlist with pagination.
    
    **Authentication required.**
    
    **Query Parameters:**
    - `page`: Page number (default: 1)
    - `page_size`: Items per page (default: 20, max: 20)
    
    **Response:**
    - Paginated list of watchlist items ordered by newest first
    - Each item includes full product details
    """,
)
def list_watchlist(
    request,
    page: int = Query(1, ge=1, description="Page number (default: 1)"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page (max: 20, default: 20)"),
):
    """Get user's watchlist with pagination."""
    user = request.auth
    
    # Hard cap page_size at 20
    page_size = min(page_size, 20)
    
    # Build queryset with optimized joins
    queryset = (
        WatchlistItem.objects
        .filter(user=user)
        .select_related('product', 'product__owner')
        .prefetch_related('product__photos')
        .order_by('-created_at')
    )
    
    # Get total count
    total = queryset.count()
    
    # Calculate pagination
    total_pages = math.ceil(total / page_size) if total > 0 else 1
    offset = (page - 1) * page_size
    
    # Get items for this page
    watchlist_items = list(queryset[offset:offset + page_size])
    
    # Build response items
    items = [_build_watchlist_item_response(item) for item in watchlist_items]
    
    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total": total,
            "total_pages": total_pages,
            "has_next": page < total_pages,
            "has_prev": page > 1,
        }
    }


@router.post(
    "",
    auth=JWTAuth(),
    response={200: WatchlistItemSchema, 201: WatchlistItemSchema, 401: dict, 404: dict},
    summary="Add to watchlist",
    description="""
    Add a product to the current user's watchlist.
    
    **Authentication required.**
    
    **Request Body:**
    - `product_id`: UUID of the product to add
    
    **Behavior:**
    - Idempotent: If product is already in watchlist, returns 200 with existing item
    - If product not found or not active, returns 404
    - On success, returns 201 with created item
    """,
)
def add_to_watchlist(request, data: WatchlistAddRequestSchema):
    """Add a product to user's watchlist."""
    user = request.auth
    
    # Check if product exists and is active
    try:
        product = Product.objects.select_related('owner').prefetch_related('photos').get(
            id=data.product_id,
            is_active=True
        )
    except Product.DoesNotExist:
        raise HttpError(404, "Product not found or not available")
    
    # Add to watchlist (handles duplicates gracefully)
    item, created = WatchlistItem.add_to_watchlist(user, product)
    
    # Reload item with related data for response
    item = (
        WatchlistItem.objects
        .select_related('product', 'product__owner')
        .prefetch_related('product__photos')
        .get(id=item.id)
    )
    
    response = _build_watchlist_item_response(item)
    
    # Return 201 for new, 200 for existing
    if created:
        return 201, response
    return 200, response


@router.delete(
    "/{product_id}",
    auth=JWTAuth(),
    response={200: dict, 401: dict, 404: dict},
    summary="Remove from watchlist",
    description="""
    Remove a product from the current user's watchlist.
    
    **Authentication required.**
    
    **Path Parameters:**
    - `product_id`: UUID of the product to remove
    
    **Response:**
    - 200: Successfully removed
    - 404: Product not in watchlist
    """,
)
def remove_from_watchlist(request, product_id: UUID):
    """Remove a product from user's watchlist."""
    user = request.auth
    
    removed = WatchlistItem.remove_from_watchlist(user, product_id)
    
    if not removed:
        raise HttpError(404, "Product not in watchlist")
    
    return {"message": "Removed from watchlist"}


@router.get(
    "/ids",
    auth=JWTAuth(),
    response={200: WatchlistIdsResponseSchema, 401: dict},
    summary="Get watchlist product IDs",
    description="""
    Get a list of product IDs in the current user's watchlist.
    
    **Authentication required.**
    
    Useful for quick UI checks to determine if products are in watchlist
    without fetching full product details.
    """,
)
def get_watchlist_ids(request):
    """Get list of product IDs in user's watchlist."""
    user = request.auth
    
    product_ids = WatchlistItem.get_product_ids_for_user(user)
    
    return {"product_ids": product_ids}
