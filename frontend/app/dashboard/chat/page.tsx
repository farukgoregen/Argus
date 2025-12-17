"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { useChat } from "@/contexts/chat-context"
import { chatService } from "@/lib/services/chat-service"
import { tokenManager } from "@/lib/api-client"
import { formatDistanceToNow } from "date-fns"
import {
  MessageCircle,
  Send,
  Loader2,
  ArrowLeft,
  Package,
  User,
  Wifi,
  WifiOff,
  ChevronUp,
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import type { ChatThread, ChatMessage } from "@/lib/api-types"

const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

export default function ChatPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { threads, unreadTotal, connectionStatus, refreshThreads, markThreadAsRead } = useChat()

  // Selected thread state
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null)
  
  // Messages state
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [hasMoreMessages, setHasMoreMessages] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Input state
  const [messageInput, setMessageInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  
  // WebSocket state for thread
  const wsRef = useRef<WebSocket | null>(null)
  const [threadWsStatus, setThreadWsStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected')
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login')
    }
  }, [authLoading, isAuthenticated, router])

  // Handle thread from URL
  useEffect(() => {
    const threadParam = searchParams.get('thread')
    if (threadParam && threadParam !== selectedThreadId) {
      setSelectedThreadId(threadParam)
    }
  }, [searchParams, selectedThreadId])

  // Find selected thread in list
  useEffect(() => {
    if (selectedThreadId && threads.length > 0) {
      const thread = threads.find(t => t.id === selectedThreadId)
      if (thread) {
        setSelectedThread(thread)
      }
    }
  }, [selectedThreadId, threads])

  // Load messages when thread changes
  useEffect(() => {
    if (!selectedThreadId) {
      setMessages([])
      return
    }

    const loadMessages = async () => {
      setIsLoadingMessages(true)
      setCurrentPage(1)
      
      try {
        const response = await chatService.getMessages(selectedThreadId, 1, 20)
        if (response.data) {
          setMessages(response.data.messages)
          setHasMoreMessages(response.data.has_more)
        }
      } catch (error) {
        console.error('Failed to load messages:', error)
        toast.error('Failed to load messages')
      } finally {
        setIsLoadingMessages(false)
      }
    }

    loadMessages()
  }, [selectedThreadId])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Connect thread WebSocket
  useEffect(() => {
    if (!selectedThreadId || !isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      setThreadWsStatus('disconnected')
      return
    }

    const token = tokenManager.getAccessToken()
    if (!token) return

    const url = `${WS_BASE_URL}/ws/chat/thread/${selectedThreadId}/?token=${token}`
    setThreadWsStatus('connecting')

    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => {
      setThreadWsStatus('connected')
      // Mark as read when opening
      markThreadAsRead(selectedThreadId)
      chatService.markAsRead(selectedThreadId)
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'message') {
          const newMessage = data.message as ChatMessage
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === newMessage.id)) return prev
            return [...prev, newMessage]
          })
        } else if (data.type === 'read_ack') {
          markThreadAsRead(selectedThreadId)
        }
      } catch (error) {
        console.error('Failed to parse WS message:', error)
      }
    }

    ws.onclose = () => {
      setThreadWsStatus('disconnected')
    }

    ws.onerror = () => {
      setThreadWsStatus('disconnected')
    }

    return () => {
      ws.close()
      wsRef.current = null
    }
  }, [selectedThreadId, isAuthenticated, markThreadAsRead])

  // Load more messages
  const loadMoreMessages = useCallback(async () => {
    if (!selectedThreadId || isLoadingMessages || !hasMoreMessages) return

    setIsLoadingMessages(true)
    const nextPage = currentPage + 1

    try {
      const response = await chatService.getMessages(selectedThreadId, nextPage, 20)
      if (response.data) {
        setMessages(prev => [...response.data!.messages, ...prev])
        setHasMoreMessages(response.data.has_more)
        setCurrentPage(nextPage)
      }
    } catch (error) {
      console.error('Failed to load more messages:', error)
    } finally {
      setIsLoadingMessages(false)
    }
  }, [selectedThreadId, isLoadingMessages, hasMoreMessages, currentPage])

  // Send message
  const handleSendMessage = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault()
    
    const text = messageInput.trim()
    if (!text || !selectedThreadId || isSending) return

    setIsSending(true)
    setMessageInput("")

    // Try WebSocket first
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'send', text }))
      setIsSending(false)
    } else {
      // Fallback to REST
      try {
        const response = await chatService.sendMessage(selectedThreadId, { text })
        if (response.data) {
          setMessages(prev => [...prev, response.data!])
        } else {
          throw new Error(response.error?.detail || 'Failed to send message')
        }
      } catch (error) {
        console.error('Failed to send message:', error)
        toast.error('Failed to send message')
        setMessageInput(text) // Restore input
      } finally {
        setIsSending(false)
      }
    }
  }, [messageInput, selectedThreadId, isSending])

  // Select thread
  const handleSelectThread = (thread: ChatThread) => {
    setSelectedThreadId(thread.id)
    setSelectedThread(thread)
    router.push(`/dashboard/chat?thread=${thread.id}`, { scroll: false })
    inputRef.current?.focus()
  }

  // Go back to thread list (mobile)
  const handleBack = () => {
    setSelectedThreadId(null)
    setSelectedThread(null)
    router.push('/dashboard/chat', { scroll: false })
  }

  // Get display name for a thread
  const getThreadDisplayName = (thread: ChatThread) => {
    if (!user) return ''
    return user.id === thread.buyer.id 
      ? thread.supplier.username 
      : thread.buyer.username
  }

  // Get other participant
  const getOtherParticipant = (thread: ChatThread) => {
    if (!user) return null
    return user.id === thread.buyer.id ? thread.supplier : thread.buyer
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* Thread List - Left Column */}
      <div 
        className={cn(
          "w-full md:w-80 lg:w-96 border-r flex flex-col bg-background",
          selectedThreadId && "hidden md:flex"
        )}
      >
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Messages
              {unreadTotal > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {unreadTotal}
                </Badge>
              )}
            </h1>
            <div className="flex items-center gap-1">
              {connectionStatus === 'connected' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </div>

        {/* Thread List */}
        <ScrollArea className="flex-1">
          {threads.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No conversations yet</p>
              <p className="text-sm mt-1">
                Start a chat by contacting a supplier
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {threads.map((thread) => {
                const other = getOtherParticipant(thread)
                const isSelected = thread.id === selectedThreadId
                
                return (
                  <button
                    key={thread.id}
                    onClick={() => handleSelectThread(thread)}
                    className={cn(
                      "w-full p-4 text-left hover:bg-accent transition-colors",
                      isSelected && "bg-accent"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {other?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-medium truncate">
                            {getThreadDisplayName(thread)}
                          </span>
                          {thread.last_message_at && (
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
                            </span>
                          )}
                        </div>
                        {thread.product && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                            <Package className="h-3 w-3" />
                            <span className="truncate">{thread.product.product_name}</span>
                          </div>
                        )}
                        {thread.last_message && (
                          <p className="text-sm text-muted-foreground truncate mt-1">
                            {thread.last_message.text}
                          </p>
                        )}
                      </div>
                      {thread.unread_count > 0 && (
                        <Badge variant="destructive" className="shrink-0">
                          {thread.unread_count}
                        </Badge>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area - Right Column */}
      <div 
        className={cn(
          "flex-1 flex flex-col bg-background",
          !selectedThreadId && "hidden md:flex"
        )}
      >
        {!selectedThread ? (
          // No thread selected
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Select a conversation</p>
              <p className="text-sm mt-1">Choose from your existing conversations</p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={handleBack}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <Avatar className="h-9 w-9">
                <AvatarFallback>
                  {getOtherParticipant(selectedThread)?.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {getThreadDisplayName(selectedThread)}
                </p>
                {selectedThread.product && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {selectedThread.product.product_name}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {threadWsStatus === 'connected' ? (
                  <>
                    <Wifi className="h-3 w-3 text-green-500" />
                    <span>Live</span>
                  </>
                ) : threadWsStatus === 'connecting' ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-3 w-3" />
                    <span>Offline</span>
                  </>
                )}
              </div>
            </div>

            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
              {/* Load More Button */}
              {hasMoreMessages && (
                <div className="text-center mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadMoreMessages}
                    disabled={isLoadingMessages}
                  >
                    {isLoadingMessages ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ChevronUp className="h-4 w-4 mr-2" />
                    )}
                    Load older messages
                  </Button>
                </div>
              )}

              {/* Loading indicator */}
              {isLoadingMessages && messages.length === 0 && (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Messages */}
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.sender_id === user?.id
                  
                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        isOwnMessage ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[75%] rounded-lg px-4 py-2",
                          isOwnMessage
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary"
                        )}
                      >
                        <p className="whitespace-pre-wrap break-words">
                          {message.text}
                        </p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            isOwnMessage
                              ? "text-primary-foreground/70"
                              : "text-muted-foreground"
                          )}
                        >
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Type a message..."
                  disabled={isSending}
                  className="flex-1"
                  autoComplete="off"
                />
                <Button 
                  type="submit" 
                  size="icon"
                  disabled={!messageInput.trim() || isSending}
                >
                  {isSending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
