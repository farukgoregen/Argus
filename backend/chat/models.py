"""
Chat models for real-time 1:1 buyer-supplier messaging.

This module contains:
- ChatThread: Conversation between buyer and supplier (optionally about a product)
- ChatMessage: Individual messages within a thread
- ChatThreadParticipant: Tracks read status and unread counts per user
"""
import uuid
from django.db import models
from django.conf import settings


class ChatThread(models.Model):
    """
    A chat thread between a buyer and a supplier.
    Optionally scoped to a specific product.
    
    Unique constraints:
    - For product-specific chats: unique(buyer, supplier, product)
    - For general chats: unique(buyer, supplier) where product is NULL
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    buyer = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_threads_as_buyer',
        help_text='The buyer in this conversation'
    )
    supplier = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_threads_as_supplier',
        help_text='The supplier in this conversation'
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='chat_threads',
        help_text='The product this conversation is about (optional)'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        # Unique constraint: one thread per buyer+supplier+product combination
        constraints = [
            models.UniqueConstraint(
                fields=['buyer', 'supplier', 'product'],
                name='unique_thread_with_product'
            ),
            models.UniqueConstraint(
                fields=['buyer', 'supplier'],
                condition=models.Q(product__isnull=True),
                name='unique_thread_without_product'
            ),
        ]
    
    def __str__(self):
        product_info = f" about {self.product.product_name}" if self.product else ""
        return f"Chat: {self.buyer.username} <-> {self.supplier.username}{product_info}"
    
    def get_other_participant(self, user):
        """Get the other participant in this thread."""
        if user.id == self.buyer_id:
            return self.supplier
        return self.buyer
    
    def is_participant(self, user):
        """Check if the user is a participant in this thread."""
        return user.id == self.buyer_id or user.id == self.supplier_id


class ChatMessage(models.Model):
    """
    A single message within a chat thread.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    thread = models.ForeignKey(
        ChatThread,
        on_delete=models.CASCADE,
        related_name='messages',
        help_text='The thread this message belongs to'
    )
    sender = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='sent_messages',
        help_text='The user who sent this message'
    )
    text = models.TextField(
        help_text='The message content'
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.sender.username}: {self.text[:50]}..."


class ChatThreadParticipant(models.Model):
    """
    Tracks read status and unread count for each participant in a thread.
    """
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )
    thread = models.ForeignKey(
        ChatThread,
        on_delete=models.CASCADE,
        related_name='participants'
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='chat_participations'
    )
    last_read_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text='When the user last read this thread'
    )
    unread_count = models.PositiveIntegerField(
        default=0,
        help_text='Number of unread messages for this user'
    )
    
    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['thread', 'user'],
                name='unique_thread_participant'
            ),
        ]
    
    def __str__(self):
        return f"{self.user.username} in {self.thread}"
    
    def mark_as_read(self):
        """Mark all messages as read for this participant."""
        from django.utils import timezone
        self.last_read_at = timezone.now()
        self.unread_count = 0
        self.save(update_fields=['last_read_at', 'unread_count'])
