"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from './auth-context';
import { chatService } from '@/lib/services/chat-service';
import { tokenManager } from '@/lib/api-client';
import type { ChatThread, ChatMessage } from '@/lib/api-types';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

// Reconnection settings
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const RECONNECT_MULTIPLIER = 1.5;

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface ChatContextType {
  threads: ChatThread[];
  unreadTotal: number;
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  refreshThreads: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  addMessageToThread: (threadId: string, message: ChatMessage) => void;
  updateThreadInList: (thread: ChatThread) => void;
  markThreadAsRead: (threadId: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [isLoading, setIsLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const shouldReconnectRef = useRef(true);
  const mountedRef = useRef(true);

  // Fetch threads from API
  const refreshThreads = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const response = await chatService.getThreads();
      if (response.data) {
        setThreads(response.data.threads);
      }
    } catch (error) {
      console.error('Failed to fetch threads:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Fetch unread count from API
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await chatService.getUnreadCount();
      if (response.data) {
        setUnreadTotal(response.data.unread_total);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, [isAuthenticated]);

  // Add message to a thread (for real-time updates)
  const addMessageToThread = useCallback((threadId: string, message: ChatMessage) => {
    setThreads(prev => prev.map(thread => {
      if (thread.id === threadId) {
        return {
          ...thread,
          last_message: {
            id: message.id,
            sender_id: message.sender_id,
            sender_username: message.sender_username,
            text: message.text,
            created_at: message.created_at,
          },
          last_message_at: message.created_at,
          updated_at: message.created_at,
          unread_count: thread.unread_count + 1,
        };
      }
      return thread;
    }));
  }, []);

  // Update a thread in the list
  const updateThreadInList = useCallback((updatedThread: ChatThread) => {
    setThreads(prev => {
      const exists = prev.some(t => t.id === updatedThread.id);
      if (exists) {
        return prev.map(t => t.id === updatedThread.id ? updatedThread : t);
      } else {
        return [updatedThread, ...prev];
      }
    });
  }, []);

  // Mark thread as read
  const markThreadAsRead = useCallback((threadId: string) => {
    setThreads(prev => prev.map(thread => {
      if (thread.id === threadId && thread.unread_count > 0) {
        setUnreadTotal(current => Math.max(0, current - thread.unread_count));
        return { ...thread, unread_count: 0 };
      }
      return thread;
    }));
  }, []);

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    if (!isAuthenticated || authLoading) return;
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = tokenManager.getAccessToken();
    if (!token) {
      setConnectionStatus('error');
      return;
    }

    const url = `${WS_BASE_URL}/ws/chat/threads/?token=${token}`;
    setConnectionStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setConnectionStatus('connected');
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setConnectionStatus('disconnected');

        // Auto-reconnect with exponential backoff
        if (shouldReconnectRef.current && isAuthenticated) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectDelayRef.current = Math.min(
              reconnectDelayRef.current * RECONNECT_MULTIPLIER,
              MAX_RECONNECT_DELAY
            );
            connectWebSocket();
          }, reconnectDelayRef.current);
        }
      };

      ws.onerror = () => {
        if (!mountedRef.current) return;
        setConnectionStatus('error');
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setConnectionStatus('error');
    }
  }, [isAuthenticated, authLoading]);

  const handleWebSocketMessage = useCallback((data: { type: string; [key: string]: unknown }) => {
    switch (data.type) {
      case 'unread_count':
        setUnreadTotal(data.unread_total as number);
        break;

      case 'new_message': {
        const threadId = data.thread_id as string;
        const message = data.message as ChatMessage;
        addMessageToThread(threadId, message);
        setUnreadTotal(prev => prev + 1);
        break;
      }

      case 'thread_updated': {
        const thread = data.thread as ChatThread;
        updateThreadInList(thread);
        break;
      }
    }
  }, [addMessageToThread, updateThreadInList]);

  // Disconnect WebSocket
  const disconnectWebSocket = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionStatus('disconnected');
  }, []);

  // Connect when authenticated
  useEffect(() => {
    mountedRef.current = true;
    shouldReconnectRef.current = true;

    if (isAuthenticated && !authLoading) {
      refreshThreads();
      refreshUnreadCount();
      connectWebSocket();
    } else {
      disconnectWebSocket();
      setThreads([]);
      setUnreadTotal(0);
    }

    return () => {
      mountedRef.current = false;
      disconnectWebSocket();
    };
  }, [isAuthenticated, authLoading, refreshThreads, refreshUnreadCount, connectWebSocket, disconnectWebSocket]);

  const value: ChatContextType = {
    threads,
    unreadTotal,
    connectionStatus,
    isLoading,
    refreshThreads,
    refreshUnreadCount,
    addMessageToThread,
    updateThreadInList,
    markThreadAsRead,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
