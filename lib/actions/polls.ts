"use server"

import { createHash } from "crypto"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUserFromCookie } from "@/lib/auth-utils"

export async function createPoll(
  communityId: string | null,
  title: string,
  description: string,
  options: string[],
  endsAt: string
) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if user is admin
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", currentUser.id)
    .maybeSingle()

  const isAdmin = roleData?.role === "owner" || roleData?.role === "moderator"

  // Rate limiting: Admins unlimited, normal users 2 per day
  if (!isAdmin) {
    const now = new Date()
    const { data: tracker, error: trackerError } = await supabase
      .from("poll_creation_tracker")
      .select("polls_created_today, last_reset")
      .eq("user_id", currentUser.id)
      .maybeSingle()

    // Check if we need to reset the daily counter
    let pollsCreatedToday = 0
    if (tracker) {
      const lastReset = new Date(tracker.last_reset)
      const isNewDay = now.toDateString() !== lastReset.toDateString()

      if (isNewDay) {
        // Reset counter for new day
        await supabase
          .from("poll_creation_tracker")
          .update({ polls_created_today: 1, last_reset: now.toISOString() })
          .eq("user_id", currentUser.id)
        pollsCreatedToday = 1
      } else {
        pollsCreatedToday = tracker.polls_created_today
        if (pollsCreatedToday >= 2) {
          return { success: false, error: "You can only create 2 polls per day. Try again tomorrow!" }
        }
        // Increment today's counter
        await supabase
          .from("poll_creation_tracker")
          .update({ polls_created_today: pollsCreatedToday + 1 })
          .eq("user_id", currentUser.id)
      }
    } else {
      // First poll ever - create tracker
      await supabase
        .from("poll_creation_tracker")
        .insert({
          user_id: currentUser.id,
          polls_created_today: 1,
          last_reset: now.toISOString(),
        })
    }
  }

  // Create poll (community_id can be null)
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      community_id: communityId,
      created_by: currentUser.id,
      title,
      description,
      ends_at: endsAt,
      status: "active",
    })
    .select()
    .single()

  if (pollError || !poll) {
    return { success: false, error: pollError?.message || "Failed to create poll" }
  }

  // Create poll options
  const optionInserts = options.map((text, idx) => ({
    poll_id: poll.id,
    option_text: text,
    order_index: idx,
  }))

  const { data: createdOptions, error: optionsError } = await supabase
    .from("poll_options")
    .insert(optionInserts)
    .select()

  if (optionsError) {
    return { success: false, error: optionsError.message }
  }

  // Return poll with properly formatted options
  const formattedPoll = {
    ...poll,
    total_votes: 0,
    options: (createdOptions || []).map((opt: any) => ({
      id: opt.id,
      text: opt.option_text,
      vote_count: 0,
    })),
  }

  return { success: true, poll: formattedPoll, error: null }
}

export async function votePoll(pollId: string, optionId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { success: false, error: "Not authenticated" }
  }

  // Create anonymous hash for this user+poll combo (so same user can't vote twice, but vote is anonymous)
  const voterHash = createHash('sha256')
    .update(`${currentUser.id}:${pollId}`)
    .digest('hex')

  // Check if already voted
  const { data: existingVote } = await supabase
    .from("poll_votes")
    .select("id")
    .eq("poll_id", pollId)
    .eq("voter_hash", voterHash)
    .maybeSingle()

  if (existingVote) {
    return { success: false, error: "You have already voted on this poll" }
  }

  // Record vote anonymously
  const { error: voteError } = await supabase
    .from("poll_votes")
    .insert({
      poll_id: pollId,
      option_id: optionId,
      voter_hash: voterHash,
    })

  if (voteError) {
    return { success: false, error: voteError.message }
  }

  // Increment vote count on option
  const { error: updateError } = await supabase.rpc(
    "increment_vote_count",
    { option_id: optionId }
  )

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true, error: null }
}

export async function getPollWithResults(pollId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  // Get poll
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .maybeSingle()

  if (pollError || !poll) {
    return { poll: null, options: [], userVote: null, error: "Poll not found" }
  }

  // Get options with vote counts
  const { data: options } = await supabase
    .from("poll_options")
    .select("*")
    .eq("poll_id", pollId)
    .order("created_at", { ascending: true })

  // Check if user has voted
  let userVote = null
  if (currentUser) {
    const { data: vote } = await supabase
      .from("poll_votes")
      .select("option_id")
      .eq("poll_id", pollId)
      .eq("user_id", currentUser.id)
      .maybeSingle()
    userVote = vote?.option_id
  }

  // Calculate total votes
  const totalVotes = (options || []).reduce((sum, opt) => sum + (opt.vote_count || 0), 0)

  return {
    poll,
    options: (options || []).map((opt) => ({
      ...opt,
      percentage: totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0,
    })),
    userVote,
    totalVotes,
    error: null,
  }
}

export async function getActivePolls(communityId: string) {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .eq("community_id", communityId)
    .neq("status", "ended")
    .gt("ends_at", now)
    .order("created_at", { ascending: false })

  if (error || !polls) {
    return { polls: [], error: error?.message }
  }

  // Fetch options for each poll
  const pollsWithOptions = await Promise.all(
    polls.map(async (poll) => {
      const { data: options } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", poll.id)
        .order("order_index", { ascending: true })

      const totalVotes = (options || []).reduce((sum, opt) => sum + (opt.vote_count || 0), 0)

      return {
        ...poll,
        total_votes: totalVotes,
        options: (options || []).map((opt) => ({
          id: opt.id,
          text: opt.option_text,
          vote_count: opt.vote_count || 0,
        })),
      }
    })
  )

  return { polls: pollsWithOptions, error: null }
}

export async function getAllActivePolls() {
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data: polls, error } = await supabase
    .from("polls")
    .select("*")
    .neq("status", "ended")
    .gt("ends_at", now)
    .order("created_at", { ascending: false })

  if (error || !polls) {
    return { polls: [], error: error?.message }
  }

  // Fetch options for each poll
  const pollsWithOptions = await Promise.all(
    polls.map(async (poll) => {
      const { data: options } = await supabase
        .from("poll_options")
        .select("*")
        .eq("poll_id", poll.id)
        .order("order_index", { ascending: true })

      const totalVotes = (options || []).reduce((sum, opt) => sum + (opt.vote_count || 0), 0)

      return {
        ...poll,
        total_votes: totalVotes,
        options: (options || []).map((opt) => ({
          id: opt.id,
          text: opt.option_text,
          vote_count: opt.vote_count || 0,
        })),
      }
    })
  )

  return { polls: pollsWithOptions, error: null }
}

export async function endPoll(pollId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { success: false, error: "Not authenticated" }
  }

  // Check if poll creator or admin
  const { data: poll } = await supabase
    .from("polls")
    .select("created_by")
    .eq("id", pollId)
    .maybeSingle()

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", currentUser.id)
    .maybeSingle()

  const isAdmin = roleData?.role === "owner" || roleData?.role === "moderator"
  const isCreator = poll?.created_by === currentUser.id

  if (!isAdmin && !isCreator) {
    return { success: false, error: "You cannot end this poll" }
  }

  const { error } = await supabase
    .from("polls")
    .update({ status: "ended" })
    .eq("id", pollId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, error: null }
}
