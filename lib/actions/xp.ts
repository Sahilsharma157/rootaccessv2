'use server'

import { createAdminClient } from '@/lib/supabase/admin'

// Simplified XP system - no community ID requirement
export async function getLeaderboard(communityId: string | null, limit: number = 50) {
  const supabase = createAdminClient()
  
  const { data, error } = await supabase
    .from('user_xp')
    .select('user_id, total_xp, level')
    .order('total_xp', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('[v0] Error fetching leaderboard:', error)
    return { leaderboard: [], error: error.message }
  }

  // Fetch user profiles separately
  const userIds = (data || []).map((entry: any) => entry.user_id)
  
  if (userIds.length === 0) {
    return { leaderboard: [], error: null }
  }

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, display_name')
    .in('id', userIds)

  if (profileError) {
    console.error('[v0] Error fetching profiles:', profileError)
  }

  const profileMap = (profiles || []).reduce((acc: any, profile: any) => {
    acc[profile.id] = profile
    return acc
  }, {})

  const leaderboard = (data || []).map((entry: any, index: number) => {
    const profile = profileMap[entry.user_id]
    return {
      rank: index + 1,
      userId: entry.user_id,
      username: profile?.username || profile?.display_name || 'Anonymous',
      displayName: profile?.display_name || profile?.username || 'Anonymous',
      totalXP: entry.total_xp,
      level: entry.level,
    }
  })

  return { leaderboard, error: null }
}

export async function getUserRank(userId: string, communityId: string | null) {
  const supabase = createAdminClient()
  
  const { data: userXP, error: xpError } = await supabase
    .from('user_xp')
    .select('total_xp')
    .eq('user_id', userId)
    .maybeSingle()

  if (xpError || !userXP) {
    console.log('[v0] User not found in XP table:', xpError)
    return { rank: 0 }
  }

  const { count, error: countError } = await supabase
    .from('user_xp')
    .select('user_id', { count: 'exact' })
    .gt('total_xp', userXP.total_xp)

  if (countError) {
    console.error('[v0] Error counting ranks:', countError)
    return { rank: 0 }
  }

  return { rank: (count || 0) + 1 }
}

export async function joinLeaderboard(userId: string, communityId: string | null) {
  const supabase = createAdminClient()
  
  console.log('[v0] joinLeaderboard called with userId:', userId)

  try {
    // Check if user already has an entry
    const { data: existingXP, error: checkError } = await supabase
      .from('user_xp')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()

    console.log('[v0] Existing XP check:', { hasExisting: !!existingXP, checkError })

    if (existingXP) {
      return { success: false, error: 'Already joined the leaderboard' }
    }

    // Create new XP entry with NULL community_id for global leaderboard
    const { data: newEntry, error: insertError } = await supabase
      .from('user_xp')
      .insert({
        user_id: userId,
        community_id: null, // Use NULL for global leaderboard
        total_xp: 0,
        level: 1,
      })
      .select()

    console.log('[v0] Insert result:', { success: !insertError, insertError })

    if (insertError) {
      console.error('[v0] Insert error:', insertError)
      return { success: false, error: insertError.message }
    }

    return { success: true, message: 'Successfully joined the leaderboard!' }
  } catch (error: any) {
    console.error('[v0] Exception in joinLeaderboard:', error)
    return { success: false, error: error.message || 'Failed to join leaderboard' }
  }
}

export async function addXP(userId: string, amount: number, communityId: string | null = null) {
  const supabase = createAdminClient()

  try {
    // Get current XP
    const { data: currentXP, error: fetchError } = await supabase
      .from('user_xp')
      .select('total_xp, level')
      .eq('user_id', userId)
      .maybeSingle()

    // If user hasn't joined leaderboard, skip XP addition silently
    if (!currentXP) {
      return { success: false, newXP: 0 }
    }

    if (fetchError) {
      console.error('[v0] Error fetching current XP:', fetchError)
      return { success: false, newXP: 0 }
    }

    const newXP = currentXP.total_xp + amount
    const newLevel = Math.floor(newXP / 500) + 1

    const { error: updateError } = await supabase
      .from('user_xp')
      .update({
        total_xp: newXP,
        level: newLevel,
      })
      .eq('user_id', userId)

    if (updateError) {
      console.error('[v0] Error updating XP:', updateError)
      return { success: false, newXP: 0 }
    }

    return { success: true, newXP, newLevel }
  } catch (error) {
    console.error('[v0] Exception in addXP:', error)
    return { success: false, newXP: 0 }
  }
}

export async function getUserXP(userId: string, communityId: string | null = null) {
  const supabase = createAdminClient()

  const { data: userXP, error } = await supabase
    .from('user_xp')
    .select('total_xp, level')
    .eq('user_id', userId)
    .maybeSingle()

  if (error || !userXP) {
    return {
      hasJoined: false,
      xp: 0,
      level: 0,
      xpInLevel: 0,
      xpNeeded: 500,
      progressPercent: 0,
    }
  }

  const xpInLevel = userXP.total_xp % 500
  const xpNeeded = 500
  const progressPercent = (xpInLevel / xpNeeded) * 100

  return {
    hasJoined: true,
    xp: userXP.total_xp,
    level: userXP.level,
    xpInLevel,
    xpNeeded,
    progressPercent,
  }
}

export async function recordSessionXP(userId: string, communityId: string | null = null) {
  return addXP(userId, 1, communityId)
}
