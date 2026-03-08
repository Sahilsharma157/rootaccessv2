'use client'

import { useEffect, useRef } from 'react'
import { addXP } from '@/lib/actions/xp'

export function useXPTimer(userId: string | undefined, communityId: string | undefined) {
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastXPTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    if (!userId || !communityId) {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      return
    }

    // Award 1 XP every minute of activity on the site
    const awardXPPerMinute = async () => {
      const now = Date.now()
      const minutesPassed = Math.floor((now - lastXPTimeRef.current) / (1000 * 60))

      if (minutesPassed >= 1) {
        // Award XP for each full minute
        const xpToAward = minutesPassed
        const result = await addXP(userId, communityId, xpToAward, 'time_spent')
        
        if (result.success) {
          console.log(`[v0] Awarded ${xpToAward} XP for ${minutesPassed} minute(s)`)
        }
        
        lastXPTimeRef.current = now
      }
    }

    // Set up interval to check and award XP every 10 seconds
    timerRef.current = setInterval(awardXPPerMinute, 10000)

    // Cleanup
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [userId, communityId])
}
