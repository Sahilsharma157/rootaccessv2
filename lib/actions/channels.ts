"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserFromCookie } from "@/lib/auth-utils"
import { rateLimiters } from "@/lib/rate-limit"
import { sanitizers } from "@/lib/sanitize"

// Helper to resolve sender info for messages
async function resolveSenders(supabase: any, messages: any[]) {
  const userCache = new Map<string, any>()

  return Promise.all(
    messages.map(async (msg: any) => {
      if (!userCache.has(msg.user_id)) {
        const { data } = await supabase
          .from("users")
          .select("id, username")
          .eq("id", msg.user_id)
          .maybeSingle()
        userCache.set(msg.user_id, data)
      }
      return { ...msg, sender: userCache.get(msg.user_id) }
    }),
  )
}

export async function checkIsAdmin(userId: string) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle()

  return data?.role === "owner" || data?.role === "moderator"
}

export async function getCommunities() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("communities")
    .select(`
      *,
      channels (id, name),
      community_members (user_id)
    `)
    .order("name")

  if (error) {
    return { communities: [], error: error.message }
  }

  const formatted = data?.map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    memberCount: c.community_members?.length || 0,
    channels: c.channels || [],
  }))

  return { communities: formatted || [], error: null }
}

export async function getChannelMessages(channelId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("channel_messages")
    .select("*")
    .eq("channel_id", channelId)
    .is("parent_id", null)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })
    .limit(100)

  if (error) {
    return { messages: [], error: error.message }
  }

  const resolved = await resolveSenders(supabase, data || [])
  return { messages: resolved, error: null }
}

export async function sendChannelMessage(channelId: string, content: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { message: null, error: "Not authenticated" }
  }

  // Rate limit
  const rl = rateLimiters.message(currentUser.id)
  if (!rl.success) {
    return { message: null, error: `Sending too fast. Wait ${rl.retryAfterSeconds}s.` }
  }

  // Sanitize
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

  const { data, error } = await supabase
    .from("channel_messages")
    .insert({
      channel_id: channelId,
      user_id: currentUser.id,
      content: sanitizedContent,
    })
    .select("*")
    .maybeSingle()

  if (error) {
    return { message: null, error: error.message }
  }

  return {
    message: {
      ...data,
      sender: { id: currentUser.id, username: currentUser.username },
    },
    error: null,
  }
}

export async function getThreadReplies(parentId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("channel_messages")
    .select("*")
    .eq("parent_id", parentId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true })

  if (error) {
    return { replies: [], error: error.message }
  }

  const resolved = await resolveSenders(supabase, data || [])
  return { replies: resolved, error: null }
}

export async function sendThreadReply(channelId: string, parentId: string, content: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { message: null, error: "Not authenticated" }
  }

  // Rate limit
  const rl = rateLimiters.message(currentUser.id)
  if (!rl.success) {
    return { message: null, error: `Sending too fast. Wait ${rl.retryAfterSeconds}s.` }
  }

  // Sanitize
  const sanitizedContent = sanitizers.message(content)
  if (!sanitizedContent) return { message: null, error: "Reply cannot be empty" }

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

  const { data, error } = await supabase
    .from("channel_messages")
    .insert({
      channel_id: channelId,
      user_id: currentUser.id,
      content: sanitizedContent,
      parent_id: parentId,
    })
    .select("*")
    .maybeSingle()

  if (error) {
    return { message: null, error: error.message }
  }

  return {
    message: {
      ...data,
      sender: { id: currentUser.id, username: currentUser.username },
    },
    error: null,
  }
}

export async function joinCommunity(communityId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("community_members")
    .upsert(
      {
        community_id: communityId,
        user_id: currentUser.id,
      },
      { onConflict: "community_id,user_id" },
    )

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function leaveCommunity(communityId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { error: "Not authenticated" }
  }

  const { error } = await supabase
    .from("community_members")
    .delete()
    .eq("community_id", communityId)
    .eq("user_id", currentUser.id)

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}

export async function getUserJoinedCommunityIds() {
  const currentUser = await getCurrentUserFromCookie()
  if (!currentUser) return { joinedIds: [], error: "Not authenticated" }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", currentUser.id)

  if (error) return { joinedIds: [], error: error.message }
  return { joinedIds: (data || []).map((d: any) => d.community_id), error: null }
}

export async function getBrowseCommunities() {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  const { data, error } = await supabase
    .from("communities")
    .select(`
      *,
      channels (id, name),
      community_members (user_id)
    `)
    .order("name")

  if (error) {
    return { communities: [], joinedIds: [], error: error.message }
  }

  const joinedIds: string[] = []
  if (currentUser) {
    data?.forEach((c: any) => {
      if (c.community_members?.some((m: any) => m.user_id === currentUser.id)) {
        joinedIds.push(c.id)
      }
    })
  }

  const formatted = data?.map((c: any) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    memberCount: c.community_members?.length || 0,
    channels: c.channels || [],
  }))

  return { communities: formatted || [], joinedIds, error: null }
}

export async function createCommunity(name: string, description: string, channelNames: string[]) {
  const currentUser = await getCurrentUserFromCookie()
  if (!currentUser) return { community: null, error: "Not authenticated" }

  // Rate limit community creation
  const rl = rateLimiters.createCommunity(currentUser.id)
  if (!rl.success) {
    return { community: null, error: `Too many communities created. Wait ${rl.retryAfterSeconds}s.` }
  }

  // Check role - only owner or moderator can create
  const supabase = createAdminClient()
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", currentUser.id)
    .maybeSingle()

  const role = roleData?.role || "member"
  if (role !== "owner" && role !== "moderator") {
    return { community: null, error: "Only owners and moderators can create communities" }
  }

  // Sanitize inputs
  const sanitizedName = sanitizers.communityName(name)
  const sanitizedDesc = sanitizers.communityDescription(description)
  if (!sanitizedName) return { community: null, error: "Community name is required" }

  // Create community
  const { data: community, error: createError } = await supabase
    .from("communities")
    .insert({ name: sanitizedName, description: sanitizedDesc || null, created_by: currentUser.id })
    .select("*")
    .maybeSingle()

  if (createError) return { community: null, error: createError.message }

  // Create channels (always include "general")
  const channels = channelNames.length > 0
    ? channelNames.map((n) => sanitizers.channelName(n)).filter(Boolean)
    : ["general"]

  if (!channels.includes("general")) channels.unshift("general")

  const channelInserts = channels.map((ch) => ({
    community_id: community.id,
    name: ch,
  }))

  await supabase.from("channels").insert(channelInserts)

  // Auto-join creator
  await supabase.from("community_members").insert({
    community_id: community.id,
    user_id: currentUser.id,
  })

  return { community, error: null }
}

export async function searchUsers(query: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { users: [], error: "Not authenticated" }
  }

  const { data, error } = await supabase
    .from("users")
    .select("id, username, email")
    .ilike("username", `%${query}%`)
    .neq("id", currentUser.id)
    .limit(20)

  if (error) {
    return { users: [], error: error.message }
  }

  return { users: data || [], error: null }
}

export async function deleteMessage(messageId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { success: false, error: "Not authenticated" }
  }

  // Get the message
  const { data: message, error: fetchError } = await supabase
    .from("channel_messages")
    .select("user_id, parent_id")
    .eq("id", messageId)
    .maybeSingle()

  if (fetchError || !message) {
    return { success: false, error: "Message not found" }
  }

  // Check if user is creator or admin
  const isCreator = message.user_id === currentUser.id
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", currentUser.id)
    .maybeSingle()

  const isAdmin = roleData?.role === "owner" || roleData?.role === "moderator"

  if (!isCreator && !isAdmin) {
    return { success: false, error: "You don't have permission to delete this message" }
  }

  // Soft delete: mark as deleted
  const { error: deleteError } = await supabase
    .from("channel_messages")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: currentUser.id,
    })
    .eq("id", messageId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  // If this is a parent post with replies, soft delete all replies too
  if (!message.parent_id) {
    await supabase
      .from("channel_messages")
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: currentUser.id,
      })
      .eq("parent_id", messageId)
  }

  return { success: true, error: null }
}
