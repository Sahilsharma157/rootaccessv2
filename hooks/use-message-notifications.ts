"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"

export function useMessageNotifications() {
  const hasSetupRef = useRef(false)

  useEffect(() => {
    if (hasSetupRef.current) return
    hasSetupRef.current = true

    async function setupNotifications() {
      try {
        const supabase = createClient()

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) return

        // Request notification permission if not already granted
        if ("Notification" in window && Notification.permission === "default") {
          await Notification.requestPermission()
        }

        // Only listen if notifications are allowed
        if (Notification.permission !== "granted") return

        // Listen for new messages in real-time
        const subscription = supabase
          .channel("direct_messages_all")
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "direct_messages",
              filter: `receiver_id=eq.${user.id}`,
            },
            async (payload) => {
              const message = payload.new

              // Get sender info
              const { data: sender } = await supabase
                .from("profiles")
                .select("username, avatar_url")
                .eq("id", message.sender_id)
                .single()

              // Show notification
              if ("Notification" in window) {
                new Notification(`Message from ${sender?.username || "User"}`, {
                  body: message.content.substring(0, 50) + (message.content.length > 50 ? "..." : ""),
                  icon: sender?.avatar_url || "/favicon.ico",
                  tag: "dm-notification",
                  requireInteraction: false,
                  data: {
                    conversationId: message.conversation_id,
                  },
                })
              }
            }
          )
          .subscribe()

        return () => {
          supabase.removeChannel(subscription)
        }
      } catch (error) {
        console.error("Error setting up notifications:", error)
      }
    }

    setupNotifications()
  }, [])
}
