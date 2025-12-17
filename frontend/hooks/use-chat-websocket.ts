/**
 * WebSocket Hook for Chat
 * 
 * Provides real-time WebSocket connections for chat functionality.
 * Handles authentication, reconnection, and message handling.
 */
import { useEffect, useRef, useCallback, useState } from 'react';
import { tokenManager } from '../api-client';

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

// Reconnection settings
const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30000;
const RECONNECT_MULTIPLIER = 1.5;

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  onMessage?: (data: unknown) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  autoReconnect?: boolean;
}

interface UseWebSocketReturn {
  status: ConnectionStatus;
  send: (data: unknown) => void;
  disconnect: () => void;
  reconnect: () => void;
}

export function useWebSocket(
  endpoint: string,
  options: UseWebSocketOptions = {}
): UseWebSocketReturn {
  const {
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect = true,
  } = options;

  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY);
  const shouldReconnectRef = useRef(autoReconnect);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const token = tokenManager.getAccessToken();
    if (!token) {
      setStatus('error');
      return;
    }

    const url = `${WS_BASE_URL}${endpoint}?token=${token}`;
    setStatus('connecting');

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) return;
        setStatus('connected');
        reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
        onOpen?.();
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        try {
          const data = JSON.parse(event.data);
          onMessage?.(data);
        } catch {
          console.error('Failed to parse WebSocket message:', event.data);
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setStatus('disconnected');
        onClose?.();

        // Auto-reconnect with exponential backoff
        if (shouldReconnectRef.current && autoReconnect) {
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectDelayRef.current = Math.min(
              reconnectDelayRef.current * RECONNECT_MULTIPLIER,
              MAX_RECONNECT_DELAY
            );
            connect();
          }, reconnectDelayRef.current);
        }
      };

      ws.onerror = (error) => {
        if (!mountedRef.current) return;
        setStatus('error');
        onError?.(error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setStatus('error');
    }
  }, [endpoint, onMessage, onOpen, onClose, onError, autoReconnect]);

  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false;
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setStatus('disconnected');
  }, []);

  const reconnect = useCallback(() => {
    shouldReconnectRef.current = true;
    reconnectDelayRef.current = INITIAL_RECONNECT_DELAY;
    disconnect();
    connect();
  }, [disconnect, connect]);

  const send = useCallback((data: unknown) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket is not connected');
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    shouldReconnectRef.current = autoReconnect;
    connect();

    return () => {
      mountedRef.current = false;
      shouldReconnectRef.current = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect, autoReconnect]);

  return { status, send, disconnect, reconnect };
}

/**
 * Hook for global chat notifications WebSocket
 */
export function useChatNotifications(
  onNewMessage?: (threadId: string, message: unknown) => void,
  onUnreadCountUpdate?: (count: number) => void,
  onThreadUpdate?: (thread: unknown) => void
) {
  const handleMessage = useCallback((data: unknown) => {
    const msg = data as { type: string; [key: string]: unknown };
    
    switch (msg.type) {
      case 'new_message':
        onNewMessage?.(msg.thread_id as string, msg.message);
        break;
      case 'unread_count':
        onUnreadCountUpdate?.(msg.unread_total as number);
        break;
      case 'thread_updated':
        onThreadUpdate?.(msg.thread);
        break;
    }
  }, [onNewMessage, onUnreadCountUpdate, onThreadUpdate]);

  return useWebSocket('/ws/chat/threads/', {
    onMessage: handleMessage,
    autoReconnect: true,
  });
}

/**
 * Hook for thread-specific WebSocket
 */
export function useChatThread(
  threadId: string | null,
  onMessage?: (message: unknown) => void,
  onReadReceipt?: (userId: string) => void
) {
  const handleMessage = useCallback((data: unknown) => {
    const msg = data as { type: string; [key: string]: unknown };
    
    switch (msg.type) {
      case 'message':
        onMessage?.(msg.message);
        break;
      case 'read_receipt':
        onReadReceipt?.(msg.user_id as string);
        break;
      case 'read_ack':
        // Handle read acknowledgement if needed
        break;
    }
  }, [onMessage, onReadReceipt]);

  const ws = useWebSocket(
    threadId ? `/ws/chat/thread/${threadId}/` : '',
    {
      onMessage: handleMessage,
      autoReconnect: !!threadId,
    }
  );

  const sendMessage = useCallback((text: string) => {
    ws.send({ type: 'send', text });
  }, [ws]);

  const markAsRead = useCallback(() => {
    ws.send({ type: 'read' });
  }, [ws]);

  return {
    ...ws,
    sendMessage,
    markAsRead,
  };
}
