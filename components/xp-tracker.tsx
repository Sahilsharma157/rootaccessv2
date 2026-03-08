'use client'

import { useXPTimer } from '@/hooks/use-xp-timer'
import { useEffect, useState } from 'react'
import { getUser } from '@/lib/auth-utils'

export function XPTracker() {
  const [userId, setUserId] = useState<string | undefined>()
  const [communityId, setCommunityId] = useState<string | undefined>()

  useEffect(() => {
    const fetchUserAndCommunity = async () => {
      try {
        // Get current user
        const user = await getUser()
        if (user) {
          setUserId(user.id)
          
          // Get user's first community
          const response = await fetch('/api/user-community')
          if (response.ok) {
            const data = await response.json()
            setCommunityId(data.communityId)
          }
        }
      } catch (error) {
        console.error('[v0] Error fetching user data:', error)
      }
    }

    fetchUserAndCommunity()
  }, [])

  // Use the XP timer hook
  useXPTimer(userId, communityId)

  return null
}
