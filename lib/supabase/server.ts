import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const supabaseUrl = "https://eadjgcdmqempwloxbmyi.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGpnY2RtcWVtcHdsb3hibXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNTYwNzcsImV4cCI6MjA4MzkzMjA3N30.8vrwvNtskms7AR6l3EIba34o1-LuPjJXXLHxqu0YG3g"

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
        } catch {
          // The "setAll" method was called from a Server Component.
          // This can be ignored if you have proxy refreshing
          // user sessions.
        }
      },
    },
  })
}
