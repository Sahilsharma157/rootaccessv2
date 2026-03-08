import { createBrowserClient } from "@supabase/ssr"

const supabaseUrl = "https://eadjgcdmqempwloxbmyi.supabase.co"
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhZGpnY2RtcWVtcHdsb3hibXlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNTYwNzcsImV4cCI6MjA4MzkzMjA3N30.8vrwvNtskms7AR6l3EIba34o1-LuPjJXXLHxqu0YG3g"

export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
