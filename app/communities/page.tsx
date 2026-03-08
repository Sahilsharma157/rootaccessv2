"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Users, Hash, Loader2, Check, Plus, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MobileHeader } from "@/components/mobile-header"
import { getUserData } from "@/lib/actions/auth"
import { getBrowseCommunities, joinCommunity, leaveCommunity, createCommunity } from "@/lib/actions/channels"
import { getUserRole } from "@/lib/actions/admin"

interface Community {
  id: string
  name: string
  description: string | null
  memberCount: number
  channels: { id: string; name: string }[]
}

const browseCommunitiesFetcher = async () => {
  const [userData, browseData, roleData] = await Promise.all([getUserData(), getBrowseCommunities(), getUserRole()])
  return { user: userData, communities: browseData.communities as Community[], joinedIds: browseData.joinedIds as string[], role: roleData.role }
}

export default function CommunitiesPage() {
  const router = useRouter()
  const { data, mutate, isLoading } = useSWR("browse-communities", browseCommunitiesFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const user = data?.user || null
  const communities = data?.communities || []
  const joinedIds = data?.joinedIds || []
  const userRole = data?.role || "member"
  const loading = isLoading && !data

  // Create community dialog state
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [newChannel, setNewChannel] = useState("")
  const [channelsList, setChannelsList] = useState<string[]>([])
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")

  const canCreate = userRole === "owner" || userRole === "moderator"

  const handleAddChannel = () => {
    const ch = newChannel.trim().toLowerCase().replace(/\s+/g, "-")
    if (ch && !channelsList.includes(ch)) {
      setChannelsList([...channelsList, ch])
      setNewChannel("")
    }
  }

  const handleRemoveChannel = (ch: string) => {
    setChannelsList(channelsList.filter((c) => c !== ch))
  }

  const handleCreate = async () => {
    if (!newName.trim()) return
    setCreating(true)
    setCreateError("")
    const { error } = await createCommunity(newName, newDesc, channelsList)
    if (error) {
      setCreateError(error)
      setCreating(false)
      return
    }
    setCreateOpen(false)
    setNewName("")
    setNewDesc("")
    setChannelsList([])
    setCreating(false)
    mutate()
  }

  if (data && !data.user) { router.push("/login") }

  const handleJoin = async (communityId: string) => {
    setJoiningId(communityId)
    const { error } = await joinCommunity(communityId)
    if (!error) {
      // Optimistic update
      mutate({
        ...data!,
        joinedIds: [...joinedIds, communityId],
        communities: communities.map((c) => c.id === communityId ? { ...c, memberCount: c.memberCount + 1 } : c),
      }, false)
    }
    setJoiningId(null)
  }

  const handleLeave = async (communityId: string) => {
    setJoiningId(communityId)
    const { error } = await leaveCommunity(communityId)
    if (!error) {
      mutate({
        ...data!,
        joinedIds: joinedIds.filter((id) => id !== communityId),
        communities: communities.map((c) => c.id === communityId ? { ...c, memberCount: Math.max(0, c.memberCount - 1) } : c),
      }, false)
    }
    setJoiningId(null)
  }

  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  if (loading || !user) {
    return (
      <div className="flex h-dvh bg-background items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-dvh bg-background">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <MobileHeader title="Communities" />
        <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 md:px-8 py-4 md:py-8">
          <div className="hidden md:flex md:items-start md:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Browse Communities</h1>
              <p className="text-muted-foreground">Find groups that match your interests and join the conversation</p>
            </div>
            {canCreate && (
              <Button onClick={() => setCreateOpen(true)} size="sm" className="gap-1.5 shrink-0">
                <Plus className="w-4 h-4" />
                Create
              </Button>
            )}
          </div>

          {/* Mobile create button (floating) */}
          {canCreate && (
            <button
              onClick={() => setCreateOpen(true)}
              className="md:hidden fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90 active:scale-95 transition-all"
              aria-label="Create community"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}

          {/* Create Community Dialog */}
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Create Community</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {createError && (
                  <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-2.5">{createError}</p>
                )}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    placeholder="e.g. Web Development"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Description</label>
                  <Input
                    placeholder="What's this community about?"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Channels</label>
                  <p className="text-xs text-muted-foreground">{"#general is always included. Add more below."}</p>
                  <div className="flex gap-2">
                    <Input
                      placeholder="channel-name"
                      value={newChannel}
                      onChange={(e) => setNewChannel(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddChannel() } }}
                      className="flex-1"
                    />
                    <Button type="button" variant="outline" size="sm" className="shrink-0 h-9 px-3" onClick={handleAddChannel} disabled={!newChannel.trim()}>
                      Add
                    </Button>
                  </div>
                  {channelsList.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {channelsList.map((ch) => (
                        <span key={ch} className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-md">
                          #{ch}
                          <button onClick={() => handleRemoveChannel(ch)} className="hover:text-destructive transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <Button className="w-full" onClick={handleCreate} disabled={creating || !newName.trim()}>
                  {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : "Create Community"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <div className="mb-4 md:mb-8">
            <div className="relative max-w-lg">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search communities..."
                className="pl-9 h-10 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No communities found</p>
              <p className="text-sm mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="grid gap-3 md:gap-4">
              {filtered.map((community) => {
                const isJoined = joinedIds.includes(community.id)
                const isLoading = joiningId === community.id

                return (
                  <div
                    key={community.id}
                    className="bg-card border border-border rounded-lg p-3.5 sm:p-5 md:p-6 hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <h3 className="font-semibold text-sm sm:text-base leading-tight">{community.name}</h3>
                          <div className="shrink-0">
                            {isLoading ? (
                              <Button variant="outline" size="sm" className="h-7 text-xs px-2.5" disabled>
                                <Loader2 className="w-3 h-3 animate-spin" />
                              </Button>
                            ) : isJoined ? (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs px-2.5 gap-1 text-primary border-primary/30 hover:text-destructive hover:border-destructive/30 group"
                                onClick={() => handleLeave(community.id)}
                              >
                                <Check className="w-3 h-3 group-hover:hidden" />
                                <span className="group-hover:hidden">Joined</span>
                                <span className="hidden group-hover:inline">Leave</span>
                              </Button>
                            ) : (
                              <Button size="sm" className="h-7 text-xs px-3" onClick={() => handleJoin(community.id)}>
                                Join
                              </Button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                          <Users className="w-3 h-3" />
                          <span>{community.memberCount} {community.memberCount === 1 ? "member" : "members"}</span>
                        </div>
                        {community.description && (
                          <p className="text-xs sm:text-sm text-muted-foreground mb-2.5 line-clamp-2">{community.description}</p>
                        )}
                        <div className="flex flex-wrap gap-1.5">
                          {community.channels.map((ch) => (
                            <span key={ch.id} className="px-2 py-0.5 rounded-md bg-secondary text-[11px] sm:text-xs font-medium">
                              #{ch.name}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  )
}
