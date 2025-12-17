"""
Pydantic schemas for Chat API.
"""
from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


# =============================================================================
# Input Schemas
# =============================================================================

class CreateThreadInput(BaseModel):
    """Input for creating or getting a chat thread."""
    supplier_id: UUID = Field(..., description="The supplier's user ID")
    product_id: Optional[UUID] = Field(None, description="Optional product ID for product-specific chats")


class SendMessageInput(BaseModel):
    """Input for sending a message."""
    text: str = Field(..., min_length=1, max_length=5000, description="Message text")


# =============================================================================
# Output Schemas
# =============================================================================

class UserSummaryOut(BaseModel):
    """Summary of a user for chat display."""
    id: UUID
    username: str
    user_type: str
    
    class Config:
        from_attributes = True


class ProductSummaryOut(BaseModel):
    """Summary of a product for chat display."""
    id: UUID
    product_name: str
    
    class Config:
        from_attributes = True


class MessageOut(BaseModel):
    """Output schema for a chat message."""
    id: UUID
    sender_id: UUID
    sender_username: str
    text: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class LastMessageOut(BaseModel):
    """Preview of the last message in a thread."""
    id: UUID
    sender_id: UUID
    sender_username: str
    text: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ThreadOut(BaseModel):
    """Output schema for a chat thread."""
    id: UUID
    buyer: UserSummaryOut
    supplier: UserSummaryOut
    product: Optional[ProductSummaryOut] = None
    last_message: Optional[LastMessageOut] = None
    last_message_at: Optional[datetime] = None
    unread_count: int = 0
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ThreadListOut(BaseModel):
    """List of chat threads."""
    threads: list[ThreadOut]
    total: int


class MessageListOut(BaseModel):
    """Paginated list of messages."""
    messages: list[MessageOut]
    total: int
    page: int
    page_size: int
    has_more: bool


class UnreadCountOut(BaseModel):
    """Total unread message count."""
    unread_total: int


class ReadAckOut(BaseModel):
    """Acknowledgement of marking thread as read."""
    thread_id: UUID
    unread_total: int
