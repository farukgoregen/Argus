"""
Public-facing Pydantic schemas for Product API endpoints.

This module contains schemas for public buyer-facing endpoints:
- Public product search responses
"""
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from ninja import Schema, Field

from .schemas import ProductPhotoSchema


# ==============================================
# Seller Reference Schema
# ==============================================

class SellerReferenceSchema(Schema):
    """Schema for seller reference in public product responses."""
    id: UUID
    display_name: str
    
    @staticmethod
    def resolve_id(obj) -> UUID:
        """Return the seller (owner) ID."""
        return obj.owner_id
    
    @staticmethod
    def resolve_display_name(obj) -> str:
        """
        Return the seller display name.
        Uses company_name from supplier_profile if available, otherwise username.
        """
        owner = obj.owner
        # Try to get company name from supplier profile
        if hasattr(owner, 'supplier_profile') and owner.supplier_profile:
            company_name = getattr(owner.supplier_profile, 'company_name', None)
            if company_name:
                return company_name
        # Fallback to username
        return owner.username


# ==============================================
# Public Product Response Schemas
# ==============================================

class PublicProductListItemSchema(Schema):
    """
    Public product schema for buyer-facing search results.
    
    Includes all buyer-relevant fields plus seller reference.
    Does NOT expose private seller information.
    """
    id: UUID
    product_name: str
    product_category: str
    description: Optional[str] = None
    photos: List[ProductPhotoSchema] = []
    unit_price: Decimal
    stock_quantity: int
    stock_status: str
    sell_quantity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Seller reference
    seller_id: UUID
    seller_display_name: str
    
    @staticmethod
    def resolve_stock_status(obj) -> str:
        """Return computed stock status."""
        return obj.stock_status
    
    @staticmethod
    def resolve_photos(obj) -> list:
        """Return ordered photos."""
        return list(obj.photos.all().order_by('sort_order', 'created_at'))
    
    @staticmethod
    def resolve_seller_id(obj) -> UUID:
        """Return the seller (owner) ID."""
        return obj.owner_id
    
    @staticmethod
    def resolve_seller_display_name(obj) -> str:
        """
        Return the seller display name.
        Uses company_name from supplier_profile if available, otherwise username.
        """
        owner = obj.owner
        # Try to get company name from supplier profile
        if hasattr(owner, 'supplier_profile') and owner.supplier_profile:
            company_name = getattr(owner.supplier_profile, 'company_name', None)
            if company_name:
                return company_name
        # Fallback to username
        return owner.username


class PublicProductDetailSchema(Schema):
    """
    Public product detail schema for buyer-facing product detail page.
    
    Includes all buyer-relevant fields plus seller reference.
    Does NOT expose private seller information.
    """
    id: UUID
    product_name: str
    product_category: str
    description: Optional[str] = None
    photos: List[ProductPhotoSchema] = []
    unit_price: Decimal
    stock_quantity: int
    stock_status: str
    sell_quantity: int
    features: Optional[dict] = None
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Seller reference
    seller_id: UUID
    seller_display_name: str
    
    @staticmethod
    def resolve_stock_status(obj) -> str:
        """Return computed stock status."""
        return obj.stock_status
    
    @staticmethod
    def resolve_photos(obj) -> list:
        """Return ordered photos."""
        return list(obj.photos.all().order_by('sort_order', 'created_at'))
    
    @staticmethod
    def resolve_seller_id(obj) -> UUID:
        """Return the seller (owner) ID."""
        return obj.owner_id
    
    @staticmethod
    def resolve_seller_display_name(obj) -> str:
        """
        Return the seller display name.
        Uses company_name from supplier_profile if available, otherwise username.
        """
        owner = obj.owner
        # Try to get company name from supplier profile
        if hasattr(owner, 'supplier_profile') and owner.supplier_profile:
            company_name = getattr(owner.supplier_profile, 'company_name', None)
            if company_name:
                return company_name
        # Fallback to username
        return owner.username


# ==============================================
# Public Pagination Schema
# ==============================================

class PaginatedPublicProductListSchema(Schema):
    """Paginated public product list response."""
    items: List[PublicProductListItemSchema]
    total: int
    page: int
    page_size: int
    pages: int
