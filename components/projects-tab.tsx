'use client'

import { useState, useCallback } from 'react'
import { searchGitHubProjects, getInternalProjects, createProject, applyToProject } from '@/lib/actions/projects'
import { searchUsersBySkill } from '@/lib/actions/skills'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Github, Plus, ExternalLink, Star, GitFork, AlertCircle, Loader2, Users, MapPin, Zap } from 'lucide-react'
import Link from 'next/link'

interface ProjectsTabProps {
  currentUserId: string
}

type TabType = 'github' | 'opportunities' | 'matcher'

export function ProjectsTab({ currentUserId }: ProjectsTabProps) {
  const [activeTab, setActiveTab] = useState<TabType>('github')
  const [gitHubProjects, setGitHubProjects] = useState<any[]>([])
  const [internalProjects, setInternalProjects] = useState<any[]>([])
  const [matchedUsers, setMatchedUsers] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newProjectTitle, setNewProjectTitle] = useState('')
  const [newProjectDesc, setNewProjectDesc] = useState('')
  const [newProjectSkills, setNewProjectSkills] = useState('')

  // Search GitHub projects
  const handleGitHubSearch = useCallback(async (query: string) => {
    if (!query.trim()) return
    setLoading(true)
    const { projects } = await searchGitHubProjects(query)
    setGitHubProjects(projects)
    setLoading(false)
  }, [])

  // Search users by skill
  const handleSkillSearch = useCallback(async (query: string) => {
    if (!query.trim()) return
    setLoading(true)
    const { users, error } = await searchUsersBySkill(query)
    setMatchedUsers(users)
    if (error) {
      console.log('[v0] Search result:', error)
    }
    setLoading(false)
  }, [])

  // Load internal projects
  const loadInternalProjects = useCallback(async () => {
    setLoading(true)
    const { projects } = await getInternalProjects()
    setInternalProjects(projects)
    setLoading(false)
  }, [])

  // Create new project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newProjectTitle.trim() || !newProjectDesc.trim()) return

    setLoading(true)
    const skills = newProjectSkills.split(',').map((s) => s.trim()).filter(Boolean)
    const { success } = await createProject(newProjectTitle, newProjectDesc, skills, 5)

    if (success) {
      setNewProjectTitle('')
      setNewProjectDesc('')
      setNewProjectSkills('')
      setIsCreateDialogOpen(false)
      await loadInternalProjects()
    }
    setLoading(false)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Tabs - Horizontally scrollable on mobile */}
      <div className="overflow-x-auto border-b border-border bg-card/50">
        <div className="flex gap-2 p-3 min-w-min">
          <button
            onClick={() => setActiveTab('github')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'github'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground bg-secondary/40 hover:bg-secondary/60'
            }`}
          >
            <Github className="w-4 h-4 mr-2 inline" />
            GitHub
          </button>
          <button
            onClick={() => {
              setActiveTab('opportunities')
              loadInternalProjects()
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'opportunities'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground bg-secondary/40 hover:bg-secondary/60'
            }`}
          >
            Opportunities
          </button>
          <button
            onClick={() => setActiveTab('matcher')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'matcher'
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-foreground bg-secondary/40 hover:bg-secondary/60'
            }`}
          >
            <Users className="w-4 h-4 mr-2 inline" />
            Skill Finder
          </button>
        </div>
      </div>

      {/* GitHub Projects Tab */}
      {activeTab === 'github' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Search GitHub projects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGitHubSearch(searchQuery)}
                className="text-sm text-foreground"
              />
              <Button size="sm" onClick={() => handleGitHubSearch(searchQuery)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {gitHubProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Github className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Search for GitHub projects above</p>
              </div>
            ) : (
              gitHubProjects.map((project) => (
                <a
                  key={project.id}
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block p-3 rounded-lg border border-border hover:bg-primary/10 hover:border-primary/50 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={project.avatar}
                      alt={project.owner}
                      className="w-6 h-6 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Star className="w-3 h-3" /> {project.stars}
                        </span>
                        <span className="flex items-center gap-0.5">
                          <GitFork className="w-3 h-3" /> {project.forks}
                        </span>
                        {project.language && <span>{project.language}</span>}
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 opacity-0 hover:opacity-100 transition-opacity shrink-0 text-foreground" />
                  </div>
                </a>
              ))
            )}
          </div>
        </div>
      )}

      {/* Opportunities Tab */}
      {activeTab === 'opportunities' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border flex justify-between items-center">
            <p className="text-xs text-muted-foreground">Post & browse team opportunities</p>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1">
                  <Plus className="w-4 h-4" /> Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Post New Opportunity</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateProject} className="space-y-4">
                  <input
                    type="text"
                    placeholder="Project title"
                    value={newProjectTitle}
                    onChange={(e) => setNewProjectTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <textarea
                    placeholder="What do you need help with?"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground min-h-24 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <input
                    type="text"
                    placeholder="Required skills (comma-separated)"
                    value={newProjectSkills}
                    onChange={(e) => setNewProjectSkills(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                      Post Opportunity
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {internalProjects.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No opportunities yet</p>
              </div>
            ) : (
              internalProjects.map((project) => (
                <div key={project.id} className="p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200">
                  <p className="font-medium text-sm text-foreground">{project.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{project.description}</p>
                  {project.required_skills && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {project.required_skills.slice(0, 3).map((skill: string) => (
                        <span key={skill} className="px-2 py-0.5 bg-primary/20 text-primary text-xs rounded">
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                  <Button size="sm" variant="outline" className="mt-2 w-full text-xs">
                    Apply to Join
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Skill Finder Tab */}
      {activeTab === 'matcher' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="p-3 border-b border-border">
            <div className="flex gap-2">
              <Input
                placeholder="Search for a skill (e.g., React, Python, Design)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSkillSearch(searchQuery)}
                className="text-sm text-foreground"
              />
              <Button size="sm" onClick={() => handleSkillSearch(searchQuery)} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find'}
              </Button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {matchedUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Search for developers by skill</p>
                <p className="text-xs mt-1">Find users who have the skills you need</p>
              </div>
            ) : (
              matchedUsers.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.username}`}
                  className="block p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-primary/5 transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                      {user.display_name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-foreground">{user.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                      {user.bio && <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{user.bio}</p>}
                      
                      {/* Skills */}
                      <div className="flex flex-wrap gap-1 mt-2">
                        {user.skills.slice(0, 4).map((skill: string) => (
                          <span
                            key={skill}
                            className="px-2 py-0.5 bg-primary/15 text-primary text-xs rounded-full font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                        {user.skills.length > 4 && (
                          <span className="px-2 py-0.5 text-xs text-muted-foreground">
                            +{user.skills.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Location/Contact */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        {user.location && (
                          <span className="flex items-center gap-0.5">
                            <MapPin className="w-3 h-3" /> {user.location}
                          </span>
                        )}
                        {user.github && (
                          <a
                            href={`https://github.com/${user.github}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            GitHub
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
