"""
Pydantic schemas for Product API endpoints.

This module contains all request and response schemas for:
- Product CRUD operations
- Stock management
- Price updates
- Bulk operations
"""
import json
from typing import Optional, List, Any
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from ninja import Schema, Field, FilterSchema
from ninja.orm import create_schema
from pydantic import field_validator, model_validator


# ==============================================
# Photo Schemas
# ==============================================

class ProductPhotoSchema(Schema):
    """Schema for product photo response data."""
    id: UUID
    url: str
    sort_order: int
    created_at: datetime
    
    @staticmethod
    def resolve_url(obj) -> str:
        """Return the URL of the image."""
        if obj.image and hasattr(obj.image, 'url'):
            return obj.image.url
        return ''
    
    @staticmethod
    def resolve_created_at(obj) -> datetime:
        return obj.created_at


class PhotoCreateSchema(Schema):
    """Schema for creating/updating photos in product requests."""
    sort_order: int = 0


class PhotoUpdateSchema(Schema):
    """Schema for updating photo order."""
    id: UUID
    sort_order: int


class PhotoDeleteSchema(Schema):
    """Schema for deleting a photo."""
    id: UUID


# ==============================================
# Product Request Schemas
# ==============================================

class ProductCreateSchema(Schema):
    """Schema for creating a new product."""
    product_name: str = Field(..., min_length=1, max_length=200, description="Name of the product (required)")
    product_category: str = Field(..., min_length=1, max_length=120, description="Category of the product (required)")
    description: Optional[str] = Field(None, description="Detailed product description (optional)")
    unit_price: Decimal = Field(..., ge=0, description="Price per unit")
    stock_quantity: int = Field(default=0, ge=0, description="Current stock quantity")
    sell_quantity: int = Field(default=1, ge=1, description="Minimum purchasable quantity (MOQ)")
    features: dict = Field(default_factory=dict, description="Structured key/value attributes")
    is_active: bool = Field(default=True, description="Whether the product is active")
    
    @field_validator('product_name', mode='before')
    @classmethod
    def validate_product_name(cls, v: Any) -> str:
        """Ensure product_name is non-empty after trimming."""
        if v is None:
            raise ValueError('Product name is required')
        if isinstance(v, str):
            trimmed = v.strip()
            if not trimmed:
                raise ValueError('Product name cannot be empty')
            return trimmed
        raise ValueError('Product name must be a string')
    
    @field_validator('product_category', mode='before')
    @classmethod
    def validate_product_category(cls, v: Any) -> str:
        """Ensure product_category is non-empty after trimming."""
        if v is None:
            raise ValueError('Product category is required')
        if isinstance(v, str):
            trimmed = v.strip()
            if not trimmed:
                raise ValueError('Product category cannot be empty')
            return trimmed
        raise ValueError('Product category must be a string')
    
    @field_validator('description', mode='before')
    @classmethod
    def validate_description(cls, v: Any) -> Optional[str]:
        """Trim description if provided."""
        if v is None:
            return None
        if isinstance(v, str):
            trimmed = v.strip()
            return trimmed if trimmed else None
        return str(v)
    
    @field_validator('features', mode='before')
    @classmethod
    def validate_features(cls, v: Any) -> dict:
        """Parse features from JSON string if needed (form data sends as string)."""
        if v is None:
            return {}
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if not isinstance(parsed, dict):
                    raise ValueError('Features must be a JSON object (dict)')
                return parsed
            except json.JSONDecodeError as e:
                raise ValueError(f'Invalid JSON for features: {e}')
        if not isinstance(v, dict):
            raise ValueError('Features must be a JSON object (dict)')
        return v
    
    @field_validator('unit_price')
    @classmethod
    def validate_unit_price(cls, v: Decimal) -> Decimal:
        """Ensure unit_price has valid precision."""
        if v.as_tuple().exponent < -2:
            raise ValueError('Unit price can have at most 2 decimal places')
        return v


class ProductUpdateSchema(Schema):
    """Schema for partial product update."""
    product_name: Optional[str] = Field(None, max_length=200, description="Name of the product")
    product_category: Optional[str] = Field(None, max_length=120, description="Category of the product")
    description: Optional[str] = Field(None, description="Detailed product description")
    unit_price: Optional[Decimal] = Field(None, ge=0)
    stock_quantity: Optional[int] = Field(None, ge=0)
    sell_quantity: Optional[int] = Field(None, ge=1)
    features: Optional[dict] = None
    is_active: Optional[bool] = None
    
    @field_validator('product_name', mode='before')
    @classmethod
    def validate_product_name(cls, v: Any) -> Optional[str]:
        """Ensure product_name is non-empty after trimming if provided."""
        if v is None:
            return None
        if isinstance(v, str):
            trimmed = v.strip()
            if not trimmed:
                raise ValueError('Product name cannot be empty')
            return trimmed
        raise ValueError('Product name must be a string')
    
    @field_validator('product_category', mode='before')
    @classmethod
    def validate_product_category(cls, v: Any) -> Optional[str]:
        """Ensure product_category is non-empty after trimming if provided."""
        if v is None:
            return None
        if isinstance(v, str):
            trimmed = v.strip()
            if not trimmed:
                raise ValueError('Product category cannot be empty')
            return trimmed
        raise ValueError('Product category must be a string')
    
    @field_validator('description', mode='before')
    @classmethod
    def validate_description(cls, v: Any) -> Optional[str]:
        """Trim description if provided."""
        if v is None:
            return None
        if isinstance(v, str):
            return v.strip() or None
        return str(v)
    
    # Photo operations
    photos_to_add: Optional[List[PhotoCreateSchema]] = None
    photos_to_update: Optional[List[PhotoUpdateSchema]] = None
    photos_to_delete: Optional[List[UUID]] = None
    
    @field_validator('features', mode='before')
    @classmethod
    def validate_features(cls, v: Any) -> Optional[dict]:
        """Parse features from JSON string if needed (form data sends as string)."""
        if v is None:
            return None
        if isinstance(v, str):
            try:
                parsed = json.loads(v)
                if not isinstance(parsed, dict):
                    raise ValueError('Features must be a JSON object (dict)')
                return parsed
            except json.JSONDecodeError as e:
                raise ValueError(f'Invalid JSON for features: {e}')
        if not isinstance(v, dict):
            raise ValueError('Features must be a JSON object (dict)')
        return v


class PriceUpdateSchema(Schema):
    """Schema for updating product price."""
    unit_price: Decimal = Field(..., ge=0)
    
    @field_validator('unit_price')
    @classmethod
    def validate_unit_price(cls, v: Decimal) -> Decimal:
        """Ensure unit_price has valid precision."""
        if v.as_tuple().exponent < -2:
            raise ValueError('Unit price can have at most 2 decimal places')
        return v


class StockUpdateSchema(Schema):
    """Schema for updating product stock."""
    stock_quantity: int = Field(..., ge=0)


class BulkPriceUpdateItemSchema(Schema):
    """Schema for single item in bulk price update."""
    id: UUID
    unit_price: Decimal = Field(..., ge=0)


class BulkPriceUpdateSchema(Schema):
    """Schema for bulk price update."""
    items: List[BulkPriceUpdateItemSchema]


class BulkStockUpdateItemSchema(Schema):
    """Schema for single item in bulk stock update."""
    id: UUID
    stock_quantity: int = Field(..., ge=0)


class BulkStockUpdateSchema(Schema):
    """Schema for bulk stock update."""
    items: List[BulkStockUpdateItemSchema]


# ==============================================
# Product Response Schemas
# ==============================================

class ProductSchema(Schema):
    """Full product response schema."""
    id: UUID
    product_name: str
    product_category: str
    description: Optional[str] = None
    unit_price: Decimal
    price: Decimal  # Alias for unit_price (read-only)
    stock_quantity: int
    sell_quantity: int
    stock_status: str
    features: dict
    is_active: bool
    photos: List[ProductPhotoSchema] = []
    created_at: datetime
    updated_at: datetime
    
    @staticmethod
    def resolve_price(obj) -> Decimal:
        """Return unit_price as price alias."""
        return obj.unit_price
    
    @staticmethod
    def resolve_stock_status(obj) -> str:
        """Return computed stock status."""
        return obj.stock_status
    
    @staticmethod
    def resolve_photos(obj) -> list:
        """Return ordered photos."""
        return list(obj.photos.all().order_by('sort_order', 'created_at'))


class ProductListItemSchema(Schema):
    """Product schema for list responses (lighter than full detail)."""
    id: UUID
    product_name: str
    product_category: str
    description: Optional[str] = None
    unit_price: Decimal
    price: Decimal
    stock_quantity: int
    sell_quantity: int
    stock_status: str
    features: dict
    is_active: bool
    photos: List[ProductPhotoSchema] = []
    created_at: datetime
    updated_at: datetime
    
    @staticmethod
    def resolve_price(obj) -> Decimal:
        return obj.unit_price
    
    @staticmethod
    def resolve_stock_status(obj) -> str:
        return obj.stock_status
    
    @staticmethod
    def resolve_photos(obj) -> list:
        return list(obj.photos.all().order_by('sort_order', 'created_at'))


# ==============================================
# Query / Filter Schemas
# ==============================================

class ProductFilterSchema(FilterSchema):
    """Filter schema for product list endpoint."""
    is_active: Optional[bool] = Field(None, q='is_active')
    stock_status: Optional[str] = None  # Handled manually since computed
    stock_below: Optional[int] = None  # Custom filter: stock_quantity < value
    category: Optional[str] = Field(None, description="Filter by product_category (exact match)")
    search: Optional[str] = Field(None, description="Search product_name and description (icontains)")


class ProductListQuerySchema(Schema):
    """Query parameters for product list endpoint."""
    is_active: Optional[bool] = None
    stock_status: Optional[str] = None
    stock_below: Optional[int] = None
    category: Optional[str] = Field(None, description="Filter by product_category (exact match)")
    search: Optional[str] = Field(None, description="Search product_name and description")
    sort: Optional[str] = Field(None, description="Sort by: created_at, updated_at, unit_price, product_name")
    page: int = Field(1, ge=1)
    page_size: int = Field(20, ge=1, le=100)


# ==============================================
# Pagination Schemas
# ==============================================

class PaginatedProductListSchema(Schema):
    """Paginated product list response."""
    items: List[ProductListItemSchema]
    total: int
    page: int
    page_size: int
    pages: int


# ==============================================
# Bulk Operation Response Schemas
# ==============================================

class BulkUpdateResultSchema(Schema):
    """Result of a single bulk update operation."""
    id: UUID
    success: bool
    error: Optional[str] = None


class BulkUpdateResponseSchema(Schema):
    """Response for bulk update operations."""
    updated: int
    failed: int
    results: List[BulkUpdateResultSchema]


# ==============================================
# Error Schemas
# ==============================================

class ErrorSchema(Schema):
    """Standard error response schema."""
    detail: str


class MessageSchema(Schema):
    """Generic message response schema."""
    message: str
