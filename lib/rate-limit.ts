// In-memory sliding window rate limiter
// Tracks requests per key (e.g. IP or userId) within a time window

interface RateLimitEntry {
  timestamps: number[]
}

const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000
let lastCleanup = Date.now()

function cleanup(windowMs: number) {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, entry] of store.entries()) {
    entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)
    if (entry.timestamps.length === 0) store.delete(key)
  }
}

interface RateLimitOptions {
  /** Unique identifier for the action (e.g. "login", "sendMessage") */
  action: string
  /** The key to rate limit on (e.g. userId, email, IP) */
  key: string
  /** Max requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSeconds: number
}

interface RateLimitResult {
  success: boolean
  remaining: number
  retryAfterSeconds?: number
}

export function rateLimit({ action, key, limit, windowSeconds }: RateLimitOptions): RateLimitResult {
  const windowMs = windowSeconds * 1000
  const now = Date.now()
  const storeKey = `${action}:${key}`

  cleanup(windowMs)

  const entry = store.get(storeKey) || { timestamps: [] }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs)

  if (entry.timestamps.length >= limit) {
    const oldestInWindow = entry.timestamps[0]
    const retryAfterMs = windowMs - (now - oldestInWindow)
    return {
      success: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil(retryAfterMs / 1000),
    }
  }

  entry.timestamps.push(now)
  store.set(storeKey, entry)

  return {
    success: true,
    remaining: limit - entry.timestamps.length,
  }
}

// Preset rate limiters for common actions
export const rateLimiters = {
  login: (key: string) => rateLimit({ action: "login", key, limit: 5, windowSeconds: 60 }),
  signup: (key: string) => rateLimit({ action: "signup", key, limit: 3, windowSeconds: 60 }),
  message: (key: string) => rateLimit({ action: "message", key, limit: 30, windowSeconds: 60 }),
  createCommunity: (key: string) => rateLimit({ action: "createCommunity", key, limit: 5, windowSeconds: 300 }),
  report: (key: string) => rateLimit({ action: "report", key, limit: 5, windowSeconds: 300 }),
  search: (key: string) => rateLimit({ action: "search", key, limit: 20, windowSeconds: 60 }),
  profileUpdate: (key: string) => rateLimit({ action: "profileUpdate", key, limit: 10, windowSeconds: 60 }),
}
