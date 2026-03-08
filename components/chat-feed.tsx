"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Send } from "lucide-react"

interface Message {
  id: string
  sender: {
    name: string
    avatar: string
    initials: string
  }
  content: string
  timestamp: string
}

export function ChatFeed({ groupName }: { groupName: string }) {
  const [message, setMessage] = useState("")

  const handleSend = () => {
    if (message.trim()) {
      // TODO: Send message to backend
      setMessage("")
    }
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Chat Header */}
      <div className="h-16 border-b border-border flex items-center px-6">
        <div>
          <h2 className="font-semibold text-lg">{groupName}</h2>
          <p className="text-xs text-muted-foreground">Community Chat</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Welcome to {groupName}</p>
          <p className="text-sm text-muted-foreground">Start a conversation with your community</p>
        </div>
      </div>

      {/* Message Input */}
      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={`Message ${groupName}`}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
          />
          <Button onClick={handleSend} disabled={!message.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
