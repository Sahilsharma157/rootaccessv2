"use client"

import type React from "react"

import { useEffect, useState, useRef, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { AppSidebar } from "@/components/app-sidebar"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Send, Search, MoreVertical, Timer, ArrowLeft, User, Phone, Video, Info, Check, CheckCheck, Pencil, Trash2, Ban, Menu } from "lucide-react"
import { MobileHeader } from "@/components/mobile-header"
import { getUserData } from "@/lib/actions/auth"
import { getConversations, getOrCreateConversation, getMessages, sendMessage, updateDisappearingSetting, markConversationRead, editMessage, deleteMessageForMe, deleteMessageForEveryone } from "@/lib/actions/messages"
import { createClient } from "@/lib/supabase/client"

type DisappearOption = null | 86400 | 604800 | 2592000

const DISAPPEAR_OPTIONS: { label: string; value: DisappearOption; description: string }[] = [
  { label: "Off", value: null, description: "Messages don't disappear" },
  { label: "24 hours", value: 86400, description: "Messages disappear after 1 day" },
  { label: "7 days", value: 604800, description: "Messages disappear after 7 days" },
  { label: "30 days", value: 2592000, description: "Messages disappear after 30 days" },
]

export default function MessagesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const userId = searchParams?.get("user")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [currentUser, setCurrentUser] = useState<any>(null)
  const [conversations, setConversations] = useState<any[]>([])
  const [selectedConversation, setSelectedConversation] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [disappearSetting, setDisappearSetting] = useState<DisappearOption>(null)
  const [showChatSettings, setShowChatSettings] = useState(false)

  useEffect(() => {
    loadUser()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (currentUser) {
      loadConversations()
    }
  }, [currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (userId && currentUser) {
      handleDirectMessage(userId)
    }
  }, [userId, currentUser]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Supabase Realtime subscription for messages + fallback polling
  useEffect(() => {
    if (!selectedConversation?.id || !currentUser?.id) return

    const supabase = createClient()
    let realtimeWorking = false
    
    const channel = supabase
      .channel(`messages:${selectedConversation.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'direct_messages',
          filter: `conversation_id=eq.${selectedConversation.id}`,
        },
        async (payload) => {
          realtimeWorking = true
          const newMsg = payload.new as any
          
          // Only add if it's from the other user (we already optimistically added our own)
          if (newMsg.sender_id !== currentUser.id) {
            setMessages((prev) => {
              // Check if message already exists
              if (prev.some((m) => m.id === newMsg.id)) return prev
              return [...prev, {
                ...newMsg,
                sender: selectedConversation?.otherUser || { id: newMsg.sender_id, username: "User", email: "" },
              }]
            })
          }
        }
      )
      .subscribe()

    // Fallback polling every 5 seconds (in case realtime is not enabled)
    const pollInterval = setInterval(async () => {
      if (realtimeWorking) return // Skip if realtime is working
      const { messages: msgs } = await getMessages(selectedConversation.id)
      if (msgs && msgs.length > 0) {
        setMessages((prev) => {
          // Only update if server has newer/more messages
          if (msgs.length >= prev.filter((m) => !m.pending).length) {
            return msgs
          }
          return prev
        })
      }
    }, 5000)

    return () => {
      supabase.removeChannel(channel)
      clearInterval(pollInterval)
    }
  }, [selectedConversation?.id, currentUser?.id])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadUser = async () => {
    const user = await getUserData()
    if (user) {
      setCurrentUser(user)
    } else {
      router.push("/login")
    }
  }

  const loadConversations = async () => {
    const { conversations: convs } = await getConversations()
    setConversations(convs)
    setLoading(false)
  }

  const handleDirectMessage = async (otherUserId: string) => {
    const { conversation, error } = await getOrCreateConversation(otherUserId)

    if (error) {
      return
    }

    if (conversation) {
      setConversations((prev) => {
        const exists = prev.find((c) => c.id === conversation.id)
        if (exists) return prev
        return [
          {
            id: conversation.id,
            otherUser: conversation.otherUser,
            lastMessageAt: conversation.last_message_at || new Date().toISOString(),
            updatedAt: conversation.updated_at,
            disappearAfter: conversation.disappear_after,
          },
          ...prev,
        ]
      })

      setSelectedConversation({
        id: conversation.id,
        otherUser: conversation.otherUser,
        disappearAfter: conversation.disappear_after,
      })
      setDisappearSetting(conversation.disappear_after)

      setLoadingMessages(true)
      const { messages: msgs } = await getMessages(conversation.id)
      setMessages(msgs)
      setLoadingMessages(false)
    }
  }

  const handleEditMessage = async (messageId: string) => {
    if (!editContent.trim()) return
    const { error } = await editMessage(messageId, editContent)
    if (!error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: editContent.trim(), edited_at: new Date().toISOString() } : m,
        ),
      )
    }
    setEditingMessageId(null)
    setEditContent("")
  }

  const handleDeleteForMe = async (messageId: string) => {
    const { error } = await deleteMessageForMe(messageId)
    if (!error) {
      setMessages((prev) => prev.filter((m) => m.id !== messageId))
    }
  }

  const handleDeleteForEveryone = async (messageId: string) => {
    const { error } = await deleteMessageForEveryone(messageId)
    if (!error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: null, deleted_for_everyone: true } : m,
        ),
      )
    }
  }

  const handleSelectConversation = async (convId: string) => {
    const conv = conversations.find((c) => c.id === convId)
    setSelectedConversation(conv)
    setDisappearSetting(conv?.disappearAfter || null)

    setLoadingMessages(true)
    const { messages: msgs } = await getMessages(convId)
    setMessages(msgs)
    setLoadingMessages(false)

    // Mark messages as read
    await markConversationRead(convId)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !selectedConversation || sendingMessage) return

    const content = newMessage
    const tempId = `temp-${Date.now()}`
    setNewMessage("")
    setSendingMessage(true)

    // Optimistic update - add message immediately
    const tempMessage = {
      id: tempId,
      content,
      sender: currentUser,
      sender_id: currentUser.id,
      created_at: new Date().toISOString(),
      pending: true,
    }
    setMessages((prev) => [...prev, tempMessage])

    // Send to server
    const result = await sendMessage(selectedConversation.id, content)
    
    // Replace temp message with real one
    if (result.message) {
      setMessages((prev) => 
        prev.map((m) => 
          m.id === tempId 
            ? { ...result.message, sender: currentUser, pending: false }
            : m
        )
      )
    }
    
    setSendingMessage(false)
  }

  const handleDisappearSettingChange = async (value: DisappearOption) => {
    if (!selectedConversation) return
    
    setDisappearSetting(value)
    await updateDisappearingSetting(selectedConversation.id, value)
    
    // Update local state
    setSelectedConversation((prev: any) => ({ ...prev, disappearAfter: value }))
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConversation.id ? { ...c, disappearAfter: value } : c))
    )
  }

  const handleBackToList = () => {
    setSelectedConversation(null)
    setMessages([])
    router.push("/messages")
  }

  const getDisappearLabel = (value: DisappearOption) => {
    return DISAPPEAR_OPTIONS.find((opt) => opt.value === value)?.label || "Off"
  }

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    if (diffDays < 7) return date.toLocaleDateString([], { weekday: "short" })
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  if (!currentUser) {
    return null
  }

  return (
    <div className="flex h-dvh bg-background">
      <AppSidebar user={currentUser} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* View switches between conversation list and chat */}
        {!selectedConversation ? (
          /* Conversation List - full width */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-card">
            <MobileHeader title="Messages" />
            <div className="px-3 py-3 md:p-4 border-b border-border">
              <h2 className="text-xl font-semibold mb-3 hidden md:block">Messages</h2>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-4 text-center text-muted-foreground">Loading...</div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                    <Send className="w-8 h-8" />
                  </div>
                  <p className="font-medium mb-1">No conversations yet</p>
                  <p className="text-sm">Search for users to start messaging!</p>
                  <Button variant="outline" className="mt-4 bg-transparent" onClick={() => router.push("/search")}>
                    Find People
                  </Button>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv.id)}
                    className="w-full px-3 py-3 md:px-4 md:py-4 flex items-center gap-3 hover:bg-accent/50 active:bg-accent/70 transition-all duration-200 border-b border-border/50"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-10 w-10 md:h-12 md:w-12">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {conv.otherUser?.username?.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {conv.disappearAfter && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center border border-border">
                          <Timer className="w-3 h-3 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <p className="font-medium truncate">{conv.otherUser?.username}</p>
                        <p className="text-xs text-muted-foreground">{formatMessageTime(conv.lastMessageAt)}</p>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {conv.disappearAfter ? `Disappearing messages: ${getDisappearLabel(conv.disappearAfter)}` : "Tap to chat"}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        ) : (
          /* Chat View - full width */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Chat Header */}
            <div className="h-13 md:h-14 border-b border-border flex items-center justify-between px-2 md:px-3 bg-card shrink-0">
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={handleBackToList}>
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Link href={`/user/${selectedConversation.otherUser?.id}`} className="flex items-center gap-2 md:gap-3 hover:opacity-80 transition-opacity min-w-0 flex-1">
                  <Avatar className="h-8 w-8 md:h-10 md:w-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs md:text-sm">
                      {selectedConversation.otherUser?.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{selectedConversation.otherUser?.username}</p>
                    <div className="flex items-center gap-1">
                      {disappearSetting && (
                        <span className="flex items-center gap-1 text-xs text-primary">
                          <Timer className="w-3 h-3" />
                          {getDisappearLabel(disappearSetting)}
                        </span>
                      )}
                      {!disappearSetting && (
                        <span className="text-xs text-muted-foreground">@{selectedConversation.otherUser?.username}</span>
                      )}
                    </div>
                  </div>
                </Link>
              </div>
              
              <div className="flex items-center gap-0.5 md:gap-1 shrink-0">
                <Button variant="ghost" size="icon" className="hidden md:inline-flex text-muted-foreground hover:text-foreground">
                  <Phone className="w-5 h-5" />
                </Button>
                <Button variant="ghost" size="icon" className="hidden md:inline-flex text-muted-foreground hover:text-foreground">
                  <Video className="w-5 h-5" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                      <MoreVertical className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Chat Settings</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem asChild>
                      <Link href={`/user/${selectedConversation.otherUser?.id}`} className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        View Profile
                      </Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="flex items-center gap-2">
                      <Timer className="w-4 h-4" />
                      Disappearing Messages
                    </DropdownMenuLabel>
                    
                    {DISAPPEAR_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value ?? "off"}
                        onClick={() => handleDisappearSettingChange(option.value)}
                        className="flex items-center justify-between"
                      >
                        <div>
                          <p>{option.label}</p>
                          <p className="text-xs text-muted-foreground">{option.description}</p>
                        </div>
                        {disappearSetting === option.value && (
                          <Check className="w-4 h-4 text-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Chat Info
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-2 bg-background/50">
              {loadingMessages ? (
                <div className="flex-1 flex items-center justify-center h-full">
                  <p className="text-muted-foreground text-sm">Loading messages...</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center h-full text-center py-20">
                  <Avatar className="h-20 w-20 mb-4">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {selectedConversation.otherUser?.username?.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <p className="font-semibold text-lg">{selectedConversation.otherUser?.username}</p>
                  <p className="text-muted-foreground text-sm mt-1">Start your conversation!</p>
                  {disappearSetting && (
                    <div className="flex items-center gap-1 mt-3 text-xs text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                      <Timer className="w-3 h-3" />
                      Disappearing messages: {getDisappearLabel(disappearSetting)}
                    </div>
                  )}
                </div>
              ) : (
                messages.map((msg, index) => {
                  const isCurrentUser = msg.sender_id === currentUser?.id || msg.sender?.id === currentUser?.id
                  const prevSenderId = messages[index - 1]?.sender_id || messages[index - 1]?.sender?.id
                  const nextSenderId = messages[index + 1]?.sender_id || messages[index + 1]?.sender?.id
                  const thisSenderId = msg.sender_id || msg.sender?.id
                  const showAvatar = index === 0 || prevSenderId !== thisSenderId
                  const isLastInGroup = index === messages.length - 1 || nextSenderId !== thisSenderId
                  const isDeleted = msg.deleted_for_everyone

                  return (
                    <div key={msg.id} className={`group flex items-end gap-2 ${isCurrentUser ? "justify-end" : "justify-start"}`}>
                      {!isCurrentUser && (
                        <div className="w-6 shrink-0">
                          {showAvatar && (
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
                                {msg.sender?.username?.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      )}

                      {/* Action menu - left side for own messages */}
                      {isCurrentUser && !isDeleted && !msg.pending && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditingMessageId(msg.id)
                                  setEditContent(msg.content || "")
                                }}
                                className="gap-2"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => handleDeleteForMe(msg.id)}
                                className="gap-2 text-muted-foreground"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete for me
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDeleteForEveryone(msg.id)}
                                className="gap-2 text-destructive focus:text-destructive"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Delete for everyone
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                      <div
                        className={`max-w-[70%] ${
                          isDeleted ? "px-4 py-2.5 italic" :
                          editingMessageId === msg.id ? "w-full max-w-[70%]" : "px-4 py-2.5"
                        } ${
                          isDeleted
                            ? "bg-card/50 border border-border/50 rounded-2xl"
                            : isCurrentUser
                              ? `bg-primary text-primary-foreground ${isLastInGroup ? "rounded-2xl rounded-br-md" : "rounded-2xl"}`
                              : `bg-card border border-border ${isLastInGroup ? "rounded-2xl rounded-bl-md" : "rounded-2xl"}`
                        } ${msg.pending ? "opacity-70" : ""}`}
                      >
                        {isDeleted ? (
                          <p className="text-sm text-muted-foreground">This message was deleted</p>
                        ) : editingMessageId === msg.id ? (
                          <div className="flex items-center gap-2 p-1">
                            <Input
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleEditMessage(msg.id)
                                if (e.key === "Escape") { setEditingMessageId(null); setEditContent("") }
                              }}
                              className="flex-1 h-8 text-sm bg-background text-foreground"
                              autoFocus
                            />
                            <Button size="sm" className="h-8 px-3 text-xs" onClick={() => handleEditMessage(msg.id)}>
                              Save
                            </Button>
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-xs" onClick={() => { setEditingMessageId(null); setEditContent("") }}>
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm break-words leading-relaxed">{msg.content}</p>
                            <div className={`flex items-center justify-end gap-1 mt-1 ${
                              isCurrentUser ? "text-primary-foreground/60" : "text-muted-foreground"
                            }`}>
                              {msg.edited_at && <span className="text-[10px]">edited</span>}
                              <span className="text-[10px]">
                                {formatMessageTime(msg.created_at)}
                              </span>
                              {isCurrentUser && (
                                msg.pending ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  <CheckCheck className="w-3 h-3" />
                                )
                              )}
                            </div>
                          </>
                        )}
                      </div>

                      {/* Action menu - right side for other's messages */}
                      {!isCurrentUser && !isDeleted && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button className="p-1 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-48">
                              <DropdownMenuItem
                                onClick={() => handleDeleteForMe(msg.id)}
                                className="gap-2 text-muted-foreground"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Delete for me
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}

                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="border-t border-border px-3 py-2.5 bg-card safe-bottom">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 bg-background border-border"
                  maxLength={500}
                />
                <Button 
                  type="submit" 
                  disabled={!newMessage.trim() || sendingMessage}
                  size="icon"
                  className="h-10 w-10 rounded-full"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
              {disappearSetting && (
                <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Messages will disappear after {getDisappearLabel(disappearSetting).toLowerCase()}
                </p>
              )}
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
