"""
Chat services for business logic.
"""
from typing import Optional
from uuid import UUID
from django.db import transaction
from django.db.models import Q, Max, Prefetch
from django.utils import timezone

from users.models import User
from products.models import Product
from .models import ChatThread, ChatMessage, ChatThreadParticipant


class ChatService:
    """Service for chat operations."""
    
    @staticmethod
    def get_or_create_thread(
        buyer: User,
        supplier: User,
        product: Optional[Product] = None
    ) -> tuple[ChatThread, bool]:
        """
        Get or create a chat thread between buyer and supplier.
        Returns (thread, created) tuple.
        """
        with transaction.atomic():
            # Look for existing thread
            lookup = Q(buyer=buyer, supplier=supplier)
            if product:
                lookup &= Q(product=product)
            else:
                lookup &= Q(product__isnull=True)
            
            existing = ChatThread.objects.filter(lookup).first()
            if existing:
                return existing, False
            
            # Create new thread
            thread = ChatThread.objects.create(
                buyer=buyer,
                supplier=supplier,
                product=product
            )
            
            # Create participant records for both users
            ChatThreadParticipant.objects.bulk_create([
                ChatThreadParticipant(thread=thread, user=buyer, unread_count=0),
                ChatThreadParticipant(thread=thread, user=supplier, unread_count=0),
            ])
            
            return thread, True
    
    @staticmethod
    def get_user_threads(user: User) -> list[ChatThread]:
        """
        Get all chat threads for a user with optimized queries.
        Includes last message preview and unread counts.
        """
        # Get threads where user is buyer or supplier
        threads = ChatThread.objects.filter(
            Q(buyer=user) | Q(supplier=user)
        ).select_related(
            'buyer', 'supplier', 'product'
        ).prefetch_related(
            Prefetch(
                'participants',
                queryset=ChatThreadParticipant.objects.filter(user=user),
                to_attr='user_participation'
            )
        ).annotate(
            last_msg_time=Max('messages__created_at')
        ).order_by('-updated_at')
        
        return list(threads)
    
    @staticmethod
    def get_thread_with_permission(thread_id: UUID, user: User) -> Optional[ChatThread]:
        """Get a thread if user has permission to access it."""
        try:
            thread = ChatThread.objects.select_related(
                'buyer', 'supplier', 'product'
            ).get(id=thread_id)
            
            if not thread.is_participant(user):
                return None
            
            return thread
        except ChatThread.DoesNotExist:
            return None
    
    @staticmethod
    def get_messages(
        thread: ChatThread,
        page: int = 1,
        page_size: int = 20
    ) -> tuple[list[ChatMessage], int, bool]:
        """
        Get paginated messages for a thread.
        Returns (messages, total_count, has_more).
        Messages are ordered oldest first.
        """
        total = thread.messages.count()
        
        # Calculate offset for pagination (newest messages first for loading)
        offset = (page - 1) * page_size
        
        # Get messages ordered by created_at (oldest first within page)
        messages = list(
            thread.messages
            .select_related('sender')
            .order_by('-created_at')[offset:offset + page_size]
        )
        
        # Reverse to show oldest first
        messages.reverse()
        
        has_more = (page * page_size) < total
        
        return messages, total, has_more
    
    @staticmethod
    @transaction.atomic
    def send_message(
        thread: ChatThread,
        sender: User,
        text: str
    ) -> ChatMessage:
        """
        Send a message in a thread.
        Updates thread.updated_at and increments unread count for other participant.
        """
        # Create the message
        message = ChatMessage.objects.create(
            thread=thread,
            sender=sender,
            text=text
        )
        
        # Update thread timestamp
        thread.updated_at = timezone.now()
        thread.save(update_fields=['updated_at'])
        
        # Increment unread count for the other participant
        other_user_id = thread.buyer_id if sender.id == thread.supplier_id else thread.supplier_id
        ChatThreadParticipant.objects.filter(
            thread=thread,
            user_id=other_user_id
        ).update(unread_count=models.F('unread_count') + 1)
        
        return message
    
    @staticmethod
    def mark_thread_as_read(thread: ChatThread, user: User) -> int:
        """
        Mark a thread as read for a user.
        Returns the new total unread count for the user.
        """
        # Update the participant record
        ChatThreadParticipant.objects.filter(
            thread=thread,
            user=user
        ).update(
            last_read_at=timezone.now(),
            unread_count=0
        )
        
        # Return total unread
        return ChatService.get_unread_count(user)
    
    @staticmethod
    def get_unread_count(user: User) -> int:
        """Get total unread message count for a user across all threads."""
        from django.db.models import Sum
        
        result = ChatThreadParticipant.objects.filter(
            user=user
        ).aggregate(total=Sum('unread_count'))
        
        return result['total'] or 0
    
    @staticmethod
    def get_last_message(thread: ChatThread) -> Optional[ChatMessage]:
        """Get the last message in a thread."""
        return thread.messages.select_related('sender').order_by('-created_at').first()
    
    @staticmethod
    def get_thread_unread_count(thread: ChatThread, user: User) -> int:
        """Get unread count for a specific thread and user."""
        try:
            participant = ChatThreadParticipant.objects.get(
                thread=thread,
                user=user
            )
            return participant.unread_count
        except ChatThreadParticipant.DoesNotExist:
            return 0


# Need to import models.F for the increment
from django.db import models
