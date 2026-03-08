"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "./auth"
import { revalidatePath } from "next/cache"
import { rateLimiters } from "@/lib/rate-limit"
import { sanitizers } from "@/lib/sanitize"

export async function updateProfile(data: {
  display_name?: string
  bio?: string
  location?: string
  website?: string
  building?: string
  twitter?: string
  linkedin?: string
  github?: string
}) {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  // Rate limit profile updates
  const rl = rateLimiters.profileUpdate(user.id)
  if (!rl.success) {
    return { error: `Too many updates. Wait ${rl.retryAfterSeconds}s.` }
  }

  // Sanitize all profile fields
  const sanitizedData: Record<string, string | undefined> = {}
  if (data.display_name !== undefined) sanitizedData.display_name = sanitizers.displayName(data.display_name)
  if (data.bio !== undefined) sanitizedData.bio = sanitizers.bio(data.bio)
  if (data.location !== undefined) sanitizedData.location = sanitizers.profileField(data.location)
  if (data.website !== undefined) sanitizedData.website = sanitizers.profileField(data.website)
  if (data.building !== undefined) sanitizedData.building = sanitizers.profileField(data.building)
  if (data.twitter !== undefined) sanitizedData.twitter = sanitizers.profileField(data.twitter)
  if (data.linkedin !== undefined) sanitizedData.linkedin = sanitizers.profileField(data.linkedin)
  if (data.github !== undefined) sanitizedData.github = sanitizers.profileField(data.github)

  const supabase = createAdminClient()

  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle()

  if (existingProfile) {
    const { error } = await supabase
      .from("profiles")
      .update({
        ...sanitizedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (error) {
      return { error: "Failed to update profile" }
    }
  } else {
    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      ...sanitizedData,
    })

    if (error) {
      return { error: "Failed to create profile" }
    }
  }

  revalidatePath("/profile")
  return { success: true }
}

export async function deleteProfile() {
  const user = await getCurrentUser()

  if (!user) {
    return { error: "Not authenticated" }
  }

  const supabase = createAdminClient()

  const { error } = await supabase.from("profiles").delete().eq("id", user.id)

  if (error) {
    return { error: "Failed to delete profile" }
  }

  revalidatePath("/profile")
  return { success: true }
}

export async function getProfile(userId?: string) {
  const user = userId ? { id: userId } : await getCurrentUser()

  if (!user) {
    return null
  }

  const supabase = createAdminClient()

  // Get user data
  const { data: userData, error: userError } = await supabase
    .from("users")
    .select("username, email, created_at")
    .eq("id", user.id)
    .maybeSingle()

  if (userError || !userData) {
    return null
  }

  // Get profile data
  const { data: profileData } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle()

  return {
    id: user.id,
    ...userData,
    // Map profile fields for backwards compatibility
    full_name: profileData?.display_name || null,
    display_name: profileData?.display_name || null,
    bio: profileData?.bio || null,
    location: profileData?.location || null,
    website: profileData?.website || null,
    building: profileData?.building || null,
    x_handle: profileData?.twitter || null,
    twitter: profileData?.twitter || null,
    telegram: null,
    instagram: null,
    linkedin: profileData?.linkedin || null,
    github: profileData?.github || null,
    avatar_url: null,
  }
}

export async function getAllUsers() {
  const supabase = createAdminClient()

  const { data: users } = await supabase
    .from("users")
    .select("id, username, email")
    .limit(50)

  if (!users) return []

  const userIds = users.map((u) => u.id)
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, bio")
    .in("id", userIds)

  return users.map((u) => {
    const profile = profiles?.find((p) => p.id === u.id)
    return {
      id: u.id,
      username: u.username,
      email: u.email,
      profiles: {
        full_name: profile?.display_name || null,
        bio: profile?.bio || null,
        avatar_url: null,
      },
    }
  })
}
