'use client'

import { useState, useEffect } from 'react'
import { getUserXP, getUserRank } from '@/lib/actions/xp'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Zap, Trophy, Target } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface XPStatsProps {
  userId: string
}

export function XPStats({ userId }: XPStatsProps) {
  const [xpData, setXpData] = useState<any>(null)
  const [rank, setRank] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadXPData = async () => {
      const xp = await getUserXP(userId, null)
      const { rank: userRank } = await getUserRank(userId, null)
      setXpData(xp)
      setRank(userRank)
      setLoading(false)
    }

    loadXPData()
  }, [userId])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Loading XP data...</div>
  }

  if (!xpData?.hasJoined) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p className="text-sm">Join the leaderboard to start earning XP!</p>
      </div>
    )
  }

  const getLevelColor = (level: number) => {
    if (level >= 10) return 'bg-red-500'
    if (level >= 7) return 'bg-purple-500'
    if (level >= 5) return 'bg-blue-500'
    if (level >= 3) return 'bg-green-500'
    return 'bg-slate-500'
  }

  const getNextMilestone = (xp: number) => {
    const currentLevel = Math.floor(xp / 500)
    const nextLevelXP = (currentLevel + 1) * 500
    return nextLevelXP
  }

  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        {/* Total XP */}
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground font-medium">XP</span>
          </div>
          <p className="text-lg sm:text-xl font-bold">{xpData.xp}</p>
        </Card>

        {/* Level */}
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Target className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-muted-foreground font-medium">Level</span>
          </div>
          <Badge className={`${getLevelColor(xpData.level)} text-white w-full justify-center text-sm`}>
            {xpData.level}
          </Badge>
        </Card>

        {/* Rank */}
        <Card className="p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground font-medium">Rank</span>
          </div>
          <p className="text-lg sm:text-xl font-bold">#{rank || '—'}</p>
        </Card>
      </div>

      {/* Progress to next level */}
      <Card className="p-3 sm:p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs sm:text-sm font-medium">Progress to Level {xpData.level + 1}</span>
          <span className="text-xs text-muted-foreground">{xpData.xpInLevel}/{xpData.xpNeeded} XP</span>
        </div>
        <Progress value={xpData.progressPercent} className="h-2" />
      </Card>

      {/* XP Info */}
      <div className="text-xs text-muted-foreground text-center">
        <p>Earn 1 XP per minute on the platform</p>
      </div>
    </div>
  )
}
