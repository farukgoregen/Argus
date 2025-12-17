"""
Chat REST API endpoints.
"""
from uuid import UUID
from ninja import Router
from ninja_jwt.authentication import JWTAuth
from django.http import Http404

from users.models import User, UserType
from products.models import Product
from .models import ChatThread
from .services import ChatService
from .schemas import (
    CreateThreadInput,
    SendMessageInput,
    ThreadOut,
    ThreadListOut,
    MessageOut,
    MessageListOut,
    UnreadCountOut,
    ReadAckOut,
    UserSummaryOut,
    ProductSummaryOut,
    LastMessageOut,
)


router = Router(auth=JWTAuth())


def _build_thread_out(thread: ChatThread, user: User) -> ThreadOut:
    """Build ThreadOut from a ChatThread model."""
    # Get last message
    last_msg = ChatService.get_last_message(thread)
    
    # Get unread count for this user
    unread = ChatService.get_thread_unread_count(thread, user)
    
    # Build response
    buyer_out = UserSummaryOut(
        id=thread.buyer.id,
        username=thread.buyer.username,
        user_type=thread.buyer.user_type
    )
    
    supplier_out = UserSummaryOut(
        id=thread.supplier.id,
        username=thread.supplier.username,
        user_type=thread.supplier.user_type
    )
    
    product_out = None
    if thread.product:
        product_out = ProductSummaryOut(
            id=thread.product.id,
            product_name=thread.product.product_name
        )
    
    last_message_out = None
    last_message_at = None
    if last_msg:
        last_message_out = LastMessageOut(
            id=last_msg.id,
            sender_id=last_msg.sender_id,
            sender_username=last_msg.sender.username,
            text=last_msg.text,
            created_at=last_msg.created_at
        )
        last_message_at = last_msg.created_at
    
    return ThreadOut(
        id=thread.id,
        buyer=buyer_out,
        supplier=supplier_out,
        product=product_out,
        last_message=last_message_out,
        last_message_at=last_message_at,
        unread_count=unread,
        created_at=thread.created_at,
        updated_at=thread.updated_at
    )


@router.get("/threads", response=ThreadListOut, summary="Get user's chat threads")
def get_threads(request):
    """
    Get all chat threads for the authenticated user.
    Returns threads with last message preview and unread counts.
    """
    user = request.auth
    threads = ChatService.get_user_threads(user)
    
    thread_outs = [_build_thread_out(t, user) for t in threads]
    
    return ThreadListOut(
        threads=thread_outs,
        total=len(thread_outs)
    )


@router.post("/threads", response=ThreadOut, summary="Create or get chat thread")
def create_or_get_thread(request, payload: CreateThreadInput):
    """
    Create a new chat thread or return existing one.
    Idempotent: if thread already exists, returns it.
    
    The current user becomes the buyer, and the specified supplier_id
    must be a supplier user.
    """
    user = request.auth
    
    # Get supplier
    try:
        supplier = User.objects.get(id=payload.supplier_id)
    except User.DoesNotExist:
        raise Http404("Supplier not found")
    
    if supplier.user_type != UserType.SUPPLIER:
        raise Http404("User is not a supplier")
    
    # Cannot chat with yourself
    if supplier.id == user.id:
        raise Http404("Cannot create chat with yourself")
    
    # Get product if specified
    product = None
    if payload.product_id:
        try:
            product = Product.objects.get(id=payload.product_id)
        except Product.DoesNotExist:
            raise Http404("Product not found")
        
        # Verify product belongs to the supplier
        if product.owner_id != supplier.id:
            raise Http404("Product does not belong to this supplier")
    
    # Determine buyer - if current user is buyer, use them; 
    # if current user is supplier, they're initiating so the other is buyer
    if user.user_type == UserType.BUYER:
        buyer = user
    else:
        # Supplier initiating chat - swap roles
        buyer = supplier
        supplier = user
    
    # Get or create thread
    thread, created = ChatService.get_or_create_thread(
        buyer=buyer,
        supplier=supplier,
        product=product
    )
    
    return _build_thread_out(thread, user)


@router.get(
    "/threads/{thread_id}/messages",
    response=MessageListOut,
    summary="Get messages in a thread"
)
def get_messages(
    request,
    thread_id: UUID,
    page: int = 1,
    page_size: int = 20
):
    """
    Get paginated messages from a chat thread.
    Messages are returned oldest-first within each page.
    Use page parameter to load older messages.
    """
    user = request.auth
    
    # Validate page_size
    page_size = min(max(page_size, 1), 100)
    page = max(page, 1)
    
    # Get thread with permission check
    thread = ChatService.get_thread_with_permission(thread_id, user)
    if not thread:
        raise Http404("Thread not found or access denied")
    
    # Get messages
    messages, total, has_more = ChatService.get_messages(thread, page, page_size)
    
    # Build response
    message_outs = [
        MessageOut(
            id=m.id,
            sender_id=m.sender_id,
            sender_username=m.sender.username,
            text=m.text,
            created_at=m.created_at
        )
        for m in messages
    ]
    
    return MessageListOut(
        messages=message_outs,
        total=total,
        page=page,
        page_size=page_size,
        has_more=has_more
    )


@router.post(
    "/threads/{thread_id}/messages",
    response=MessageOut,
    summary="Send a message"
)
def send_message(request, thread_id: UUID, payload: SendMessageInput):
    """
    Send a message in a chat thread.
    This is a REST fallback; WebSocket is the primary method.
    """
    user = request.auth
    
    # Get thread with permission check
    thread = ChatService.get_thread_with_permission(thread_id, user)
    if not thread:
        raise Http404("Thread not found or access denied")
    
    # Send message
    message = ChatService.send_message(thread, user, payload.text)
    
    return MessageOut(
        id=message.id,
        sender_id=message.sender_id,
        sender_username=message.sender.username,
        text=message.text,
        created_at=message.created_at
    )


@router.post(
    "/threads/{thread_id}/read",
    response=ReadAckOut,
    summary="Mark thread as read"
)
def mark_thread_read(request, thread_id: UUID):
    """
    Mark all messages in a thread as read for the current user.
    Returns the new total unread count.
    """
    user = request.auth
    
    # Get thread with permission check
    thread = ChatService.get_thread_with_permission(thread_id, user)
    if not thread:
        raise Http404("Thread not found or access denied")
    
    # Mark as read
    unread_total = ChatService.mark_thread_as_read(thread, user)
    
    return ReadAckOut(
        thread_id=thread_id,
        unread_total=unread_total
    )


@router.get("/unread-count", response=UnreadCountOut, summary="Get total unread count")
def get_unread_count(request):
    """
    Get the total unread message count across all threads.
    Used to initialize the notification badge on page load.
    """
    user = request.auth
    unread = ChatService.get_unread_count(user)
    
    return UnreadCountOut(unread_total=unread)
