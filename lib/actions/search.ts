"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserFromCookie } from "@/lib/auth-utils"
import { rateLimiters } from "@/lib/rate-limit"
import { sanitizers } from "@/lib/sanitize"

export async function searchUsers(query: string) {
  if (!query || query.trim().length < 1) {
    return { success: true, users: [] }
  }

  const currentUser = await getCurrentUserFromCookie()
  if (!currentUser) return { success: false, error: "Not authenticated", users: [] }

  // Rate limit searches
  const rl = rateLimiters.search(currentUser.id)
  if (!rl.success) return { success: false, error: "Too many searches. Slow down.", users: [] }

  const supabase = createAdminClient()
  const sanitizedQuery = sanitizers.searchQuery(query)
  if (!sanitizedQuery) return { success: true, users: [] }
  const searchTerm = `%${sanitizedQuery}%`

  // Search users by username and email separately (no .or() interpolation)
  const [{ data: usersByName, error }, { data: usersByEmail }] = await Promise.all([
    supabase.from("users").select("id, username, email").ilike("username", searchTerm).neq("id", currentUser.id).limit(20),
    supabase.from("users").select("id, username, email").ilike("email", searchTerm).neq("id", currentUser.id).limit(20),
  ])

  // Also search profiles by display_name
  const { data: profilesByName } = await supabase
    .from("profiles")
    .select("id, display_name")
    .ilike("display_name", searchTerm)
    .limit(20)

  // Merge results - get any users found through profile display_name search
  const profileUserIds = (profilesByName || [])
    .map((p) => p.id)
    .filter((id) => id !== currentUser.id)

  let extraUsers: any[] = []
  if (profileUserIds.length > 0) {
    const { data } = await supabase
      .from("users")
      .select("id, username, email")
      .in("id", profileUserIds)
    extraUsers = data || []
  }

  // Combine and deduplicate
  const allUsersMap = new Map<string, any>()
  for (const u of [...(usersByName || []), ...(usersByEmail || []), ...extraUsers]) {
    allUsersMap.set(u.id, u)
  }
  const users = Array.from(allUsersMap.values()).slice(0, 20)

  if (error) {
    return { success: false, error: error.message, users: [] }
  }

  if (users.length === 0) {
    return { success: true, users: [] }
  }

  // Get profiles for matched users (profiles.id = users.id)
  const userIds = users.map((u: any) => u.id)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, bio, location, building")
    .in("id", userIds)

  // Get roles for matched users
  const { data: roles } = await supabase
    .from("user_roles")
    .select("user_id, role")
    .in("user_id", userIds)

  const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]))

  const usersWithProfiles = users.map((user: any) => {
    const profile = profiles?.find((p: any) => p.id === user.id)
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: profile?.display_name || null,
      bio: profile?.bio || null,
      location: profile?.location || null,
      building: profile?.building || null,
      avatar_url: null,
      role: roleMap.get(user.id) || "member",
    }
  })

  return { success: true, users: usersWithProfiles }
}
