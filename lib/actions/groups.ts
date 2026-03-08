"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentUserFromCookie } from "@/lib/auth-utils"
import { sanitizers } from "@/lib/sanitize"

export async function createGroup(name: string, description: string) {
  const user = await getCurrentUserFromCookie()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const sanitizedName = sanitizers.communityName(name)
  const sanitizedDesc = sanitizers.communityDescription(description)
  if (!sanitizedName) return { error: "Group name is required" }

  const supabase = createClient()

  // Create group
  const { data: group, error: groupError } = await supabase
    .from("groups")
    .insert({ name: sanitizedName, description: sanitizedDesc, created_by: user.id })
    .select()
    .single()

  if (groupError) {
    return { error: groupError.message }
  }

  // Add creator as first member
  const { error: memberError } = await supabase.from("group_members").insert({ group_id: group.id, user_id: user.id })

  if (memberError) {
    return { error: memberError.message }
  }

  return { success: true, group }
}

export async function getGroups() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("groups")
    .select(`
      *,
      group_members(count)
    `)
    .order("created_at", { ascending: false })

  if (error) {
    return { error: error.message }
  }

  return { groups: data }
}

export async function joinGroup(groupId: string) {
  const user = await getCurrentUserFromCookie()
  if (!user) {
    return { error: "Not authenticated" }
  }

  const supabase = createClient()

  const { error } = await supabase.from("group_members").insert({ group_id: groupId, user_id: user.id })

  if (error) {
    return { error: error.message }
  }

  return { success: true }
}

export async function getGroupMembers(groupId: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("group_members")
    .select(`
      *,
      users(id, username, email)
    `)
    .eq("group_id", groupId)

  if (error) {
    return { error: error.message }
  }

  return { members: data }
}
