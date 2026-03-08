"use server"

import { createAdminClient } from "@/lib/supabase/admin"
import {
  hashPassword,
  verifyPassword,
  setSignedCookie,
  clearSignedCookie,
  getCurrentUserFromCookie,
} from "@/lib/auth-utils"
import { rateLimiters } from "@/lib/rate-limit"
import { sanitizers } from "@/lib/sanitize"

export async function signUp(formData: FormData) {
  const username = sanitizers.username((formData.get("username") as string) || "")
  const email = sanitizers.email((formData.get("email") as string) || "")
  const password = sanitizers.password((formData.get("password") as string) || "")

  if (!username || !email || !password) {
    return { error: "All fields are required" }
  }

  if (password.length < 6) {
    return { error: "Password must be at least 6 characters" }
  }

  // Rate limit signups by email
  const rl = rateLimiters.signup(email)
  if (!rl.success) {
    return { error: `Too many attempts. Try again in ${rl.retryAfterSeconds}s.` }
  }

  const supabase = createAdminClient()

  // Check ban + existing user in parallel
  const [{ data: banData }, { data: byEmail }, { data: byUsername }] = await Promise.all([
    supabase.from("bans").select("reason").eq("email", email).maybeSingle(),
    supabase.from("users").select("id").eq("email", email).limit(1),
    supabase.from("users").select("id").eq("username", username).limit(1),
  ])

  if (banData) {
    return { error: "This email has been banned from the platform." }
  }

  if ((byEmail && byEmail.length > 0) || (byUsername && byUsername.length > 0)) {
    return { error: "Username or email already taken" }
  }

  // Insert new user with hashed password
  const passwordHash = await hashPassword(password)
  const { data, error } = await supabase
    .from("users")
    .insert({ username, email, password_hash: passwordHash })
    .select("id")
    .single()

  if (error) {
    return { error: "Could not create account. Try a different username or email." }
  }

  // Also create a profile row
  await supabase.from("profiles").insert({
    id: data.id,
    username,
    email,
    display_name: username,
  })

  // Set signed auth cookie (30 days for signup)
  await setSignedCookie("user_id", data.id, { maxAge: 60 * 60 * 24 * 30 })

  return { success: true }
}

export async function signIn(formData: FormData) {
  const email = sanitizers.email((formData.get("email") as string) || "")
  const password = sanitizers.password((formData.get("password") as string) || "")
  const staySignedIn = formData.get("staySignedIn") === "true"

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  // Rate limit logins by email
  const rl = rateLimiters.login(email)
  if (!rl.success) {
    return { error: `Too many login attempts. Try again in ${rl.retryAfterSeconds}s.` }
  }

  const supabase = createAdminClient()

  // Look up user and check ban in parallel
  const [{ data: users }, { data: banData }] = await Promise.all([
    supabase.from("users").select("id, email, username, password_hash").eq("email", email).limit(1),
    supabase.from("bans").select("reason").eq("email", email).maybeSingle(),
  ])

  if (banData) {
    return { error: `Your account has been banned. Reason: ${banData.reason || "Violation of community guidelines"}` }
  }

  const user = users?.[0]
  if (!user || !user.password_hash) {
    return { error: "Invalid email or password" }
  }

  // Verify password (supports both PBKDF2 and legacy SHA-256)
  const isValid = await verifyPassword(password, user.password_hash)
  if (!isValid) return { error: "Invalid email or password" }

  // Rehash legacy SHA-256 passwords to PBKDF2 (non-blocking)
  if (!user.password_hash.includes(":")) {
    hashPassword(password).then((newHash) => {
      supabase.from("users").update({ password_hash: newHash }).eq("id", user.id)
    })
  }

  // Set signed auth cookie
  const cookieOptions: Record<string, any> = {}
  if (staySignedIn) {
    cookieOptions.maxAge = 60 * 60 * 24 * 365 // 1 year
  }
  await setSignedCookie("user_id", user.id, cookieOptions)

  return { success: true }
}

export async function signOut() {
  await clearSignedCookie("user_id")
  return { success: true }
}

export async function logout() {
  return signOut()
}

export async function getCurrentUser() {
  return getCurrentUserFromCookie()
}

export async function getUserData() {
  return getCurrentUser()
}

export async function getCurrentUserId(): Promise<string | null> {
  const user = await getCurrentUser()
  return user?.id || null
}
