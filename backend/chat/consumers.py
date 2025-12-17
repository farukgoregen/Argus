"""
WebSocket consumers for real-time chat.
"""
import json
from uuid import UUID
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from asgiref.sync import sync_to_async

from .models import ChatThread, ChatMessage, ChatThreadParticipant
from .services import ChatService


class ChatNotificationConsumer(AsyncJsonWebsocketConsumer):
    """
    Global notification consumer for chat updates.
    
    Connect: ws://<host>/ws/chat/threads/?token=<JWT>
    
    Server sends:
    - {"type": "unread_count", "unread_total": 3}
    - {"type": "thread_updated", "thread": {...}}
    - {"type": "new_message", "thread_id": "...", "message": {...}}
    """
    
    async def connect(self):
        self.user = self.scope.get('user')
        
        # Reject anonymous users
        if isinstance(self.user, AnonymousUser) or not self.user:
            await self.close(code=4001)
            return
        
        # Create a unique group for this user's notifications
        self.user_group = f"user_{self.user.id}_notifications"
        
        # Join the user's notification group
        await self.channel_layer.group_add(
            self.user_group,
            self.channel_name
        )
        
        await self.accept()
        
        # Send initial unread count
        unread = await self._get_unread_count()
        await self.send_json({
            "type": "unread_count",
            "unread_total": unread
        })
    
    async def disconnect(self, close_code):
        if hasattr(self, 'user_group'):
            await self.channel_layer.group_discard(
                self.user_group,
                self.channel_name
            )
    
    async def receive_json(self, content):
        """Handle incoming messages from client."""
        msg_type = content.get('type')
        
        if msg_type == 'ping':
            await self.send_json({"type": "pong"})
    
    # Event handlers for group messages
    async def chat_notification(self, event):
        """Handle chat notification events."""
        await self.send_json(event['data'])
    
    async def unread_count_update(self, event):
        """Handle unread count updates."""
        await self.send_json({
            "type": "unread_count",
            "unread_total": event['unread_total']
        })
    
    async def new_message_notification(self, event):
        """Handle new message notifications."""
        await self.send_json({
            "type": "new_message",
            "thread_id": event['thread_id'],
            "message": event['message']
        })
    
    async def thread_updated(self, event):
        """Handle thread update notifications."""
        await self.send_json({
            "type": "thread_updated",
            "thread": event['thread']
        })
    
    @database_sync_to_async
    def _get_unread_count(self):
        return ChatService.get_unread_count(self.user)


class ChatThreadConsumer(AsyncJsonWebsocketConsumer):
    """
    Real-time messaging consumer for a specific chat thread.
    
    Connect: ws://<host>/ws/chat/thread/<thread_id>/?token=<JWT>
    
    Client sends:
    - {"type": "send", "text": "Hello!"}
    - {"type": "read"}
    
    Server broadcasts:
    - {"type": "message", "message": {...}}
    - {"type": "read_ack", "thread_id": "...", "user_id": "...", "unread_total": 0}
    """
    
    async def connect(self):
        self.user = self.scope.get('user')
        self.thread_id = self.scope['url_route']['kwargs']['thread_id']
        
        # Reject anonymous users
        if isinstance(self.user, AnonymousUser) or not self.user:
            await self.close(code=4001)
            return
        
        # Verify thread access
        self.thread = await self._get_thread_with_permission()
        if not self.thread:
            await self.close(code=4003)
            return
        
        # Create room group name
        self.room_group = f"chat_thread_{self.thread_id}"
        
        # Join the room group
        await self.channel_layer.group_add(
            self.room_group,
            self.channel_name
        )
        
        await self.accept()
        
        # Auto mark as read when joining
        await self._mark_as_read()
    
    async def disconnect(self, close_code):
        if hasattr(self, 'room_group'):
            await self.channel_layer.group_discard(
                self.room_group,
                self.channel_name
            )
    
    async def receive_json(self, content):
        """Handle incoming messages from client."""
        msg_type = content.get('type')
        
        if msg_type == 'send':
            text = content.get('text', '').strip()
            if text:
                await self._handle_send_message(text)
        
        elif msg_type == 'read':
            await self._mark_as_read()
        
        elif msg_type == 'ping':
            await self.send_json({"type": "pong"})
    
    async def _handle_send_message(self, text: str):
        """Handle sending a message."""
        # Save message to database
        message_data = await self._save_message(text)
        
        # Broadcast to room
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "chat_message",
                "message": message_data
            }
        )
        
        # Notify the other user (if not in this room)
        other_user_id = await self._get_other_user_id()
        await self.channel_layer.group_send(
            f"user_{other_user_id}_notifications",
            {
                "type": "new_message_notification",
                "thread_id": str(self.thread_id),
                "message": message_data
            }
        )
        
        # Send updated unread count to other user
        other_unread = await self._get_other_user_unread()
        await self.channel_layer.group_send(
            f"user_{other_user_id}_notifications",
            {
                "type": "unread_count_update",
                "unread_total": other_unread
            }
        )
    
    async def _mark_as_read(self):
        """Mark thread as read and notify."""
        unread_total = await self._mark_thread_read()
        
        # Send read acknowledgement
        await self.send_json({
            "type": "read_ack",
            "thread_id": str(self.thread_id),
            "unread_total": unread_total
        })
        
        # Notify the sender that recipient read the message
        await self.channel_layer.group_send(
            self.room_group,
            {
                "type": "read_receipt",
                "user_id": str(self.user.id),
                "thread_id": str(self.thread_id)
            }
        )
    
    # Event handlers
    async def chat_message(self, event):
        """Receive message from room group."""
        await self.send_json({
            "type": "message",
            "message": event['message']
        })
    
    async def read_receipt(self, event):
        """Receive read receipt from room group."""
        await self.send_json({
            "type": "read_receipt",
            "user_id": event['user_id'],
            "thread_id": event['thread_id']
        })
    
    # Database operations
    @database_sync_to_async
    def _get_thread_with_permission(self):
        try:
            thread_uuid = UUID(self.thread_id)
        except ValueError:
            return None
        return ChatService.get_thread_with_permission(thread_uuid, self.user)
    
    @database_sync_to_async
    def _save_message(self, text: str) -> dict:
        message = ChatService.send_message(self.thread, self.user, text)
        return {
            "id": str(message.id),
            "sender_id": str(message.sender_id),
            "sender_username": message.sender.username,
            "text": message.text,
            "created_at": message.created_at.isoformat()
        }
    
    @database_sync_to_async
    def _mark_thread_read(self) -> int:
        return ChatService.mark_thread_as_read(self.thread, self.user)
    
    @database_sync_to_async
    def _get_other_user_id(self) -> str:
        other = self.thread.get_other_participant(self.user)
        return str(other.id)
    
    @database_sync_to_async
    def _get_other_user_unread(self) -> int:
        other = self.thread.get_other_participant(self.user)
        return ChatService.get_unread_count(other)
