"""
Product API router for Django Ninja.

This module provides all product-related endpoints:
- CRUD operations (list, detail, create, update, delete)
- Stock management (update stock, critical stock list)
- Price management
- Bulk operations
- Activate/deactivate
"""
import logging
import math
from typing import Optional, List
from uuid import UUID

from ninja import Router, File, Form, Query
from ninja.files import UploadedFile
from ninja.errors import HttpError

from users.authentication import JWTAuth
from .models import Product, get_low_stock_threshold
from .schemas import (
    ProductSchema,
    ProductListItemSchema,
    ProductCreateSchema,
    ProductUpdateSchema,
    PriceUpdateSchema,
    StockUpdateSchema,
    BulkPriceUpdateSchema,
    BulkStockUpdateSchema,
    PaginatedProductListSchema,
    BulkUpdateResponseSchema,
    ErrorSchema,
    MessageSchema,
)
from .services import ProductService

logger = logging.getLogger(__name__)

router = Router(tags=["Products"])


# ==============================================
# List & Detail Endpoints
# ==============================================

@router.get(
    "",
    auth=JWTAuth(),
    response={200: PaginatedProductListSchema, 401: ErrorSchema},
    summary="List products",
    description="Get paginated list of products owned by the authenticated user.",
)
def list_products(
    request,
    is_active: Optional[bool] = None,
    stock_status: Optional[str] = None,
    stock_below: Optional[int] = None,
    category: Optional[str] = Query(None, description="Filter by product_category (exact match)"),
    search: Optional[str] = Query(None, description="Search product_name and description (icontains)"),
    sort: Optional[str] = Query(None, description="Sort by: created_at, -created_at, updated_at, -updated_at, unit_price, -unit_price, product_name, -product_name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """
    List all products for the authenticated user with filtering and pagination.
    
    **Query Parameters:**
    - `is_active`: Filter by active status (true/false)
    - `stock_status`: Filter by stock status (in_stock, low_stock, out_of_stock)
    - `stock_below`: Filter products with stock_quantity < value
    - `category`: Filter by product_category (exact match)
    - `search`: Search product_name and description (case-insensitive contains)
    - `sort`: Sort field (prefix with - for descending)
    - `page`: Page number (default: 1)
    - `page_size`: Items per page (default: 20, max: 100)
    """
    user = request.auth
    
    products, total = ProductService.list_products(
        user=user,
        is_active=is_active,
        stock_status=stock_status,
        stock_below=stock_below,
        category=category,
        search=search,
        sort=sort,
        page=page,
        page_size=page_size,
    )
    
    pages = math.ceil(total / page_size) if total > 0 else 1
    
    return {
        "items": products,
        "total": total,
        "page": page,
        "page_size": page_size,
        "pages": pages,
    }


@router.get(
    "/critical-stock",
    auth=JWTAuth(),
    response={200: List[ProductListItemSchema], 401: ErrorSchema},
    summary="Get critical stock products",
    description="Get products with stock below the threshold.",
)
def get_critical_stock(
    request,
    threshold: int = Query(None, ge=1, description="Stock threshold (default from settings)"),
):
    """
    Get products with critical stock levels (stock_quantity < threshold).
    
    Only returns active products. Default threshold is configured in settings
    (PRODUCT_LOW_STOCK_THRESHOLD, default: 10).
    """
    user = request.auth
    
    if threshold is None:
        threshold = get_low_stock_threshold()
    
    products = ProductService.get_critical_stock(user, threshold)
    return products


@router.get(
    "/{product_id}",
    auth=JWTAuth(),
    response={200: ProductSchema, 401: ErrorSchema, 404: ErrorSchema},
    summary="Get product detail",
    description="Get detailed information about a specific product.",
)
def get_product(request, product_id: UUID):
    """
    Get detailed information about a product.
    
    Returns 404 if the product doesn't exist or is not owned by the user.
    """
    user = request.auth
    
    product = ProductService.get_product_by_id(user, product_id)
    if not product:
        raise HttpError(404, "Product not found")
    
    return product


# ==============================================
# Create, Update, Delete Endpoints
# ==============================================

@router.post(
    "",
    auth=JWTAuth(),
    response={201: ProductSchema, 401: ErrorSchema, 422: ErrorSchema},
    summary="Create product",
    description="Create a new product.",
)
def create_product(
    request,
    payload: Form[ProductCreateSchema],
    photos: List[UploadedFile] = File(None),
):
    """
    Create a new product with optional photos.
    
    **Request Body (multipart/form-data):**
    - `product_name`: Name of the product (required)
    - `product_category`: Category of the product (required)
    - `description`: Detailed product description (optional)
    - `unit_price`: Price per unit (required)
    - `stock_quantity`: Initial stock (default: 0)
    - `sell_quantity`: Minimum order quantity (default: 1)
    - `features`: JSON object of product features
    - `is_active`: Whether product is active (default: true)
    - `photos`: List of image files (optional)
    """
    user = request.auth
    
    product = ProductService.create_product(
        user=user,
        product_name=payload.product_name,
        product_category=payload.product_category,
        description=payload.description,
        unit_price=payload.unit_price,
        stock_quantity=payload.stock_quantity,
        sell_quantity=payload.sell_quantity,
        features=payload.features,
        is_active=payload.is_active,
        photos=photos,
    )
    
    return 201, product


@router.patch(
    "/{product_id}",
    auth=JWTAuth(),
    response={200: ProductSchema, 401: ErrorSchema, 404: ErrorSchema, 422: ErrorSchema},
    summary="Update product",
    description="Partially update a product.",
)
def update_product(
    request,
    product_id: UUID,
    payload: Form[ProductUpdateSchema],
    new_photos: List[UploadedFile] = File(None),
):
    """
    Partially update a product.
    
    **Request Body (multipart/form-data):**
    - `product_name`: New product name (optional)
    - `product_category`: New product category (optional)
    - `description`: New description (optional)
    - `unit_price`: New price (optional)
    - `stock_quantity`: New stock quantity (optional)
    - `sell_quantity`: New minimum order quantity (optional)
    - `features`: New features object (optional)
    - `is_active`: New active status (optional)
    - `photos_to_delete`: List of photo UUIDs to delete (optional)
    - `photos_to_update`: List of {id, sort_order} to reorder (optional)
    - `new_photos`: New photo files to add (optional)
    """
    user = request.auth
    
    product = ProductService.get_product_by_id(user, product_id)
    if not product:
        raise HttpError(404, "Product not found")
    
    # Prepare photo operations
    photos_to_add = None
    if new_photos:
        photos_to_add = [(photo, idx) for idx, photo in enumerate(new_photos)]
    
    photos_to_update = None
    if payload.photos_to_update:
        photos_to_update = [(p.id, p.sort_order) for p in payload.photos_to_update]
    
    product = ProductService.update_product(
        product=product,
        product_name=payload.product_name,
        product_category=payload.product_category,
        description=payload.description,
        unit_price=payload.unit_price,
        stock_quantity=payload.stock_quantity,
        sell_quantity=payload.sell_quantity,
        features=payload.features,
        is_active=payload.is_active,
        photos_to_add=photos_to_add,
        photos_to_update=photos_to_update,
        photos_to_delete=payload.photos_to_delete,
    )
    
    return product


@router.delete(
    "/{product_id}",
    auth=JWTAuth(),
    response={200: MessageSchema, 401: ErrorSchema, 404: ErrorSchema},
    summary="Delete product (soft)",
    description="Soft delete a product by setting is_active to false.",
)
def delete_product(request, product_id: UUID):
    """
    Soft delete a product.
    
    Sets is_active to false instead of actually deleting the record.
    The product can be reactivated later using the activate endpoint.
    """
    user = request.auth
    
    product = ProductService.get_product_by_id(user, product_id)
    if not product:
        raise HttpError(404, "Product not found")
    
    ProductService.soft_delete(product)
    
    return {"message": "Product deleted successfully"}


# ==============================================
# Activate / Deactivate Endpoints
# ==============================================

@router.post(
    "/{product_id}/activate",
    auth=JWTAuth(),
    response={200: ProductSchema, 401: ErrorSchema, 404: ErrorSchema},
    summary="Activate product",
    description="Activate a deactivated product.",
)
def activate_product(request, product_id: UUID):
    """Activate a product (set is_active to true)."""
    user = request.auth
    
    product = ProductService.get_product_by_id(user, product_id)
    if not product:
        raise HttpError(404, "Product not found")
    
    ProductService.activate(product)
    return product


@router.post(
    "/{product_id}/deactivate",
    auth=JWTAuth(),
    response={200: ProductSchema, 401: ErrorSchema, 404: ErrorSchema},
    summary="Deactivate product",
    description="Deactivate an active product.",
)
def deactivate_product(request, product_id: UUID):
    """Deactivate a product (set is_active to false)."""
    user = request.auth
    
    product = ProductService.get_product_by_id(user, product_id)
    if not product:
        raise HttpError(404, "Product not found")
    
    ProductService.deactivate(product)
    return product


# ==============================================
# Bulk Operations (MUST be before parameterized routes)
# ==============================================

@router.patch(
    "/bulk/price",
    auth=JWTAuth(),
    response={200: BulkUpdateResponseSchema, 401: ErrorSchema, 422: ErrorSchema},
    summary="Bulk update prices",
    description="Update prices for multiple products at once.",
)
def bulk_update_prices(request, payload: BulkPriceUpdateSchema):
    """
    Bulk update product prices.
    
    **Request Body:**
    - `items`: List of {id, unit_price} objects
    
    Returns a summary of successful and failed updates.
    """
    user = request.auth
    
    items = [{"id": item.id, "unit_price": item.unit_price} for item in payload.items]
    updated, failed, results = ProductService.bulk_update_prices(user, items)
    
    return {
        "updated": updated,
        "failed": failed,
        "results": results,
    }


@router.patch(
    "/bulk/stock",
    auth=JWTAuth(),
    response={200: BulkUpdateResponseSchema, 401: ErrorSchema, 422: ErrorSchema},
    summary="Bulk update stock",
    description="Update stock quantities for multiple products at once.",
)
def bulk_update_stock(request, payload: BulkStockUpdateSchema):
    """
    Bulk update product stock quantities.
    
    **Request Body:**
    - `items`: List of {id, stock_quantity} objects
    
    Returns a summary of successful and failed updates.
    """
    user = request.auth
    
    items = [{"id": item.id, "stock_quantity": item.stock_quantity} for item in payload.items]
    updated, failed, results = ProductService.bulk_update_stock(user, items)
    
    return {
        "updated": updated,
        "failed": failed,
        "results": results,
    }


# ==============================================
# Price & Stock Update Endpoints (parameterized)
# ==============================================

@router.patch(
    "/{product_id}/price",
    auth=JWTAuth(),
    response={200: ProductSchema, 401: ErrorSchema, 404: ErrorSchema, 422: ErrorSchema},
    summary="Update product price",
    description="Update only the unit_price of a product.",
)
def update_price(request, product_id: UUID, payload: PriceUpdateSchema):
    """
    Update product price.
    
    **Request Body:**
    - `unit_price`: New price per unit
    """
    user = request.auth
    
    product = ProductService.get_product_by_id(user, product_id)
    if not product:
        raise HttpError(404, "Product not found")
    
    product = ProductService.update_price(product, payload.unit_price)
    return product


@router.patch(
    "/{product_id}/stock",
    auth=JWTAuth(),
    response={200: ProductSchema, 401: ErrorSchema, 404: ErrorSchema, 422: ErrorSchema},
    summary="Update product stock",
    description="Update only the stock_quantity of a product.",
)
def update_stock(request, product_id: UUID, payload: StockUpdateSchema):
    """
    Update product stock quantity.
    
    **Request Body:**
    - `stock_quantity`: New stock quantity
    """
    user = request.auth
    
    product = ProductService.get_product_by_id(user, product_id)
    if not product:
        raise HttpError(404, "Product not found")
    
    product = ProductService.update_stock(product, payload.stock_quantity)
    return product


# ==============================================
# Photo Management Endpoints
# ==============================================

@router.post(
    "/{product_id}/photos",
    auth=JWTAuth(),
    response={201: ProductSchema, 401: ErrorSchema, 404: ErrorSchema},
    summary="Add product photo",
    description="Add a new photo to a product.",
)
def add_photo(
    request,
    product_id: UUID,
    photo: UploadedFile = File(...),
    sort_order: int = Form(0),
):
    """
    Add a photo to a product.
    
    **Request Body (multipart/form-data):**
    - `photo`: Image file
    - `sort_order`: Display order (lower = first)
    """
    user = request.auth
    
    product = ProductService.get_product_by_id(user, product_id)
    if not product:
        raise HttpError(404, "Product not found")
    
    ProductService.add_photo(product, photo, sort_order)
    
    # Refresh product to include new photo
    product.refresh_from_db()
    return 201, product


@router.delete(
    "/{product_id}/photos/{photo_id}",
    auth=JWTAuth(),
    response={200: MessageSchema, 401: ErrorSchema, 404: ErrorSchema},
    summary="Delete product photo",
    description="Delete a photo from a product.",
)
def delete_photo(request, product_id: UUID, photo_id: UUID):
    """Delete a photo from a product."""
    user = request.auth
    
    product = ProductService.get_product_by_id(user, product_id)
    if not product:
        raise HttpError(404, "Product not found")
    
    deleted = ProductService.delete_photo(product, photo_id)
    if not deleted:
        raise HttpError(404, "Photo not found")
    
    return {"message": "Photo deleted successfully"}
