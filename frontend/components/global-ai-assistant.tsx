"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { usePathname, useRouter } from "next/navigation"
import { MessageSquare, X, Send, Loader2, Search, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { aiService } from "@/lib/services"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  searchQuery?: string // If assistant suggests a search
}

const STORAGE_KEY = "argus_assistant_messages"
const MAX_STORED_MESSAGES = 10

// Helper to extract search suggestion from response
function extractSearchQuery(text: string): string | null {
  // Look for patterns like "search for X" or "try searching X"
  const patterns = [
    /search for ["']?([^"'\n]+)["']?/i,
    /try searching ["']?([^"'\n]+)["']?/i,
    /search: ["']?([^"'\n]+)["']?/i,
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }
  return null
}

export function GlobalAIAssistant() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Load messages from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setMessages(parsed.slice(-MAX_STORED_MESSAGES))
        }
      }
    } catch {
      // Ignore parse errors
    }
    
    // Add initial greeting if no messages
    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: "assistant",
        content: "Hi! I'm Argus AI. I can help you find products, navigate the platform, or answer questions about sourcing. How can I help?",
      }])
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save messages to localStorage
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)))
      } catch {
        // Ignore storage errors
      }
    }
  }, [messages])

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen])

  // Handle sending message
  const handleSend = useCallback(async () => {
    const trimmedInput = input.trim()
    if (!trimmedInput || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedInput,
    }

    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await aiService.askAssistant({
        message: trimmedInput,
        context: {
          route: pathname,
          user_type: user?.user_type || null,
        },
      })

      if (response.data) {
        const searchQuery = extractSearchQuery(response.data.reply)
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: response.data.reply,
          searchQuery: searchQuery || undefined,
        }
        setMessages(prev => [...prev, assistantMessage])
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, I had trouble processing that. Please try again.",
        }
        setMessages(prev => [...prev, errorMessage])
        
        if (response.error?.detail) {
          toast.error(response.error.detail)
        }
      }
    } catch {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't connect to the server. Please try again later.",
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }, [input, isLoading, pathname, user?.user_type])

  // Handle key down
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // Handle search action
  const handleSearch = (query: string) => {
    router.push(`/dashboard/search?q=${encodeURIComponent(query)}`)
    setIsOpen(false)
  }

  // Clear chat
  const clearChat = () => {
    setMessages([{
      id: "welcome-new",
      role: "assistant",
      content: "Chat cleared. How can I help you?",
    }])
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90"
          aria-label="Open AI Assistant"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <Card className="w-[360px] sm:w-[400px] border-border bg-card shadow-2xl">
          {/* Header */}
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">Argus AI</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {isAuthenticated ? `Hi, ${user?.username || 'there'}!` : 'How can I help?'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearChat}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Clear
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsOpen(false)} 
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Messages */}
          <CardContent className="p-0">
            <ScrollArea className="h-[350px] p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex",
                      message.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                      
                      {/* Search suggestion button */}
                      {message.searchQuery && (
                        <Button
                          variant="secondary"
                          size="sm"
                          className="mt-2 w-full text-xs"
                          onClick={() => handleSearch(message.searchQuery!)}
                        >
                          <Search className="h-3 w-3 mr-1" />
                          Search: {message.searchQuery}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-lg bg-muted px-3 py-2">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="p-4 border-t bg-background/50">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  placeholder="Ask anything..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  size="icon"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Quick actions */}
              <div className="flex flex-wrap gap-1 mt-2">
                {[
                  "How do I search?",
                  "What is Argus?",
                  "Help me find suppliers",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setInput(suggestion)
                      setTimeout(() => handleSend(), 100)
                    }}
                    disabled={isLoading}
                    className="text-xs px-2 py-1 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
