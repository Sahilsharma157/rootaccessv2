"use client"

import { useState } from "react"
import useSWR from "swr"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Search, Hash, Users, Loader2, Plus, X } from "lucide-react"
import { getCommunities, createCommunity } from "@/lib/actions/channels"

interface Channel {
  id: string
  name: string
}

interface CommunityItem {
  id: string
  name: string
  description: string | null
  memberCount: number
  channels: Channel[]
}

interface CommunitiesListProps {
  onSelectCommunity: (communityId: string, channelId: string, communityName: string, channelName: string) => void
  userRole?: string
}

const communitiesListFetcher = async () => {
  const { communities } = await getCommunities()
  return communities as CommunityItem[]
}

export function CommunitiesList({ onSelectCommunity, userRole }: CommunitiesListProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const { data: communities = [], isLoading, mutate } = useSWR("communities-list", communitiesListFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  })
  const loading = isLoading && communities.length === 0

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

  const filtered = communities.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description || "").toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0">
        <p className="font-semibold">Communities</p>
        {canCreate && (
          <button
            onClick={() => setCreateOpen(true)}
            className="w-8 h-8 rounded-full bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
            aria-label="Create community"
          >
            <Plus className="w-4 h-4 text-primary" />
          </button>
        )}
      </div>

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

      {/* Search */}
      <div className="px-3 py-3 md:p-4 border-b border-border shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search groups..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 md:p-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No communities found</p>
          </div>
        ) : (
          filtered.map((community) => (
            <button
              key={community.id}
              onClick={() => {
                const firstChannel = community.channels[0]
                if (firstChannel) {
                  onSelectCommunity(
                    community.id,
                    firstChannel.id,
                    community.name,
                    firstChannel.name,
                  )
                }
              }}
              className="w-full text-left bg-card border border-border rounded-lg p-3 md:p-4 hover:border-primary/30 active:bg-accent/50 transition-colors"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Hash className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{community.name}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    <span>{community.memberCount} members</span>
                  </div>
                </div>
              </div>
              {community.description && (
                <p className="text-sm text-muted-foreground">{community.description}</p>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {community.channels.map((ch) => (
                  <span key={ch.id} className="text-xs bg-muted px-2 py-0.5 rounded-md text-muted-foreground">
                    #{ch.name}
                  </span>
                ))}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
