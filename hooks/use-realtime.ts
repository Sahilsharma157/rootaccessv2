"use client"

import { useEffect, useRef, useCallback, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

// Generic realtime subscription hook for any table
export function useRealtimeMessages<T extends { id: string }>(
  table: string,
  filterColumn: string,
  filterValue: string | null,
  initialMessages: T[],
) {
  const [messages, setMessages] = useState<T[]>(initialMessages)
  const channelRef = useRef<RealtimeChannel | null>(null)

  // Sync initial messages when they change (e.g. conversation switch)
  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    if (!filterValue) return

    const supabase = createClient()

    // Clean up previous subscription
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    const channelName = `${table}-${filterValue}-${Date.now()}`

    channelRef.current = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: table,
          filter: `${filterColumn}=eq.${filterValue}`,
        },
        (payload) => {
          const newRow = payload.new as T
          setMessages((prev) => {
            // Prevent duplicates
            if (prev.some((m) => m.id === newRow.id)) return prev
            return [...prev, newRow]
          })
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: table,
        },
        (payload) => {
          const oldRow = payload.old as { id: string }
          setMessages((prev) => prev.filter((m) => m.id !== oldRow.id))
        },
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [table, filterColumn, filterValue])

  const addOptimistic = useCallback((msg: T) => {
    setMessages((prev) => {
      if (prev.some((m) => m.id === msg.id)) return prev
      return [...prev, msg]
    })
  }, [])

  return { messages, addOptimistic, setMessages }
}

// Hook to subscribe to conversation list updates
export function useRealtimeConversations(
  userId: string | null,
  onUpdate: () => void,
) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!userId) return

    const supabase = createClient()

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
    }

    channelRef.current = supabase
      .channel(`conv-updates-${userId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "conversations",
        },
        () => {
          onUpdate()
        },
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        () => {
          onUpdate()
        },
      )
      .subscribe()

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [userId, onUpdate])
}
