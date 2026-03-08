"use client"

import type React from "react"
import { useState, useRef, useEffect, useCallback } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Hash, MessageCircle, ThumbsUp, Pin, ArrowLeft, Send, Loader2, Plus, MoreVertical } from "lucide-react"
import { getChannelMessages, sendChannelMessage, getThreadReplies, sendThreadReply, deleteMessage, checkIsAdmin } from "@/lib/actions/channels"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

interface ChannelMessage {
  id: string
  content: string
  created_at: string
  pinned: boolean
  likes: number
  user_id: string
  channel_id: string
  parent_id: string | null
  sender?: { id: string; username: string }
}

interface PostsPanelProps {
  communityName: string | null
  channelName: string | null
  channelId: string | null
  onBack?: () => void
  currentUserId?: string
}

export function PostsPanel({ communityName, channelName, channelId, onBack, currentUserId }: PostsPanelProps) {
  const [messages, setMessages] = useState<ChannelMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [activeThread, setActiveThread] = useState<ChannelMessage | null>(null)
  const [threadReplies, setThreadReplies] = useState<ChannelMessage[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [newPost, setNewPost] = useState("")
  const [sending, setSending] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [messageToDelete, setMessageToDelete] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch channel messages from DB
  const loadMessages = useCallback(async () => {
    if (!channelId) return
    const { messages: msgs } = await getChannelMessages(channelId)
    setMessages(msgs)
    setLoading(false)
  }, [channelId])

  // Check if current user is admin
  useEffect(() => {
    if (!currentUserId) return
    checkIsAdmin(currentUserId).then(setIsAdmin)
  }, [currentUserId])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  // Supabase Realtime subscription for channel messages
  useEffect(() => {
    if (!channelId) return

    const supabase = createClient()
    const channel = supabase
      .channel(`channel-msgs-${channelId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "channel_messages",
          filter: `channel_id=eq.${channelId}`,
        },
        async (payload) => {
          const newMsg = payload.new as ChannelMessage
          // Fetch sender info
          const { data: sender } = await supabase
            .from("users")
            .select("id, username")
            .eq("id", newMsg.user_id)
            .maybeSingle()

          const fullMsg = { ...newMsg, sender } as ChannelMessage

          if (newMsg.parent_id) {
            // It's a thread reply - only add if we're viewing that thread
            setThreadReplies((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev
              return [...prev, fullMsg]
            })
          } else {
            // It's a top-level post
            setMessages((prev) => {
              if (prev.some((m) => m.id === newMsg.id)) return prev
              return [...prev, fullMsg]
            })
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [channelId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [threadReplies])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString([], { month: "short", day: "numeric" })
  }

  const openThread = async (post: ChannelMessage) => {
    setActiveThread(post)
    const { replies } = await getThreadReplies(post.id)
    setThreadReplies(replies)
  }

  const closeThread = () => {
    setActiveThread(null)
    setThreadReplies([])
    setNewMessage("")
  }

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !channelId || !activeThread || sending) return

    const content = newMessage
    setNewMessage("")
    setSending(true)

    const { message } = await sendThreadReply(channelId, activeThread.id, content)
    if (message) {
      setThreadReplies((prev) => {
        if (prev.some((m) => m.id === message.id)) return prev
        return [...prev, message]
      })
    }

    setSending(false)
  }

  const handleDeleteMessage = async (messageId: string) => {
    setMessageToDelete(messageId)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!messageToDelete) return

    setDeletingId(messageToDelete)
    const { success, error } = await deleteMessage(messageToDelete)
    setDeletingId(null)
    setDeleteConfirmOpen(false)
    setMessageToDelete(null)

    if (success) {
      // Remove from messages or thread replies
      setMessages((prev) => prev.filter((m) => m.id !== messageToDelete))
      setThreadReplies((prev) => prev.filter((m) => m.id !== messageToDelete))
      if (activeThread?.id === messageToDelete) {
        closeThread()
      }
    } else {
      alert(`Error deleting message: ${error}`)
    }
  }

  // Check if user can delete this message
  const canDeleteMessage = (messageUserId: string) => {
    return messageUserId === currentUserId || isAdmin
  }

  if (!communityName || !channelId) {
    return (
      <div className="flex-1 flex flex-col h-full min-h-0 bg-background">
        <div className="h-14 border-b border-border flex items-center px-6 shrink-0">
          <p className="font-semibold text-muted-foreground">Communities</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center px-6">
            <Hash className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
            <p className="text-lg font-medium text-muted-foreground mb-1">Select a channel</p>
            <p className="text-sm text-muted-foreground/70">Pick a community and channel from the sidebar to see posts</p>
          </div>
        </div>
      </div>
    )
  }

  // ===== THREAD CHAT VIEW =====
  if (activeThread) {
    return (
      <div className="flex-1 flex flex-col h-full min-h-0 bg-background">
        {/* Thread Header */}
        <div className="h-14 border-b border-border flex items-center gap-3 px-4 shrink-0">
          <button onClick={closeThread} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <MessageCircle className="w-5 h-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">Thread</p>
            <p className="text-xs text-muted-foreground truncate">
              Started by @{activeThread.sender?.username || "user"} in #{channelName}
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
            {threadReplies.length} replies
          </span>
        </div>

        {/* Original Post */}
        <div className="border-b border-border px-4 py-3 bg-card/50 shrink-0">
          <div className="flex items-start gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="text-xs bg-primary/10 text-primary">
                {activeThread.sender?.username?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm text-primary">@{activeThread.sender?.username || "user"}</span>
                <span className="text-xs text-muted-foreground">{formatTime(activeThread.created_at)}</span>
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">OP</span>
              </div>
              <p className="text-sm leading-relaxed">{activeThread.content}</p>
            </div>
          </div>
        </div>

        {/* Thread Replies */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {threadReplies.map((msg, i) => {
            const prevMsg = i > 0 ? threadReplies[i - 1] : null
            const showAuthor = !prevMsg || prevMsg.user_id !== msg.user_id

            return (
              <div
                key={msg.id}
                className={`group flex items-start gap-3 px-2 py-1 rounded-md hover:bg-accent/50 transition-colors ${showAuthor ? "mt-3" : ""}`}
              >
                {showAuthor ? (
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5">
                    <AvatarFallback className="text-xs bg-muted">
                      {msg.sender?.username?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  {showAuthor && (
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm">@{msg.sender?.username || "user"}</span>
                      <span className="text-[11px] text-muted-foreground">{formatTime(msg.created_at)}</span>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                {(msg.user_id === currentUserId || isAdmin) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="shrink-0 h-7 w-7">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDeleteMessage(msg.id)} className="text-destructive">
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply Input */}
        <div className="border-t border-border p-3 shrink-0">
          <form onSubmit={handleSendReply} className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Reply in thread..."
              className="flex-1 bg-card"
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || sending} className="shrink-0">
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </div>
    )
  }

  // ===== POSTS LIST VIEW =====
  const topLevelPosts = messages.filter((m) => !m.parent_id)
  const pinnedPosts = topLevelPosts.filter((p) => p.pinned)
  const regularPosts = topLevelPosts.filter((p) => !p.pinned)

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-background">
      {/* Header */}
      <div className="h-13 md:h-14 border-b border-border flex items-center justify-between gap-2 md:gap-3 px-3 md:px-4 shrink-0">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          {onBack && (
            <button onClick={onBack} className="p-1.5 rounded-md hover:bg-accent active:bg-accent/70 transition-colors shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <Hash className="w-5 h-5 text-muted-foreground shrink-0" />
          <div className="min-w-0">
            <p className="font-semibold truncate">{channelName}</p>
            <p className="text-xs text-muted-foreground truncate">{communityName}</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" variant="ghost" className="shrink-0">
              <Plus className="w-5 h-5" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Post</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault()
              if (!newPost.trim() || !channelId || sending) return
              const content = newPost
              setNewPost("")
              setSending(true)
              sendChannelMessage(channelId, content).then(({ message }) => {
                if (message) {
                  setMessages((prev) => {
                    if (prev.some((m) => m.id === message.id)) return prev
                    return [...prev, message]
                  })
                }
                setSending(false)
                setIsCreateDialogOpen(false)
              })
            }} className="space-y-4">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder={`What's on your mind in #${channelName}?`}
                className="w-full min-h-24 p-3 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!newPost.trim() || sending}>
                  {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Post
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Posts */}
      <div className="flex-1 overflow-y-auto px-3 py-3 md:p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : topLevelPosts.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Hash className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground font-medium">No posts yet</p>
              <p className="text-sm text-muted-foreground/70 mb-4">Be the first to start a discussion!</p>
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create First Post
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault()
                    if (!newPost.trim() || !channelId || sending) return
                    const content = newPost
                    setNewPost("")
                    setSending(true)
                    sendChannelMessage(channelId, content).then(({ message }) => {
                      if (message) {
                        setMessages((prev) => {
                          if (prev.some((m) => m.id === message.id)) return prev
                          return [...prev, message]
                        })
                      }
                      setSending(false)
                      setIsCreateDialogOpen(false)
                    })
                  }} className="space-y-4">
                    <textarea
                      value={newPost}
                      onChange={(e) => setNewPost(e.target.value)}
                      placeholder={`What's on your mind in #${channelName}?`}
                      className="w-full min-h-24 p-3 bg-card border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={!newPost.trim() || sending}>
                        {sending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                        Post
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        ) : (
          <>
            {/* Pinned Posts */}
            {pinnedPosts.map((post) => (
              <div
                key={post.id}
                className="bg-card border border-primary/20 rounded-lg p-4 cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => openThread(post)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Pin className="w-3 h-3 text-primary" />
                  <span className="text-xs text-primary font-medium">Pinned</span>
                </div>
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {post.sender?.username?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">@{post.sender?.username || "user"}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(post.created_at)}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {post.likes || 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <MessageCircle className="w-3.5 h-3.5" />
                        tap to chat
                      </span>
                    </div>
                  </div>
                  {(post.user_id === currentUserId || isAdmin) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteMessage(post.id)} className="text-destructive">
                          Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}

            {/* Regular Posts */}
            {regularPosts.map((post) => (
              <div
                key={post.id}
                className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-primary/30 transition-colors"
                onClick={() => openThread(post)}
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="text-xs bg-muted">
                      {post.sender?.username?.substring(0, 2).toUpperCase() || "??"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">@{post.sender?.username || "user"}</span>
                      <span className="text-xs text-muted-foreground">{formatTime(post.created_at)}</span>
                    </div>
                    <p className="text-sm leading-relaxed">{post.content}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {post.likes || 0}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MessageCircle className="w-3.5 h-3.5" />
                        replies
                      </span>
                    </div>
                  </div>
                  {(post.user_id === currentUserId || isAdmin) && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDeleteMessage(post.id)} className="text-destructive">
                          Delete Post
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Post</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this post? This will also delete all replies to it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deletingId ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
