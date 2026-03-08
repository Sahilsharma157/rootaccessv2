"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserFromCookie } from "@/lib/auth-utils"
import { rateLimiters } from "@/lib/rate-limit"
import { sanitizers } from "@/lib/sanitize"

// Helper to look up a user by id
async function getUser(supabase: any, userId: string) {
  const { data } = await supabase
    .from("users")
    .select("id, username, email")
    .eq("id", userId)
    .maybeSingle()
  return data
}

export async function getConversations() {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { conversations: [], error: "Not authenticated" }
  }

  // Fetch conversations where user is either party (separate queries to avoid .or() interpolation)
  const [{ data: convAsUser1 }, { data: convAsUser2 }] = await Promise.all([
    supabase.from("conversations").select("*").eq("user_1_id", currentUser.id),
    supabase.from("conversations").select("*").eq("user_2_id", currentUser.id),
  ])
  const convMap = new Map<string, any>()
  for (const c of [...(convAsUser1 || []), ...(convAsUser2 || [])]) convMap.set(c.id, c)
  const conversations = Array.from(convMap.values()).sort((a, b) =>
    new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  )
  const error = null

  if (error) {
    return { conversations: [], error: error.message }
  }

  // Resolve user data for each conversation
  const formatted = await Promise.all(
    (conversations || []).map(async (conv: any) => {
      const otherUserId = conv.user_1_id === currentUser.id ? conv.user_2_id : conv.user_1_id
      const otherUser = await getUser(supabase, otherUserId)

      // Get last message preview
      const { data: lastMsg } = await supabase
        .from("direct_messages")
        .select("content, sender_id, created_at")
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)

      const lastMessage = lastMsg?.[0] || null

      return {
        id: conv.id,
        otherUser: otherUser || { id: otherUserId, username: "Unknown", email: "" },
        lastMessageAt: conv.last_message_at,
        disappearAfter: conv.disappear_after,
        lastMessage: lastMessage
          ? {
              content: lastMessage.content,
              isOwn: lastMessage.sender_id === currentUser.id,
              time: lastMessage.created_at,
            }
          : null,
      }
    }),
  )

  return { conversations: formatted, error: null }
}

export async function getOrCreateConversation(otherUserId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { conversation: null, error: "Not authenticated" }
  }

  // Check if conversation already exists (either direction) - safe separate queries
  const [{ data: dir1 }, { data: dir2 }] = await Promise.all([
    supabase.from("conversations").select("*").eq("user_1_id", currentUser.id).eq("user_2_id", otherUserId).limit(1),
    supabase.from("conversations").select("*").eq("user_1_id", otherUserId).eq("user_2_id", currentUser.id).limit(1),
  ])
  const existing = [...(dir1 || []), ...(dir2 || [])]

  if (existing && existing.length > 0) {
    const conv = existing[0]
    const otherUser = await getUser(supabase, otherUserId)
    return {
      conversation: {
        ...conv,
        otherUser: otherUser || { id: otherUserId, username: "Unknown", email: "" },
      },
      error: null,
    }
  }

  // Create new conversation
  const { data: newConv, error } = await supabase
    .from("conversations")
    .insert({
      user_1_id: currentUser.id,
      user_2_id: otherUserId,
      last_message_at: new Date().toISOString(),
    })
    .select("*")
    .maybeSingle()

  if (error) {
    return { conversation: null, error: error.message }
  }

  const otherUser = await getUser(supabase, otherUserId)
  return {
    conversation: {
      ...newConv,
      otherUser: otherUser || { id: otherUserId, username: "Unknown", email: "" },
    },
    error: null,
  }
}

export async function getMessages(conversationId: string) {
  const supabase = createAdminClient()

  const { data: messages, error } = await supabase
    .from("direct_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(100)

  if (error) {
    return { messages: [], error: error.message }
  }

  // Resolve sender info for each message
  const userCache = new Map<string, any>()
  const resolved = await Promise.all(
    (messages || []).map(async (msg: any) => {
      if (!userCache.has(msg.sender_id)) {
        userCache.set(msg.sender_id, await getUser(supabase, msg.sender_id))
      }
      return {
        ...msg,
        sender: userCache.get(msg.sender_id),
      }
    }),
  )

  return { messages: resolved, error: null }
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { message: null, error: "Not authenticated" }
  }

  // Rate limit messages
  const rl = rateLimiters.message(currentUser.id)
  if (!rl.success) {
    return { message: null, error: `Sending too fast. Wait ${rl.retryAfterSeconds}s.` }
  }

  // Sanitize content
  const sanitizedContent = sanitizers.message(content)
  if (!sanitizedContent) return { message: null, error: "Message cannot be empty" }

  // Check if user is muted
  const { data: muteData } = await supabase
    .from("mutes")
    .select("muted_until, reason")
    .eq("user_id", currentUser.id)
    .maybeSingle()

  if (muteData && new Date(muteData.muted_until) > new Date()) {
    const until = new Date(muteData.muted_until).toLocaleString()
    return { message: null, error: `You are muted until ${until}. Reason: ${muteData.reason || "Spamming"}` }
  }
  
  // Find the receiver from the conversation
  const { data: conv } = await supabase
    .from("conversations")
    .select("user_1_id, user_2_id")
    .eq("id", conversationId)
    .maybeSingle()

  if (!conv) {
    return { message: null, error: "Conversation not found" }
  }

  const receiverId = conv.user_1_id === currentUser.id ? conv.user_2_id : conv.user_1_id

  const { data: message, error } = await supabase
    .from("direct_messages")
    .insert({
      conversation_id: conversationId,
      sender_id: currentUser.id,
      receiver_id: receiverId,
      content: sanitizedContent,
    })
    .select("*")
    .maybeSingle()

  if (error) {
    return { message: null, error: error.message }
  }

  // Update conversation timestamp
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId)

  return {
    message: {
      ...message,
      sender: currentUser,
    },
    error: null,
  }
}

export async function getUnreadCount() {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) return { count: 0 }

  const { count, error } = await supabase
    .from("direct_messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", currentUser.id)
    .eq("is_read", false)

  return { count: error ? 0 : (count || 0) }
}

export async function markConversationRead(conversationId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) return

  await supabase
    .from("direct_messages")
    .update({ is_read: true })
    .eq("conversation_id", conversationId)
    .eq("receiver_id", currentUser.id)
    .eq("is_read", false)
}

export async function editMessage(messageId: string, newContent: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) return { error: "Not authenticated" }

  // Only allow editing own messages
  const { data: msg } = await supabase
    .from("direct_messages")
    .select("sender_id")
    .eq("id", messageId)
    .maybeSingle()

  if (!msg || msg.sender_id !== currentUser.id) {
    return { error: "Cannot edit this message" }
  }

  const sanitizedContent = sanitizers.message(newContent)
  if (!sanitizedContent) return { error: "Message cannot be empty" }

  const { error } = await supabase
    .from("direct_messages")
    .update({ content: sanitizedContent, edited_at: new Date().toISOString() })
    .eq("id", messageId)

  return { error: error?.message || null }
}

export async function deleteMessageForMe(messageId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) return { error: "Not authenticated" }

  // Soft-delete: mark as deleted for this user
  const { data: msg } = await supabase
    .from("direct_messages")
    .select("sender_id, deleted_for")
    .eq("id", messageId)
    .maybeSingle()

  if (!msg) return { error: "Message not found" }

  const deletedFor = msg.deleted_for || []
  if (!deletedFor.includes(currentUser.id)) {
    deletedFor.push(currentUser.id)
  }

  const { error } = await supabase
    .from("direct_messages")
    .update({ deleted_for: deletedFor })
    .eq("id", messageId)

  return { error: error?.message || null }
}

export async function deleteMessageForEveryone(messageId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) return { error: "Not authenticated" }

  // Only sender can delete for everyone
  const { data: msg } = await supabase
    .from("direct_messages")
    .select("sender_id")
    .eq("id", messageId)
    .maybeSingle()

  if (!msg || msg.sender_id !== currentUser.id) {
    return { error: "Only the sender can delete for everyone" }
  }

  const { error } = await supabase
    .from("direct_messages")
    .update({ content: "", deleted_for_everyone: true })
    .eq("id", messageId)

  return { error: error?.message || null }
}

export async function updateDisappearingSetting(conversationId: string, disappearAfter: number | null) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { success: false, error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("conversations")
    .update({ disappear_after: disappearAfter })
    .eq("id", conversationId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
