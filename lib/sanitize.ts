// Input sanitization utilities for XSS prevention and length enforcement

/** Strip HTML tags from a string */
function stripHtml(input: string): string {
  return input.replace(/<[^>]*>/g, "")
}

/** Remove potential script injections */
function stripScripts(input: string): string {
  return input
    .replace(/javascript:/gi, "")
    .replace(/on\w+\s*=/gi, "")
    .replace(/data:/gi, "")
}

/** Core sanitize: trim, strip HTML/scripts, enforce max length */
export function sanitize(input: string, maxLength: number): string {
  if (!input || typeof input !== "string") return ""
  return stripScripts(stripHtml(input.trim())).slice(0, maxLength)
}

/** Sanitize and ensure no empty result */
export function sanitizeRequired(input: string, maxLength: number): { value: string; error?: string } {
  const cleaned = sanitize(input, maxLength)
  if (!cleaned) return { value: "", error: "This field is required" }
  return { value: cleaned }
}

// Field-specific sanitizers with appropriate limits
export const sanitizers = {
  username: (v: string) => sanitize(v, 30).replace(/[^a-zA-Z0-9_-]/g, ""),
  email: (v: string) => sanitize(v, 254).toLowerCase(),
  password: (v: string) => (v || "").slice(0, 128), // Don't strip HTML from passwords
  message: (v: string) => sanitize(v, 2000),
  communityName: (v: string) => sanitize(v, 50),
  communityDescription: (v: string) => sanitize(v, 200),
  channelName: (v: string) => sanitize(v, 30).toLowerCase().replace(/[^a-z0-9-]/g, ""),
  bio: (v: string) => sanitize(v, 500),
  displayName: (v: string) => sanitize(v, 50),
  searchQuery: (v: string) => sanitize(v, 100),
  reason: (v: string) => sanitize(v, 500),
  profileField: (v: string) => sanitize(v, 100),
}
