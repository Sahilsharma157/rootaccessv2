import { cookies } from "next/headers"
import { createAdminClient } from "@/lib/supabase/admin"

const SECRET = process.env.SUPABASE_JWT_SECRET || "fallback-secret-key"

// --- HMAC Cookie Signing ---
async function hmacSign(value: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const signature = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(value))
  const sigHex = Array.from(new Uint8Array(signature)).map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${value}.${sigHex}`
}

async function hmacVerify(signedValue: string): Promise<string | null> {
  const lastDot = signedValue.lastIndexOf(".")
  if (lastDot === -1) return null

  const value = signedValue.slice(0, lastDot)
  const providedSig = signedValue.slice(lastDot + 1)

  const encoder = new TextEncoder()
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const expectedSig = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(value))
  const expectedHex = Array.from(new Uint8Array(expectedSig)).map((b) => b.toString(16).padStart(2, "0")).join("")

  // Constant-time comparison
  if (providedSig.length !== expectedHex.length) return null
  let mismatch = 0
  for (let i = 0; i < providedSig.length; i++) {
    mismatch |= providedSig.charCodeAt(i) ^ expectedHex.charCodeAt(i)
  }
  return mismatch === 0 ? value : null
}

export async function setSignedCookie(name: string, value: string, options: Record<string, any> = {}) {
  const signed = await hmacSign(value)
  const cookieStore = await cookies()
  cookieStore.set(name, signed, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    ...options,
  })
}

export async function getSignedCookie(name: string): Promise<string | null> {
  const cookieStore = await cookies()
  const raw = cookieStore.get(name)?.value
  if (!raw) return null

  // Support both signed (new) and unsigned (legacy) cookies
  if (raw.includes(".")) {
    return hmacVerify(raw)
  }

  // Legacy unsigned UUID cookie - still valid but will be re-signed on next login
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(raw)) {
    return raw
  }

  return null
}

export async function clearSignedCookie(name: string) {
  const cookieStore = await cookies()
  cookieStore.set(name, "", { httpOnly: true, maxAge: 0, path: "/" })
}

// --- PBKDF2 Password Hashing ---
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const salt = globalThis.crypto.getRandomValues(new Uint8Array(16))
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("")

  const keyMaterial = await globalThis.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"])
  const derivedBits = await globalThis.crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 10000, hash: "SHA-256" },
    keyMaterial,
    256
  )
  const hashHex = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("")

  return `${saltHex}:${hashHex}`
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  // PBKDF2 format: salt:hash
  if (storedHash.includes(":")) {
    const [saltHex, expectedHash] = storedHash.split(":")
    const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
    const encoder = new TextEncoder()
    const keyMaterial = await globalThis.crypto.subtle.importKey("raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"])
    const derivedBits = await globalThis.crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 10000, hash: "SHA-256" },
      keyMaterial,
      256
    )
    const computedHash = Array.from(new Uint8Array(derivedBits)).map((b) => b.toString(16).padStart(2, "0")).join("")
    
    // Constant-time comparison
    if (computedHash.length !== expectedHash.length) return false
    let mismatch = 0
    for (let i = 0; i < computedHash.length; i++) {
      mismatch |= computedHash.charCodeAt(i) ^ expectedHash.charCodeAt(i)
    }
    return mismatch === 0
  }

  // Legacy SHA-256 (no salt) - backward compatible
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await globalThis.crypto.subtle.digest("SHA-256", data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const computed = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return computed === storedHash
}

// --- Centralized getCurrentUser from signed cookie ---
export async function getCurrentUserFromCookie() {
  const userId = await getSignedCookie("user_id")
  if (!userId) return null

  const supabase = createAdminClient()
  const { data } = await supabase
    .from("users")
    .select("id, username, email")
    .eq("id", userId)
    .maybeSingle()

  return data || null
}

// Alias for consistency
export const getUser = getCurrentUserFromCookie
