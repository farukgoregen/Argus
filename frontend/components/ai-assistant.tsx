"use client"

import { useState } from "react"
import { MessageSquare, X, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen ? (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          aria-label="Open AI Assistant"
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      ) : (
        <Card className="w-[380px] border-border bg-card shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">AI Assistant</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-[300px] space-y-3 overflow-y-auto rounded-lg bg-secondary p-3">
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-card p-3 text-sm">
                  <p>Hello! I'm your AI sourcing assistant. How can I help you today?</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-[80%] rounded-lg bg-primary p-3 text-sm text-primary-foreground">
                  <p>Show me the best deals for laptops</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-card p-3 text-sm">
                  <p>
                    I found 5 great laptop deals. The MacBook Air M3 is currently $1,249 on Amazon, which is 3.7% below
                    the average market price.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Ask me anything..." className="flex-1" />
              <Button size="icon" className="shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
