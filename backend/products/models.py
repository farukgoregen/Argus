"""
Product models for the B2B Supplier-Buyer Platform.

This module contains:
- Product: Main product model with stock management
- ProductPhoto: Support for multiple product images
"""
import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator


class StockStatus(models.TextChoices):
    """Stock status choices derived from stock_quantity."""
    IN_STOCK = 'in_stock', 'In Stock'
    LOW_STOCK = 'low_stock', 'Low Stock'
    OUT_OF_STOCK = 'out_of_stock', 'Out of Stock'


def get_low_stock_threshold() -> int:
    """Get the configurable low stock threshold from settings."""
    return getattr(settings, 'PRODUCT_LOW_STOCK_THRESHOLD', 10)


class Product(models.Model):
    """
    Product model for suppliers to manage their inventory.
    
    Stock status is computed dynamically based on stock_quantity
    and the configurable LOW_STOCK_THRESHOLD.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='products',
        help_text='The user who owns this product'
    )
    
    # Product Information
    product_name = models.CharField(
        max_length=200,
        db_index=True,
        blank=True,
        default='',
        help_text='Name of the product'
    )
    product_category = models.CharField(
        max_length=120,
        db_index=True,
        blank=True,
        default='',
        help_text='Category of the product'
    )
    description = models.TextField(
        blank=True,
        null=True,
        help_text='Detailed product description'
    )
    
    # Pricing
    unit_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Price per unit'
    )
    
    # Stock management
    stock_quantity = models.PositiveIntegerField(
        default=0,
        help_text='Current stock quantity'
    )
    sell_quantity = models.PositiveIntegerField(
        default=1,
        validators=[MinValueValidator(1)],
        help_text='Minimum purchasable quantity (MOQ)'
    )
    
    # Features as structured JSON
    features = models.JSONField(
        default=dict,
        blank=True,
        help_text='Structured key/value attributes (e.g., {"color": "black", "material": "steel"})'
    )
    
    # Status
    is_active = models.BooleanField(
        default=True,
        help_text='Whether the product is active and visible'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'product'
        verbose_name_plural = 'products'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'is_active'], name='product_owner_active_idx'),
            models.Index(fields=['stock_quantity'], name='product_stock_qty_idx'),
            models.Index(fields=['created_at'], name='product_created_idx'),
            models.Index(fields=['product_name'], name='product_name_idx'),
            models.Index(fields=['product_category'], name='product_category_idx'),
        ]
    
    def __str__(self):
        name = self.product_name or f"Product {self.id}"
        return f"{name} (Owner: {self.owner.email})"
    
    @property
    def price(self) -> Decimal:
        """Alias for unit_price - provides read-only price access."""
        return self.unit_price
    
    @property
    def stock_status(self) -> str:
        """
        Compute stock status dynamically based on stock_quantity.
        
        Returns:
            - 'out_of_stock' if stock_quantity == 0
            - 'low_stock' if 0 < stock_quantity < threshold
            - 'in_stock' if stock_quantity >= threshold
        """
        if self.stock_quantity == 0:
            return StockStatus.OUT_OF_STOCK.value
        elif self.stock_quantity < get_low_stock_threshold():
            return StockStatus.LOW_STOCK.value
        return StockStatus.IN_STOCK.value
    
    def soft_delete(self) -> None:
        """Soft delete the product by setting is_active to False."""
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])
    
    def activate(self) -> None:
        """Activate the product."""
        self.is_active = True
        self.save(update_fields=['is_active', 'updated_at'])
    
    def deactivate(self) -> None:
        """Deactivate the product."""
        self.is_active = False
        self.save(update_fields=['is_active', 'updated_at'])


class ProductPhoto(models.Model):
    """
    ProductPhoto model for supporting multiple images per product.
    
    Follows existing media handling conventions (local MEDIA_ROOT).
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='photos'
    )
    image = models.ImageField(
        upload_to='product_photos/',
        help_text='Product image file'
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text='Display order (lower = first)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'product photo'
        verbose_name_plural = 'product photos'
        ordering = ['sort_order', 'created_at']
        indexes = [
            models.Index(fields=['product', 'sort_order'], name='photo_product_order_idx'),
        ]
    
    def __str__(self):
        return f"Photo {self.id} for Product {self.product_id}"
    
    @property
    def url(self) -> str:
        """Return the URL of the image."""
        if self.image and hasattr(self.image, 'url'):
            return self.image.url
        return ''
