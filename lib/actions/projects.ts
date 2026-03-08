'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { getCurrentUserFromCookie } from '@/lib/auth-utils'

// Fetch projects from GitHub API
export async function searchGitHubProjects(query: string, language?: string, sort: 'stars' | 'forks' | 'updated' = 'stars') {
  try {
    const params = new URLSearchParams({
      q: `${query}${language ? ` language:${language}` : ''}`,
      sort,
      order: 'desc',
      per_page: '12',
    })

    const response = await fetch(`https://api.github.com/search/repositories?${params}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        ...(process.env.GITHUB_TOKEN && { 'Authorization': `token ${process.env.GITHUB_TOKEN}` }),
      },
    })

    if (!response.ok) {
      return { projects: [], error: 'Failed to fetch from GitHub' }
    }

    const data = await response.json()

    const projects = (data.items || []).map((repo: any) => ({
      id: `github-${repo.id}`,
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      language: repo.language,
      topics: repo.topics || [],
      owner: repo.owner.login,
      avatar: repo.owner.avatar_url,
      updated_at: repo.updated_at,
      source: 'github',
    }))

    return { projects, error: null }
  } catch (error) {
    return { projects: [], error: (error as Error).message }
  }
}

// Get internal opportunities/projects
export async function getInternalProjects() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      applicants:project_applicants(count)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('[v0] Error fetching projects:', error)
    return { projects: [], error: error.message }
  }

  // Fetch user data separately for each project
  const projectsWithUsers = await Promise.all(
    (data || []).map(async (project) => {
      const { data: userData } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .eq('id', project.created_by)
        .single()

      return {
        ...project,
        created_by: userData || { id: project.created_by, username: 'Unknown', avatar_url: null }
      }
    })
  )

  return { projects: projectsWithUsers, error: null }
}

// Create a project/opportunity
export async function createProject(title: string, description: string, requiredSkills: string[], maxTeamSize: number) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({
      title,
      description,
      created_by: currentUser.id,
      required_skills: requiredSkills,
      max_team_size: maxTeamSize,
      status: 'open',
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Award XP for creating project
  await supabase.rpc('award_xp', { user_id: currentUser.id, activity: 'create_project', points: 25 })

  return { success: true, project: data, error: null }
}

// Apply to a project
export async function applyToProject(projectId: string, message: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { success: false, error: 'Not authenticated' }
  }

  // Check if already applied
  const { data: existing } = await supabase
    .from('project_applicants')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', currentUser.id)
    .maybeSingle()

  if (existing) {
    return { success: false, error: 'You already applied to this project' }
  }

  const { data, error } = await supabase
    .from('project_applicants')
    .insert({
      project_id: projectId,
      user_id: currentUser.id,
      message,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // Award XP for applying
  await supabase.rpc('award_xp', { user_id: currentUser.id, activity: 'apply_project', points: 10 })

  return { success: true, application: data, error: null }
}

// Get project applicants (for project owner)
export async function getProjectApplicants(projectId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { applicants: [], error: 'Not authenticated' }
  }

  // Verify user is project owner
  const { data: project } = await supabase
    .from('projects')
    .select('created_by')
    .eq('id', projectId)
    .maybeSingle()

  if (!project || project.created_by !== currentUser.id) {
    return { applicants: [], error: 'Not authorized' }
  }

  const { data, error } = await supabase
    .from('project_applicants')
    .select(`
      *,
      user:users(id, username, avatar_url, bio)
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })

  if (error) {
    return { applicants: [], error: error.message }
  }

  return { applicants: data || [], error: null }
}

// Accept project applicant
export async function acceptProjectApplicant(applicationId: string) {
  const supabase = createAdminClient()
  const currentUser = await getCurrentUserFromCookie()

  if (!currentUser) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get application details
  const { data: application } = await supabase
    .from('project_applicants')
    .select(`
      *,
      project:projects(created_by)
    `)
    .eq('id', applicationId)
    .maybeSingle()

  if (!application || application.project.created_by !== currentUser.id) {
    return { success: false, error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('project_applicants')
    .update({ status: 'accepted' })
    .eq('id', applicationId)

  if (error) {
    return { success: false, error: error.message }
  }

  // Award XP to applicant for being accepted
  await supabase.rpc('award_xp', { user_id: application.user_id, activity: 'project_accepted', points: 50 })

  return { success: true, error: null }
}
