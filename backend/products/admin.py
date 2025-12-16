"""
Django Admin configuration for Product models.
"""
from django.contrib import admin
from .models import Product, ProductPhoto


class ProductPhotoInline(admin.TabularInline):
    """Inline admin for product photos."""
    model = ProductPhoto
    extra = 1
    fields = ['image', 'sort_order', 'created_at']
    readonly_fields = ['created_at']
    ordering = ['sort_order']


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Admin configuration for Product model."""
    list_display = [
        'id',
        'owner',
        'unit_price',
        'stock_quantity',
        'stock_status',
        'is_active',
        'created_at',
        'updated_at',
    ]
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = ['id', 'owner__email', 'owner__username']
    readonly_fields = ['id', 'stock_status', 'created_at', 'updated_at']
    ordering = ['-created_at']
    inlines = [ProductPhotoInline]
    
    fieldsets = [
        (None, {
            'fields': ['id', 'owner', 'is_active']
        }),
        ('Pricing', {
            'fields': ['unit_price']
        }),
        ('Stock', {
            'fields': ['stock_quantity', 'sell_quantity', 'stock_status']
        }),
        ('Features', {
            'fields': ['features']
        }),
        ('Timestamps', {
            'fields': ['created_at', 'updated_at'],
            'classes': ['collapse']
        }),
    ]


@admin.register(ProductPhoto)
class ProductPhotoAdmin(admin.ModelAdmin):
    """Admin configuration for ProductPhoto model."""
    list_display = ['id', 'product', 'sort_order', 'created_at']
    list_filter = ['created_at']
    search_fields = ['product__id']
    readonly_fields = ['id', 'created_at']
    ordering = ['product', 'sort_order']
