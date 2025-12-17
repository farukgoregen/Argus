/**
 * Chat Service
 * 
 * Handles all REST API calls for real-time chat functionality.
 */
import apiClient from '../api-client';
import type {
  ChatThread,
  ChatThreadListResponse,
  ChatMessage,
  ChatMessageListResponse,
  ChatUnreadCountResponse,
  ChatReadAckResponse,
  CreateChatThreadRequest,
  SendChatMessageRequest,
} from '../api-types';

export const chatService = {
  /**
   * Get all chat threads for the current user
   */
  getThreads: () => 
    apiClient.get<ChatThreadListResponse>('/chat/threads'),

  /**
   * Create or get existing chat thread
   */
  createOrGetThread: (data: CreateChatThreadRequest) =>
    apiClient.post<ChatThread>('/chat/threads', data),

  /**
   * Get messages in a thread
   */
  getMessages: (threadId: string, page: number = 1, pageSize: number = 20) =>
    apiClient.get<ChatMessageListResponse>(
      `/chat/threads/${threadId}/messages?page=${page}&page_size=${pageSize}`
    ),

  /**
   * Send a message via REST (fallback for WebSocket)
   */
  sendMessage: (threadId: string, data: SendChatMessageRequest) =>
    apiClient.post<ChatMessage>(`/chat/threads/${threadId}/messages`, data),

  /**
   * Mark thread as read
   */
  markAsRead: (threadId: string) =>
    apiClient.post<ChatReadAckResponse>(`/chat/threads/${threadId}/read`),

  /**
   * Get total unread count
   */
  getUnreadCount: () =>
    apiClient.get<ChatUnreadCountResponse>('/chat/unread-count'),
};

export default chatService;
