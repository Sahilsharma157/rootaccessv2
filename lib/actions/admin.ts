"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserFromCookie } from "@/lib/auth-utils"
import { rateLimiters } from "@/lib/rate-limit"
import { sanitizers } from "@/lib/sanitize"

async function requireOwnerOrMod() {
  const user = await getCurrentUserFromCookie()
  if (!user) return { user: null, role: null, error: "Not authenticated" }

  const supabase = createAdminClient()
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  const role = roleData?.role || "member"
  if (role !== "owner" && role !== "moderator") {
    return { user: null, role: null, error: "Unauthorized" }
  }

  return { user, role, error: null }
}

async function requireOwner() {
  const user = await getCurrentUserFromCookie()
  if (!user) return { user: null, error: "Not authenticated" }

  const supabase = createAdminClient()
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (roleData?.role !== "owner") {
    return { user: null, error: "Unauthorized" }
  }

  return { user, error: null }
}

export async function getUserRole() {
  const user = await getCurrentUserFromCookie()
  if (!user) return { role: "member" }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  return { role: data?.role || "member" }
}

// Single optimized call for the entire admin page - replaces getAllUsers + getReports + getUserRole + getUserData
export async function getAdminPageData() {
  const user = await getCurrentUserFromCookie()
  if (!user) return { user: null, role: "member", users: [], reports: [], error: "Not authenticated" }

  const supabase = createAdminClient()

  // One role check
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  const role = roleData?.role || "member"
  if (role !== "owner" && role !== "moderator") {
    return { user, role, users: [], reports: [], error: "Unauthorized" }
  }

  // Fire ALL remaining queries in parallel
  const [usersRes, rolesRes, bansRes, mutesRes, reportsRes] = await Promise.all([
    supabase.from("users").select("id, username, email, created_at").order("created_at", { ascending: false }),
    supabase.from("user_roles").select("user_id, role"),
    supabase.from("bans").select("email, banned_by, reason, created_at"),
    supabase.from("mutes").select("user_id, muted_until, reason"),
    supabase.from("reports").select("*").order("created_at", { ascending: false }),
  ])

  // Build lookup maps
  const roleMap = new Map((rolesRes.data || []).map((r: any) => [r.user_id, r.role]))
  const banMap = new Map((bansRes.data || []).map((b: any) => [b.email, b]))
  const muteMap = new Map((mutesRes.data || []).map((m: any) => [m.user_id, m]))

  const formattedUsers = (usersRes.data || []).map((u: any) => ({
    ...u,
    role: roleMap.get(u.id) || "member",
    ban: banMap.get(u.email) || null,
    mute: muteMap.get(u.id) || null,
    isMuted: muteMap.has(u.id) && new Date(muteMap.get(u.id).muted_until) > new Date(),
  }))

  // Resolve report user info from users we already fetched
  const userMap = new Map((usersRes.data || []).map((u: any) => [u.id, u]))
  const formattedReports = (reportsRes.data || []).map((r: any) => ({
    ...r,
    reportedUser: userMap.get(r.reported_user_id) || null,
    reportedBy: userMap.get(r.reported_by) || null,
  }))

  return { user, role, users: formattedUsers, reports: formattedReports, error: null }
}

export async function getAllUsers() {
  const { error } = await requireOwner()
  if (error) return { users: [], error }

  const supabase = createAdminClient()
  const { data: users } = await supabase
    .from("users")
    .select("id, username, email, created_at")
    .order("created_at", { ascending: false })

  const { data: roles } = await supabase.from("user_roles").select("user_id, role")
  const { data: bans } = await supabase.from("bans").select("email, banned_by, reason, created_at")
  const { data: mutes } = await supabase.from("mutes").select("user_id, muted_until, reason")

  const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]))
  const banMap = new Map((bans || []).map((b: any) => [b.email, b]))
  const muteMap = new Map((mutes || []).map((m: any) => [m.user_id, m]))

  const formatted = (users || []).map((u: any) => ({
    ...u,
    role: roleMap.get(u.id) || "member",
    ban: banMap.get(u.email) || null,
    mute: muteMap.get(u.id) || null,
    isMuted: muteMap.has(u.id) && new Date(muteMap.get(u.id).muted_until) > new Date(),
  }))

  return { users: formatted, error: null }
}

export async function banUser(email: string, reason: string) {
  const { user, error } = await requireOwner()
  if (error || !user) return { error: error || "Unauthorized" }

  const supabase = createAdminClient()

  // Don't allow banning yourself
  if (user.email === email) return { error: "Cannot ban yourself" }

  const { error: banError } = await supabase
    .from("bans")
    .upsert({ email, banned_by: user.id, reason }, { onConflict: "email" })

  if (banError) return { error: banError.message }

  return { error: null }
}

export async function unbanUser(email: string) {
  const { error } = await requireOwner()
  if (error) return { error }

  const supabase = createAdminClient()
  const { error: delError } = await supabase.from("bans").delete().eq("email", email)

  if (delError) return { error: delError.message }
  return { error: null }
}

export async function muteUser(userId: string, hours: number, reason: string) {
  const { user, error } = await requireOwnerOrMod()
  if (error || !user) return { error: error || "Unauthorized" }

  if (user.id === userId) return { error: "Cannot mute yourself" }

  const supabase = createAdminClient()
  const mutedUntil = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString()

  const { error: muteError } = await supabase
    .from("mutes")
    .upsert(
      { user_id: userId, muted_by: user.id, muted_until: mutedUntil, reason },
      { onConflict: "user_id" }
    )

  if (muteError) return { error: muteError.message }
  return { error: null }
}

export async function unmuteUser(userId: string) {
  const { error } = await requireOwnerOrMod()
  if (error) return { error }

  const supabase = createAdminClient()
  const { error: delError } = await supabase.from("mutes").delete().eq("user_id", userId)

  if (delError) return { error: delError.message }
  return { error: null }
}

export async function setUserRole(userId: string, role: "moderator" | "ninja" | "member") {
  const { user, error } = await requireOwner()
  if (error || !user) return { error: error || "Unauthorized" }

  if (user.id === userId) return { error: "Cannot change your own role" }

  const supabase = createAdminClient()

  if (role === "member") {
    // Remove any custom role
    await supabase.from("user_roles").delete().eq("user_id", userId)
  } else {
    const { error: roleError } = await supabase
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" })
    if (roleError) return { error: roleError.message }
  }

  return { error: null }
}

export async function getReports() {
  const { error } = await requireOwnerOrMod()
  if (error) return { reports: [], error }

  const supabase = createAdminClient()
  const { data, error: fetchError } = await supabase
    .from("reports")
    .select("*")
    .order("created_at", { ascending: false })

  if (fetchError) return { reports: [], error: fetchError.message }

  // Resolve user info
  const userIds = new Set<string>()
  ;(data || []).forEach((r: any) => {
    userIds.add(r.reported_user_id)
    userIds.add(r.reported_by)
  })

  const { data: users } = await supabase
    .from("users")
    .select("id, username, email")
    .in("id", Array.from(userIds))

  const userMap = new Map((users || []).map((u: any) => [u.id, u]))

  const formatted = (data || []).map((r: any) => ({
    ...r,
    reportedUser: userMap.get(r.reported_user_id) || null,
    reportedBy: userMap.get(r.reported_by) || null,
  }))

  return { reports: formatted, error: null }
}

export async function resolveReport(reportId: string, action: "dismissed" | "banned") {
  const { user, error } = await requireOwner()
  if (error || !user) return { error: error || "Unauthorized" }

  const supabase = createAdminClient()

  const { error: updateError } = await supabase
    .from("reports")
    .update({ status: action, resolved_by: user.id, resolved_at: new Date().toISOString() })
    .eq("id", reportId)

  if (updateError) return { error: updateError.message }
  return { error: null }
}

export async function reportUser(reportedUserId: string, reason: string) {
  const user = await getCurrentUserFromCookie()
  if (!user) return { error: "Not authenticated" }

  if (user.id === reportedUserId) return { error: "Cannot report yourself" }

  // Rate limit reports
  const rl = rateLimiters.report(user.id)
  if (!rl.success) return { error: `Too many reports. Wait ${rl.retryAfterSeconds}s.` }

  const sanitizedReason = sanitizers.reason(reason)
  if (!sanitizedReason) return { error: "Reason is required" }

  const supabase = createAdminClient()
  const { error } = await supabase
    .from("reports")
    .insert({
      reported_user_id: reportedUserId,
      reported_by: user.id,
      reason: sanitizedReason,
    })

  if (error) return { error: error.message }
  return { error: null }
}

export async function removeFromCommunity(userId: string, communityId: string) {
  const { error } = await requireOwnerOrMod()
  if (error) return { error }

  const supabase = createAdminClient()
  const { error: delError } = await supabase
    .from("community_members")
    .delete()
    .eq("user_id", userId)
    .eq("community_id", communityId)

  if (delError) return { error: delError.message }
  return { error: null }
}

export async function checkBanStatus(email: string) {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("bans")
    .select("email, reason")
    .eq("email", email)
    .maybeSingle()

  return { isBanned: !!data, reason: data?.reason || null }
}

export async function checkMuteStatus() {
  const user = await getCurrentUserFromCookie()
  if (!user) return { isMuted: false, mutedUntil: null, reason: null }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("mutes")
    .select("muted_until, reason")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!data) return { isMuted: false, mutedUntil: null, reason: null }

  const isMuted = new Date(data.muted_until) > new Date()
  return { isMuted, mutedUntil: data.muted_until, reason: data.reason }
}
