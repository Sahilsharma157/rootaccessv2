"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Search, Plus } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getAllUsers } from "@/lib/actions/profile"
import { createGroup } from "@/lib/actions/groups"
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Group {
  id: string
  name: string
  memberCount: number
  unread?: number
}

interface DirectMessage {
  id: string
  name: string
  avatar: string
  initials: string
  lastMessage: string
  unread?: number
}

const MOCK_GROUPS: Group[] = [
  { id: "1", name: "React Developers", memberCount: 156, unread: 3 },
  { id: "2", name: "AI & ML Projects", memberCount: 89 },
  { id: "3", name: "Web3 Enthusiasts", memberCount: 47, unread: 1 },
  { id: "4", name: "Full-Stack Builders", memberCount: 203 },
]

const MOCK_DMS: DirectMessage[] = [
  {
    id: "1",
    name: "Sarah Chen",
    avatar: "",
    initials: "SC",
    lastMessage: "Thanks for the code review!",
    unread: 2,
  },
  { id: "2", name: "Mike Rodriguez", avatar: "", initials: "MR", lastMessage: "See you at the hackathon!" },
  { id: "3", name: "Emma Davis", avatar: "", initials: "ED", lastMessage: "Check out this article", unread: 1 },
]

export function GroupsPanel() {
  const [activeTab, setActiveTab] = useState<"groups" | "dms">("groups")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [groupName, setGroupName] = useState("")
  const [groupDescription, setGroupDescription] = useState("")
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function loadUsers() {
      const allUsers = await getAllUsers()
      setUsers(allUsers)
      setLoading(false)
    }
    loadUsers()
  }, [])

  const handleCreateGroup = async () => {
    if (!groupName.trim()) return

    setCreating(true)
    const result = await createGroup(groupName, groupDescription)
    setCreating(false)

    if (result.error) {
      alert(result.error)
    } else {
      setShowCreateDialog(false)
      setGroupName("")
      setGroupDescription("")
      // Optionally reload groups or show success message
    }
  }

  return (
    <div className="w-80 border-l border-border bg-card flex flex-col h-screen">
      {/* Header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-4">
        <h2 className="font-semibold">Community</h2>
        <Button size="icon" variant="ghost" onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-5 h-5" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex">
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex-1 px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === "groups" ? "text-primary" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Members
          {activeTab === "groups" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
        </button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search members..."
            className="pl-9"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">Loading members...</div>
        ) : (
          <div className="p-2">
            {users
              .filter((user) =>
                searchQuery
                  ? user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    user.profiles?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
                  : true,
              )
              .map((user) => {
                const initials = (user.profiles?.full_name || user.username || "U")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)

                return (
                  <Link
                    key={user.id}
                    href={`/app/user/${user.id}`}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-accent transition-colors text-left"
                  >
                    <Avatar className="flex-shrink-0">
                      <AvatarImage src={user.profiles?.avatar_url || "/placeholder.svg"} />
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{user.profiles?.full_name || user.username}</p>
                      <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
                    </div>
                  </Link>
                )
              })}
          </div>
        )}
      </div>

      {/* Browse Button */}
      <div className="border-t border-border p-4">
        <Button variant="outline" className="w-full gap-2 bg-transparent" asChild>
          <Link href="/app/communities">
            <Users className="w-4 h-4" />
            View all members
          </Link>
        </Button>
      </div>

      {/* Create Group Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a group to connect with other members who share your interests.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="group-name">Group Name</Label>
              <Input
                id="group-name"
                placeholder="e.g., React Developers"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="group-description">Description (Optional)</Label>
              <Textarea
                id="group-description"
                placeholder="What is this group about?"
                value={groupDescription}
                onChange={(e) => setGroupDescription(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreateGroup} disabled={!groupName.trim() || creating}>
              {creating ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
