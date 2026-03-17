'use client'

import { useState, useEffect } from 'react'
import { getLeaderboard, getUserRank, joinLeaderboard } from '@/lib/actions/xp'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme-toggle'
import { Zap } from 'lucide-react'
import { toast } from 'sonner'

interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  displayName: string
  totalXP: number
  level: number
}

interface LeaderboardPanelProps {
  currentUserId?: string
  communityId?: string | null
}

export function LeaderboardPanel({ currentUserId, communityId }: LeaderboardPanelProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [userRank, setUserRank] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasJoined, setHasJoined] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      const { leaderboard: data } = await getLeaderboard(null, 50)
      setLeaderboard(data)
      
      if (currentUserId) {
        const { rank } = await getUserRank(currentUserId, null)
        setUserRank(rank)
        setHasJoined(rank > 0)
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [currentUserId])

  const handleJoinLeaderboard = async () => {
    if (!currentUserId) {
      toast.error('Must be logged in')
      return
    }
    
    setJoining(true)
    const { success, error } = await joinLeaderboard(currentUserId, null)
    
    if (success) {
      toast.success('Joined leaderboard')
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { leaderboard: newData } = await getLeaderboard(null, 50)
      setLeaderboard(newData)
      
      const { rank } = await getUserRank(currentUserId, null)
      setUserRank(rank)
      setHasJoined(true)
    } else {
      toast.error(error || 'Failed to join')
    }
    
    setJoining(false)
  }

  const getRankDisplay = (rank: number) => {
    if (rank === 1) return '1st'
    if (rank === 2) return '2nd'
    if (rank === 3) return '3rd'
    return `${rank}th`
  }

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-yellow-500/15 text-yellow-700 border-yellow-200/50 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-400/30'
    if (rank === 2) return 'bg-slate-500/15 text-slate-700 border-slate-200/50 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-400/30'
    if (rank === 3) return 'bg-orange-500/15 text-orange-700 border-orange-200/50 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-400/30'
    return 'bg-secondary/50 text-secondary-foreground border-border/30 dark:bg-secondary/40'
  }

  const getLevelColor = (level: number) => {
    if (level >= 15) return 'bg-red-500/15 text-red-700 border-red-200/50 dark:bg-red-500/10 dark:text-red-400 dark:border-red-400/30'
    if (level >= 12) return 'bg-purple-500/15 text-purple-700 border-purple-200/50 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-400/30'
    if (level >= 10) return 'bg-blue-500/15 text-blue-700 border-blue-200/50 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-400/30'
    if (level >= 7) return 'bg-cyan-500/15 text-cyan-700 border-cyan-200/50 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-400/30'
    if (level >= 5) return 'bg-teal-500/15 text-teal-700 border-teal-200/50 dark:bg-teal-500/10 dark:text-teal-400 dark:border-teal-400/30'
    return 'bg-slate-500/15 text-slate-700 border-slate-200/50 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-400/30'
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground text-sm">Loading rankings...</div>
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      {/* Desktop Header */}
      <div className="hidden md:flex p-6 border-b border-border/50 items-center justify-between">
        <div>
          <h2 className="font-semibold text-2xl">Global Rankings</h2>
          <p className="text-sm text-muted-foreground mt-1">Climb by earning XP</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Your Rank Card */}
      <div className="px-4 md:px-6 pt-4 md:pt-0">
        {hasJoined ? (
          <Card className="p-4 rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 to-primary/5 hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground font-semibold">Your Rank</p>
                <p className="text-3xl font-bold text-primary mt-2">#{userRank}</p>
              </div>
              <Badge className={`${getRankBadgeColor(userRank)} border text-sm font-semibold px-3 py-1`}>
                {getRankDisplay(userRank)} place
              </Badge>
            </div>
          </Card>
        ) : (
          <Button 
            onClick={handleJoinLeaderboard} 
            disabled={joining}
            className="w-full rounded-xl h-11"
          >
            {joining ? 'Joining...' : 'Join Rankings'}
          </Button>
        )}
      </div>

      {/* Top 3 Podium */}
      {leaderboard.length >= 3 && (
        <div className="px-4 md:px-6 pt-3 pb-1">
          <div className="flex items-end justify-center gap-2">
            {/* 2nd Place */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-8 h-8 rounded-full bg-slate-500/20 border-2 border-slate-400/50 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                {leaderboard[1]?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <p className="text-[10px] font-semibold text-foreground truncate max-w-[60px] text-center leading-tight mb-1">@{leaderboard[1]?.username}</p>
              <div className="w-full bg-slate-400/20 border border-slate-400/30 rounded-t-lg h-8 flex items-center justify-center">
                <span className="text-sm font-black text-slate-500 dark:text-slate-400">2</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center flex-1">
              <span className="text-yellow-500 text-sm leading-none mb-0.5">&#9733;</span>
              <div className="w-9 h-9 rounded-full bg-yellow-500/20 border-2 border-yellow-400/60 flex items-center justify-center text-sm font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                {leaderboard[0]?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <p className="text-[10px] font-semibold text-foreground truncate max-w-[60px] text-center leading-tight mb-1">@{leaderboard[0]?.username}</p>
              <div className="w-full bg-yellow-400/20 border border-yellow-400/40 rounded-t-lg h-12 flex items-center justify-center">
                <span className="text-base font-black text-yellow-500 dark:text-yellow-400">1</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center flex-1">
              <div className="w-8 h-8 rounded-full bg-orange-500/20 border-2 border-orange-400/50 flex items-center justify-center text-xs font-bold text-orange-600 dark:text-orange-400 mb-1">
                {leaderboard[2]?.username?.[0]?.toUpperCase() ?? '?'}
              </div>
              <p className="text-[10px] font-semibold text-foreground truncate max-w-[60px] text-center leading-tight mb-1">@{leaderboard[2]?.username}</p>
              <div className="w-full bg-orange-400/20 border border-orange-400/30 rounded-t-lg h-5 flex items-center justify-center">
                <span className="text-sm font-black text-orange-500 dark:text-orange-400">3</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard List - starts from 4th */}
      <div>
        <div className="space-y-3 p-4 md:p-6">
          {leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-medium text-foreground">No rankings yet</p>
              <p className="text-xs text-muted-foreground mt-2">Be the first to join</p>
            </div>
          ) : (
            leaderboard.filter((entry) => entry.rank > 3).map((entry) => {
              const isCurrentUser = entry.userId === currentUserId
              const xpProgress = ((entry.totalXP % 500) / 500) * 100

              return (
                <Card
                  key={entry.userId}
                  className={`p-4 rounded-xl transition-all duration-300 border ${
                    isCurrentUser 
                      ? 'bg-gradient-to-r from-primary/15 to-primary/5 border-primary/40 hover:border-primary/60 hover:shadow-lg' 
                      : 'bg-card/40 border-border/30 hover:border-border/60 hover:shadow-md hover:bg-card/60'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Rank Badge */}
                    <div className="flex-shrink-0 pt-1">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-base border ${getRankBadgeColor(entry.rank)}`}
                      >
                        {entry.rank}
                      </div>
                    </div>

                    {/* User Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                        <p className="font-semibold text-foreground truncate">@{entry.username}</p>
                        <Badge 
                          variant="outline"
                          className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${getLevelColor(entry.level)}`}
                        >
                          Lv {entry.level}
                        </Badge>
                        {isCurrentUser && (
                          <Badge className="text-xs font-semibold bg-primary/20 text-primary border-0 rounded-full">
                            You
                          </Badge>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1.5">
                        <div className="h-2.5 bg-secondary/40 rounded-full overflow-hidden border border-border/20">
                          <div
                            className="h-full bg-gradient-to-r from-primary/70 to-primary/40 rounded-full transition-all duration-500"
                            style={{ width: `${xpProgress}%` }}
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Zap className="w-3 h-3 text-primary/80" />
                          {entry.totalXP.toLocaleString()} XP
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
