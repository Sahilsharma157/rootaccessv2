import { useEffect } from 'react'
import { useUser } from '@/lib/auth-context'
import { recordSessionXP } from '@/lib/actions/xp'

export function useSessionXP() {
  const { user } = useUser()

  useEffect(() => {
    if (!user?.id) return

    // Award XP every minute
    const interval = setInterval(async () => {
      console.log('[v0] Recording session XP for user:', user.id)
      const result = await recordSessionXP(user.id)
      if (result.success) {
        console.log('[v0] Awarded 1 XP, new total:', result.newXP)
      }
    }, 60000) // Every minute

    return () => clearInterval(interval)
  }, [user?.id])
}
