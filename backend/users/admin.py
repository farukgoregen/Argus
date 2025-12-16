from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.translation import gettext_lazy as _

from .models import User, Region, Category, SupplierProfile, BuyerProfile


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin for User model."""
    
    list_display = ('email', 'username', 'user_type', 'is_active', 'is_staff', 'created_at')
    list_filter = ('user_type', 'is_active', 'is_staff', 'is_superuser', 'created_at')
    search_fields = ('email', 'username')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    
    fieldsets = (
        (None, {'fields': ('id', 'email', 'password')}),
        (_('Personal info'), {'fields': ('username', 'user_type')}),
        (_('Permissions'), {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
        }),
        (_('Important dates'), {'fields': ('last_login', 'created_at', 'updated_at')}),
    )
    
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'username', 'user_type', 'password1', 'password2'),
        }),
    )


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    """Admin for Region model."""
    
    list_display = ('name', 'code', 'created_at')
    search_fields = ('name', 'code')
    ordering = ('name',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin for Category model."""
    
    list_display = ('name', 'code', 'parent', 'created_at')
    list_filter = ('parent',)
    search_fields = ('name', 'code')
    ordering = ('name',)
    readonly_fields = ('id', 'created_at', 'updated_at')


@admin.register(SupplierProfile)
class SupplierProfileAdmin(admin.ModelAdmin):
    """Admin for SupplierProfile model."""
    
    list_display = (
        'company_name', 'user', 'phone', 'trust_score', 
        'on_time_delivery_rate', 'created_at'
    )
    list_filter = ('trust_score', 'working_regions', 'created_at')
    search_fields = ('company_name', 'user__email', 'phone')
    ordering = ('-trust_score', '-created_at')
    readonly_fields = ('id', 'created_at', 'updated_at')
    filter_horizontal = ('working_regions',)
    
    fieldsets = (
        (None, {'fields': ('id', 'user', 'company_name', 'logo')}),
        (_('Contact Information'), {'fields': ('phone', 'website')}),
        (_('Business Details'), {
            'fields': ('description', 'working_regions', 'main_production_location')
        }),
        (_('Performance Metrics'), {
            'fields': (
                'trust_score', 'on_time_delivery_rate', 
                'avg_response_time', 'cancellation_rate'
            )
        }),
        (_('Policies & Certifications'), {
            'fields': ('return_policy', 'certifications')
        }),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )


@admin.register(BuyerProfile)
class BuyerProfileAdmin(admin.ModelAdmin):
    """Admin for BuyerProfile model."""
    
    list_display = ('company_name', 'user', 'phone', 'payment_method', 'created_at')
    list_filter = ('preferred_regions', 'preferred_categories', 'created_at')
    search_fields = ('company_name', 'user__email', 'phone')
    ordering = ('-created_at',)
    readonly_fields = ('id', 'created_at', 'updated_at')
    filter_horizontal = ('preferred_regions', 'preferred_categories')
    
    fieldsets = (
        (None, {'fields': ('id', 'user', 'company_name', 'logo')}),
        (_('Contact Information'), {'fields': ('phone',)}),
        (_('Preferences'), {
            'fields': ('preferred_regions', 'preferred_categories', 'payment_method')
        }),
        (_('Timestamps'), {'fields': ('created_at', 'updated_at')}),
    )
