'use server'

import { createAdminClient } from '@/lib/supabase/admin'

interface UserWithSkills {
  id: string
  username: string
  display_name: string
  bio: string
  avatar_url?: string
  skills: string[]
  location?: string
  github?: string
  linkedin?: string
  website?: string
}

export async function searchUsersBySkill(skillName: string): Promise<{
  users: UserWithSkills[]
  error?: string
}> {
  if (!skillName.trim()) {
    return { users: [], error: 'Please enter a skill to search' }
  }

  const supabase = createAdminClient()

  try {
    // First, find the skill by name
    const { data: skillData, error: skillError } = await supabase
      .from('skills')
      .select('id')
      .ilike('name', skillName.trim())
      .single()

    if (skillError || !skillData) {
      return { users: [], error: `No users found with skill "${skillName}"` }
    }

    // Get all users who have this skill
    const { data: userSkills, error: userSkillsError } = await supabase
      .from('user_skills')
      .select(`
        user_id,
        users!inner(
          id,
          username,
          email
        )
      `)
      .eq('skill_id', skillData.id)
      .limit(50)

    if (userSkillsError) {
      console.error('[v0] Error fetching user skills:', userSkillsError)
      return { users: [], error: 'Failed to search users' }
    }

    // Get detailed profiles for each user
    const userIds = userSkills?.map((us: any) => us.user_id) || []

    if (userIds.length === 0) {
      return { users: [], error: `No users found with skill "${skillName}"` }
    }

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds)

    if (profileError) {
      console.error('[v0] Error fetching profiles:', profileError)
      return { users: [], error: 'Failed to load user profiles' }
    }

    // Get all skills for these users
    const { data: allUserSkills, error: allSkillsError } = await supabase
      .from('user_skills')
      .select(`
        user_id,
        skills!inner(
          name
        )
      `)
      .in('user_id', userIds)

    if (allSkillsError) {
      console.error('[v0] Error fetching all skills:', allSkillsError)
    }

    // Group skills by user
    const skillsByUser: { [key: string]: string[] } = {}
    allUserSkills?.forEach((us: any) => {
      if (!skillsByUser[us.user_id]) {
        skillsByUser[us.user_id] = []
      }
      skillsByUser[us.user_id].push(us.skills.name)
    })

    // Combine profile data with skills
    const usersWithSkills: UserWithSkills[] = (profiles || []).map((profile: any) => ({
      id: profile.id,
      username: profile.username || 'User',
      display_name: profile.display_name || profile.username || 'User',
      bio: profile.bio || '',
      skills: skillsByUser[profile.id] || [],
      location: profile.location,
      github: profile.github,
      linkedin: profile.linkedin,
      website: profile.website,
    }))

    return { users: usersWithSkills }
  } catch (error: any) {
    console.error('[v0] Error searching users by skill:', error)
    return { users: [], error: 'An error occurred while searching' }
  }
}
