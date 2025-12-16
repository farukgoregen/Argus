"""
Django admin configuration for Home app.
"""
from django.contrib import admin
from .models import SearchEvent


@admin.register(SearchEvent)
class SearchEventAdmin(admin.ModelAdmin):
    """Admin configuration for SearchEvent model."""
    list_display = ['query', 'user', 'created_at']
    list_filter = ['created_at']
    search_fields = ['query', 'user__email', 'user__username']
    readonly_fields = ['id', 'created_at']
    ordering = ['-created_at']
    
    def has_add_permission(self, request):
        """Disable manual creation - search events are auto-generated."""
        return False
    
    def has_change_permission(self, request, obj=None):
        """Disable editing - search events are immutable."""
        return False
