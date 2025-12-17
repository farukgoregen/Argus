"""
Home feed models for the B2B Supplier-Buyer Platform.

This module contains:
- SearchEvent: Tracks user search history for the "recent searches" feature
- WatchlistItem: Tracks products users are watching for price alerts
"""
import uuid
from django.db import models
from django.conf import settings
from django.utils import timezone
from datetime import timedelta


class SearchEvent(models.Model):
    """
    SearchEvent model for tracking user search history.
    
    Used to display "recent searches" section on the homepage.
    Stores the last searches made by each user.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='search_events',
        help_text='The user who performed this search'
    )
    query = models.CharField(
        max_length=255,
        help_text='The search query text'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'search event'
        verbose_name_plural = 'search events'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', '-created_at'], name='searchevent_user_created_idx'),
        ]
    
    def __str__(self):
        return f"Search '{self.query}' by {self.user.email} at {self.created_at}"
    
    @classmethod
    def record_search(cls, user, query: str, dedupe_window_minutes: int = 5):
        """
        Record a search event for a user.
        
        Deduplicates consecutive identical queries within the specified window.
        
        Args:
            user: The user performing the search
            query: The search query text
            dedupe_window_minutes: Time window to check for duplicate queries (default: 5)
        
        Returns:
            SearchEvent or None if deduplicated
        """
        query = query.strip()
        if not query:
            return None
        
        # Check for recent identical query within the dedupe window
        cutoff_time = timezone.now() - timedelta(minutes=dedupe_window_minutes)
        recent_same_query = cls.objects.filter(
            user=user,
            query__iexact=query,
            created_at__gte=cutoff_time
        ).exists()
        
        if recent_same_query:
            return None
        
        return cls.objects.create(user=user, query=query)
    
    @classmethod
    def get_recent_for_user(cls, user, limit: int = 5):
        """
        Get the most recent unique searches for a user.
        
        Args:
            user: The user to get searches for
            limit: Maximum number of searches to return (default: 5)
        
        Returns:
            List of SearchEvent objects
        """
        # Get recent searches, ensuring uniqueness by query text
        seen_queries = set()
        result = []
        
        for event in cls.objects.filter(user=user).order_by('-created_at')[:limit * 2]:
            query_lower = event.query.lower()
            if query_lower not in seen_queries:
                seen_queries.add(query_lower)
                result.append(event)
                if len(result) >= limit:
                    break
        
        return result


class WatchlistItem(models.Model):
    """
    WatchlistItem model for tracking products users are watching.
    
    Allows users to track products and receive price alerts.
    Each user can only watch a product once (unique constraint).
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='watchlist_items',
        help_text='The user who is watching this product'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='watchlist_entries',
        help_text='The product being watched'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name = 'watchlist item'
        verbose_name_plural = 'watchlist items'
        ordering = ['-created_at']
        # Prevent duplicate entries: a user can only watch a product once
        constraints = [
            models.UniqueConstraint(
                fields=['user', 'product'],
                name='unique_user_product_watchlist'
            )
        ]
        indexes = [
            models.Index(fields=['user', '-created_at'], name='watchlist_user_created_idx'),
        ]
    
    def __str__(self):
        return f"{self.user.email} watching {self.product.product_name}"
    
    @classmethod
    def add_to_watchlist(cls, user, product):
        """
        Add a product to user's watchlist.
        
        Returns (item, created) tuple. If item already exists, returns existing item.
        """
        item, created = cls.objects.get_or_create(
            user=user,
            product=product
        )
        return item, created
    
    @classmethod
    def remove_from_watchlist(cls, user, product_id) -> bool:
        """
        Remove a product from user's watchlist.
        
        Returns True if item was deleted, False if not found.
        """
        deleted_count, _ = cls.objects.filter(
            user=user,
            product_id=product_id
        ).delete()
        return deleted_count > 0
    
    @classmethod
    def is_in_watchlist(cls, user, product_id) -> bool:
        """Check if a product is in user's watchlist."""
        return cls.objects.filter(user=user, product_id=product_id).exists()
    
    @classmethod
    def get_product_ids_for_user(cls, user) -> list:
        """Get list of product IDs in user's watchlist."""
        return list(
            cls.objects.filter(user=user).values_list('product_id', flat=True)
        )
