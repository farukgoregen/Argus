"""
Product services for business logic.

This module contains all business logic for:
- Product CRUD operations
- Stock management
- Price updates
- Bulk operations
- Photo management
"""
import logging
from typing import Optional, List, Tuple, Any
from uuid import UUID
from decimal import Decimal
from django.db import transaction
from django.db.models import QuerySet
from django.conf import settings
from django.core.files.uploadedfile import UploadedFile

from .models import Product, ProductPhoto, StockStatus, get_low_stock_threshold

logger = logging.getLogger(__name__)


class ProductService:
    """Service class for product operations."""
    
    @staticmethod
    def get_user_products(user) -> QuerySet[Product]:
        """Get all products owned by the user."""
        return Product.objects.filter(owner=user).prefetch_related('photos')
    
    @staticmethod
    def get_product_by_id(user, product_id: UUID) -> Optional[Product]:
        """
        Get a product by ID for the authenticated user.
        Returns None if not found or not owned by user.
        """
        try:
            return Product.objects.prefetch_related('photos').get(
                id=product_id,
                owner=user
            )
        except Product.DoesNotExist:
            return None
    
    @staticmethod
    def list_products(
        user,
        is_active: Optional[bool] = None,
        stock_status: Optional[str] = None,
        stock_below: Optional[int] = None,
        category: Optional[str] = None,
        search: Optional[str] = None,
        sort: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Product], int]:
        """
        List products with filtering, sorting, and pagination.
        
        Returns:
            Tuple of (products list, total count)
        """
        from django.db.models import Q
        
        queryset = Product.objects.filter(owner=user).prefetch_related('photos')
        
        # Apply filters
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active)
        
        if stock_below is not None:
            queryset = queryset.filter(stock_quantity__lt=stock_below)
        
        # Filter by category (exact match)
        if category:
            queryset = queryset.filter(product_category=category)
        
        # Search product_name and description (icontains)
        if search:
            search_term = search.strip()
            if search_term:
                queryset = queryset.filter(
                    Q(product_name__icontains=search_term) |
                    Q(description__icontains=search_term)
                )
        
        # Handle stock_status filter (computed field)
        if stock_status:
            threshold = get_low_stock_threshold()
            if stock_status == StockStatus.OUT_OF_STOCK.value:
                queryset = queryset.filter(stock_quantity=0)
            elif stock_status == StockStatus.LOW_STOCK.value:
                queryset = queryset.filter(stock_quantity__gt=0, stock_quantity__lt=threshold)
            elif stock_status == StockStatus.IN_STOCK.value:
                queryset = queryset.filter(stock_quantity__gte=threshold)
        
        # Apply sorting
        valid_sort_fields = {
            'created_at': 'created_at',
            '-created_at': '-created_at',
            'updated_at': 'updated_at',
            '-updated_at': '-updated_at',
            'unit_price': 'unit_price',
            '-unit_price': '-unit_price',
            'product_name': 'product_name',
            '-product_name': '-product_name',
        }
        if sort and sort in valid_sort_fields:
            queryset = queryset.order_by(valid_sort_fields[sort])
        else:
            queryset = queryset.order_by('-created_at')
        
        # Get total count before pagination
        total = queryset.count()
        
        # Apply pagination
        offset = (page - 1) * page_size
        products = list(queryset[offset:offset + page_size])
        
        return products, total
    
    @staticmethod
    @transaction.atomic
    def create_product(
        user,
        product_name: str,
        product_category: str,
        unit_price: Decimal,
        description: Optional[str] = None,
        stock_quantity: int = 0,
        sell_quantity: int = 1,
        features: Optional[dict] = None,
        is_active: bool = True,
        photos: Optional[List[UploadedFile]] = None,
    ) -> Product:
        """
        Create a new product with optional photos.
        
        Uses transaction.atomic to ensure data consistency.
        """
        product = Product.objects.create(
            owner=user,
            product_name=product_name,
            product_category=product_category,
            description=description,
            unit_price=unit_price,
            stock_quantity=stock_quantity,
            sell_quantity=sell_quantity,
            features=features or {},
            is_active=is_active,
        )
        
        # Add photos if provided
        if photos:
            for idx, photo in enumerate(photos):
                ProductPhoto.objects.create(
                    product=product,
                    image=photo,
                    sort_order=idx,
                )
        
        logger.info(f"Created product {product.id} '{product_name}' for user {user.email}")
        return product
    
    @staticmethod
    @transaction.atomic
    def update_product(
        product: Product,
        product_name: Optional[str] = None,
        product_category: Optional[str] = None,
        description: Optional[str] = None,
        unit_price: Optional[Decimal] = None,
        stock_quantity: Optional[int] = None,
        sell_quantity: Optional[int] = None,
        features: Optional[dict] = None,
        is_active: Optional[bool] = None,
        photos_to_add: Optional[List[Tuple[UploadedFile, int]]] = None,
        photos_to_update: Optional[List[Tuple[UUID, int]]] = None,
        photos_to_delete: Optional[List[UUID]] = None,
    ) -> Product:
        """
        Update a product with partial data and photo operations.
        
        Uses transaction.atomic to ensure data consistency.
        """
        update_fields = ['updated_at']
        
        if product_name is not None:
            product.product_name = product_name
            update_fields.append('product_name')
        
        if product_category is not None:
            product.product_category = product_category
            update_fields.append('product_category')
        
        if description is not None:
            product.description = description
            update_fields.append('description')
        
        if unit_price is not None:
            product.unit_price = unit_price
            update_fields.append('unit_price')
        
        if stock_quantity is not None:
            product.stock_quantity = stock_quantity
            update_fields.append('stock_quantity')
        
        if sell_quantity is not None:
            product.sell_quantity = sell_quantity
            update_fields.append('sell_quantity')
        
        if features is not None:
            product.features = features
            update_fields.append('features')
        
        if is_active is not None:
            product.is_active = is_active
            update_fields.append('is_active')
        
        product.save(update_fields=update_fields)
        
        # Handle photo operations
        if photos_to_delete:
            ProductPhoto.objects.filter(
                id__in=photos_to_delete,
                product=product
            ).delete()
        
        if photos_to_update:
            for photo_id, sort_order in photos_to_update:
                ProductPhoto.objects.filter(
                    id=photo_id,
                    product=product
                ).update(sort_order=sort_order)
        
        if photos_to_add:
            for photo, sort_order in photos_to_add:
                ProductPhoto.objects.create(
                    product=product,
                    image=photo,
                    sort_order=sort_order,
                )
        
        # Refresh to get updated photos
        product.refresh_from_db()
        logger.info(f"Updated product {product.id}")
        return product
    
    @staticmethod
    def update_price(product: Product, unit_price: Decimal) -> Product:
        """Update only the product price."""
        product.unit_price = unit_price
        product.save(update_fields=['unit_price', 'updated_at'])
        logger.info(f"Updated price for product {product.id} to {unit_price}")
        return product
    
    @staticmethod
    def update_stock(product: Product, stock_quantity: int) -> Product:
        """Update only the product stock quantity."""
        product.stock_quantity = stock_quantity
        product.save(update_fields=['stock_quantity', 'updated_at'])
        logger.info(f"Updated stock for product {product.id} to {stock_quantity}")
        return product
    
    @staticmethod
    def soft_delete(product: Product) -> Product:
        """Soft delete a product (set is_active=False)."""
        product.soft_delete()
        logger.info(f"Soft deleted product {product.id}")
        return product
    
    @staticmethod
    def activate(product: Product) -> Product:
        """Activate a product."""
        product.activate()
        logger.info(f"Activated product {product.id}")
        return product
    
    @staticmethod
    def deactivate(product: Product) -> Product:
        """Deactivate a product."""
        product.deactivate()
        logger.info(f"Deactivated product {product.id}")
        return product
    
    @staticmethod
    def get_critical_stock(user, threshold: int = 10) -> List[Product]:
        """
        Get products with critical stock levels.
        
        Returns active products with stock_quantity < threshold.
        """
        return list(
            Product.objects.filter(
                owner=user,
                is_active=True,
                stock_quantity__lt=threshold,
            ).prefetch_related('photos').order_by('stock_quantity')
        )
    
    @staticmethod
    @transaction.atomic
    def bulk_update_prices(
        user,
        items: List[dict],
    ) -> Tuple[int, int, List[dict]]:
        """
        Bulk update product prices.
        
        Args:
            user: The authenticated user
            items: List of {id, unit_price} dicts
        
        Returns:
            Tuple of (updated_count, failed_count, results)
        """
        updated = 0
        failed = 0
        results = []
        
        for item in items:
            product_id = item['id']
            unit_price = item['unit_price']
            
            try:
                product = Product.objects.get(id=product_id, owner=user)
                product.unit_price = unit_price
                product.save(update_fields=['unit_price', 'updated_at'])
                updated += 1
                results.append({
                    'id': product_id,
                    'success': True,
                    'error': None,
                })
            except Product.DoesNotExist:
                failed += 1
                results.append({
                    'id': product_id,
                    'success': False,
                    'error': 'Product not found',
                })
            except Exception as e:
                failed += 1
                results.append({
                    'id': product_id,
                    'success': False,
                    'error': str(e),
                })
        
        logger.info(f"Bulk price update: {updated} updated, {failed} failed")
        return updated, failed, results
    
    @staticmethod
    @transaction.atomic
    def bulk_update_stock(
        user,
        items: List[dict],
    ) -> Tuple[int, int, List[dict]]:
        """
        Bulk update product stock quantities.
        
        Args:
            user: The authenticated user
            items: List of {id, stock_quantity} dicts
        
        Returns:
            Tuple of (updated_count, failed_count, results)
        """
        updated = 0
        failed = 0
        results = []
        
        for item in items:
            product_id = item['id']
            stock_quantity = item['stock_quantity']
            
            try:
                product = Product.objects.get(id=product_id, owner=user)
                product.stock_quantity = stock_quantity
                product.save(update_fields=['stock_quantity', 'updated_at'])
                updated += 1
                results.append({
                    'id': product_id,
                    'success': True,
                    'error': None,
                })
            except Product.DoesNotExist:
                failed += 1
                results.append({
                    'id': product_id,
                    'success': False,
                    'error': 'Product not found',
                })
            except Exception as e:
                failed += 1
                results.append({
                    'id': product_id,
                    'success': False,
                    'error': str(e),
                })
        
        logger.info(f"Bulk stock update: {updated} updated, {failed} failed")
        return updated, failed, results
    
    @staticmethod
    def add_photo(
        product: Product,
        image: UploadedFile,
        sort_order: int = 0,
    ) -> ProductPhoto:
        """Add a photo to a product."""
        photo = ProductPhoto.objects.create(
            product=product,
            image=image,
            sort_order=sort_order,
        )
        logger.info(f"Added photo {photo.id} to product {product.id}")
        return photo
    
    @staticmethod
    def delete_photo(product: Product, photo_id: UUID) -> bool:
        """Delete a photo from a product."""
        deleted, _ = ProductPhoto.objects.filter(
            id=photo_id,
            product=product
        ).delete()
        if deleted:
            logger.info(f"Deleted photo {photo_id} from product {product.id}")
        return deleted > 0
