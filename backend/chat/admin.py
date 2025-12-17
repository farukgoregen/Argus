from django.contrib import admin
from .models import ChatThread, ChatMessage, ChatThreadParticipant


@admin.register(ChatThread)
class ChatThreadAdmin(admin.ModelAdmin):
    list_display = ['id', 'buyer', 'supplier', 'product', 'created_at', 'updated_at']
    list_filter = ['created_at']
    search_fields = ['buyer__username', 'supplier__username', 'product__product_name']
    readonly_fields = ['id', 'created_at', 'updated_at']


@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ['id', 'thread', 'sender', 'text_preview', 'created_at']
    list_filter = ['created_at']
    search_fields = ['sender__username', 'text']
    readonly_fields = ['id', 'created_at']
    
    def text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Text'


@admin.register(ChatThreadParticipant)
class ChatThreadParticipantAdmin(admin.ModelAdmin):
    list_display = ['id', 'thread', 'user', 'unread_count', 'last_read_at']
    list_filter = ['last_read_at']
    search_fields = ['user__username']
    readonly_fields = ['id']
