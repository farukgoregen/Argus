"""
WebSocket URL routing for chat.
"""
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Global notifications
    re_path(r'ws/chat/threads/$', consumers.ChatNotificationConsumer.as_asgi()),
    
    # Thread-specific messaging
    re_path(r'ws/chat/thread/(?P<thread_id>[0-9a-f-]+)/$', consumers.ChatThreadConsumer.as_asgi()),
]
