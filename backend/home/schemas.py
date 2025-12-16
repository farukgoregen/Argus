"""
Pydantic schemas for Home Feed API endpoints.

This module contains all request and response schemas for:
- Home feed response structure
- Product card schema for feed items
- Recent searches schema
- Pagination schema
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from ninja import Schema, Field

from products.schemas import ProductPhotoSchema


# ==============================================
# Seller Reference Schema for Product Cards
# ==============================================

class SellerInfoSchema(Schema):
    """Schema for seller info in product cards."""
    id: UUID
    display_name: str


# ==============================================
# Product Card Schema
# ==============================================

class ProductCardSchema(Schema):
    """
    Product card schema for home feed items.
    
    Designed for compact display in feed grids/lists.
    Includes all buyer-relevant fields plus seller reference.
    """
    id: UUID
    product_name: str
    product_category: str
    description_preview: Optional[str] = None
    photos: List[ProductPhotoSchema] = []
    unit_price: Decimal
    sell_quantity: int
    stock_quantity: int
    stock_status: str
    seller: SellerInfoSchema
    created_at: datetime
    updated_at: datetime
    
    @staticmethod
    def resolve_description_preview(obj) -> Optional[str]:
        """Return truncated description (max 120 chars)."""
        if obj.description:
            if len(obj.description) > 120:
                return obj.description[:117] + "..."
            return obj.description
        return None
    
    @staticmethod
    def resolve_stock_status(obj) -> str:
        """Return computed stock status."""
        return obj.stock_status
    
    @staticmethod
    def resolve_photos(obj) -> list:
        """Return ordered photos."""
        return list(obj.photos.all().order_by('sort_order', 'created_at'))
    
    @staticmethod
    def resolve_seller(obj) -> dict:
        """Return seller info."""
        owner = obj.owner
        display_name = owner.username
        
        # Try to get company name from supplier profile
        if hasattr(owner, 'supplier_profile') and owner.supplier_profile:
            company_name = getattr(owner.supplier_profile, 'company_name', None)
            if company_name:
                display_name = company_name
        
        return {
            "id": obj.owner_id,
            "display_name": display_name,
        }


# ==============================================
# Recent Search Schema
# ==============================================

class RecentSearchItemSchema(Schema):
    """Schema for a recent search item."""
    query: str
    searched_at: datetime
    
    @staticmethod
    def resolve_searched_at(obj) -> datetime:
        """Return the created_at timestamp."""
        return obj.created_at


# ==============================================
# Pagination Schema
# ==============================================

class PaginationInfoSchema(Schema):
    """Pagination information for a section."""
    page: int
    page_size: int
    total: int
    total_pages: int
    has_next: bool
    has_prev: bool


# ==============================================
# Section Schemas
# ==============================================

class RecentSearchesSectionSchema(Schema):
    """Schema for the recent searches section."""
    key: str = "recent_searches"
    title: str = "Recent searches"
    items: List[RecentSearchItemSchema]


class AllProductsSectionSchema(Schema):
    """Schema for the all products section."""
    key: str = "all_products"
    title: str = "All products"
    pagination: PaginationInfoSchema
    items: List[ProductCardSchema]


# ==============================================
# Home Feed Response Schema
# ==============================================

class HomeFeedResponseSchema(Schema):
    """
    Home feed response schema.
    
    Contains all sections for the homepage:
    - recent_searches: User's recent search queries
    - all_products: Paginated list of products
    """
    sections: List[dict]  # Will contain RecentSearchesSectionSchema and AllProductsSectionSchema
