'use client'

import { useEffect, useState } from 'react'
import { recordSessionXP } from '@/lib/actions/xp'
import { getCurrentUserId } from '@/lib/actions/auth'

export function SessionXPTracker() {
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Get user ID on mount
    const fetchUserId = async () => {
      try {
        const id = await getCurrentUserId()
        setUserId(id)
      } catch (error) {
        console.log('[v0] Failed to get current user ID:', error)
      }
    }

    fetchUserId()
  }, [])

  useEffect(() => {
    if (!userId) return

    let interval: NodeJS.Timeout

    const startTracking = async () => {
      console.log('[v0] Starting session XP tracking for user:', userId)

      // Award XP every minute
      interval = setInterval(async () => {
        const result = await recordSessionXP(userId)
        if (result.success) {
          console.log('[v0] Awarded 1 XP, new total:', result.newXP)
        }
      }, 60000) // Every 60 seconds
    }

    startTracking()

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [userId])

  return null
}
