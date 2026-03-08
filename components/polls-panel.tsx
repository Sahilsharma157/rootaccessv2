"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Progress } from "@/components/ui/progress"
import { Plus, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { createPoll, getAllActivePolls, votePoll } from "@/lib/actions/polls"

interface PollOption {
  id: string
  text: string
  vote_count: number
}

interface Poll {
  id: string
  title: string
  description: string
  options: PollOption[]
  status: "active" | "ended"
  ends_at: string
  total_votes: number
}

export function PollsPanel({ communityId, currentUserId }: { communityId: string | null; currentUserId: string }) {
  const [polls, setPolls] = useState<Poll[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [votedPolls, setVotedPolls] = useState<Set<string>>(new Set())
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [timeRemaining, setTimeRemaining] = useState<Record<string, string>>({})

  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState(["", ""])
  const [duration, setDuration] = useState("24")

  useEffect(() => {
    loadPolls()
    const interval = setInterval(updateTimers, 1000)
    return () => clearInterval(interval)
  }, [communityId])

  const updateTimers = () => {
    const newTimeRemaining: Record<string, string> = {}
    polls.forEach((poll) => {
      const now = new Date().getTime()
      const endTime = new Date(poll.ends_at).getTime()
      const diff = endTime - now

      if (diff <= 0) {
        newTimeRemaining[poll.id] = "Poll ended"
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        newTimeRemaining[poll.id] = `${hours}h ${minutes}m ${seconds}s`
      }
    })
    setTimeRemaining(newTimeRemaining)
  }

  const loadPolls = async () => {
    setLoading(true)
    const { polls: loadedPolls } = await getAllActivePolls()
    setPolls(loadedPolls || [])
    setLoading(false)
    // Force timer update immediately after loading polls
    setTimeout(() => updateTimers(), 0)
  }

  const handleCreatePoll = async () => {
    setCreateError("")
    
    if (!title.trim()) {
      setCreateError("Poll must have a title")
      return
    }
    
    const validOptions = options.filter((o) => o.trim())
    if (validOptions.length < 2) {
      setCreateError("Poll must have at least 2 options")
      return
    }

    setCreating(true)
    try {
      const endsAt = new Date(Date.now() + parseInt(duration) * 60 * 60 * 1000).toISOString()
      const { success, poll, error } = await createPoll(
        communityId || null,
        title.trim(),
        description.trim(),
        validOptions,
        endsAt
      )

      if (error) {
        setCreateError(error)
        console.log("[v0] Poll creation error:", error)
      } else if (success && poll) {
        setPolls((prev) => [poll, ...prev])
        setTitle("")
        setDescription("")
        setOptions(["", ""])
        setDuration("24")
        setIsCreateDialogOpen(false)
        setCreateError("")
        toast.success("Poll created successfully!")
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unknown error occurred"
      setCreateError(errorMsg)
      console.log("[v0] Unexpected error:", err)
    } finally {
      setCreating(false)
    }
  }

  const handleVote = async (pollId: string, optionId: string) => {
    if (votedPolls.has(pollId)) {
      toast.error("You have already voted on this poll")
      return
    }

    // Optimistic update - update UI immediately
    setPolls((prevPolls) =>
      prevPolls.map((poll) => {
        if (poll.id === pollId) {
          return {
            ...poll,
            total_votes: poll.total_votes + 1,
            options: poll.options.map((opt) => ({
              ...opt,
              vote_count: opt.id === optionId ? opt.vote_count + 1 : opt.vote_count,
            })),
          }
        }
        return poll
      })
    )
    setVotedPolls((prev) => new Set([...prev, pollId]))

    // Silent backend update - no refetch
    const { success, error } = await votePoll(pollId, optionId)

    if (!success) {
      // Rollback on error
      setPolls((prevPolls) =>
        prevPolls.map((poll) => {
          if (poll.id === pollId) {
            return {
              ...poll,
              total_votes: poll.total_votes - 1,
              options: poll.options.map((opt) => ({
                ...opt,
                vote_count: opt.id === optionId ? opt.vote_count - 1 : opt.vote_count,
              })),
            }
          }
          return poll
        })
      )
      setVotedPolls((prev) => {
        const newSet = new Set(prev)
        newSet.delete(pollId)
        return newSet
      })
      toast.error(`Error voting: ${error}`)
    }
  }

  if (loading) {
    return <div className="p-4 text-center text-muted-foreground">Loading polls...</div>
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Community Polls</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Create Poll
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Anonymous Poll</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Poll Question</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What should we discuss?"
                  className="mt-1.5"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Description (optional)</label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add context..."
                  className="mt-1.5"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Options</label>
                <div className="space-y-1.5">
                  {options.map((option, idx) => (
                    <Input
                      key={idx}
                      value={option}
                      onChange={(e) => {
                        const newOptions = [...options]
                        newOptions[idx] = e.target.value
                        setOptions(newOptions)
                      }}
                      placeholder={`Option ${idx + 1}`}
                      className="text-sm h-8"
                    />
                  ))}
                  {options.length < 5 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOptions([...options, ""])}
                      className="w-full h-8 text-xs"
                    >
                      Add Option
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Duration (hours)</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full mt-1.5 px-2 py-1.5 text-sm border border-border rounded-md bg-card">
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="24">24 hours</option>
                  <option value="72">3 days</option>
                  <option value="168">1 week</option>
                </select>
              </div>

              {createError && (
                <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md text-xs text-destructive">
                  {createError}
                </div>
              )}

              <Button onClick={handleCreatePoll} disabled={creating} className="w-full h-9 text-sm">
                {creating ? "Creating..." : "Create Poll"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {polls.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No polls yet. Create one to get started!</p>
          </div>
        ) : (
          polls.map((poll) => {
            const hasVoted = votedPolls.has(poll.id)

            return (
              <div key={poll.id} className="border border-border rounded-lg p-4 space-y-4 bg-card">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{poll.title}</h3>
                    {poll.description && <p className="text-xs text-muted-foreground mt-1">{poll.description}</p>}
                  </div>
                  <div className="flex-shrink-0">
                    {timeRemaining[poll.id]?.includes("ended") ? (
                      <p className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive/10 text-destructive whitespace-nowrap">
                        Ended
                      </p>
                    ) : (
                      <p className="text-xs font-semibold px-2 py-1 rounded-full bg-primary/10 text-primary whitespace-nowrap">
                        {timeRemaining[poll.id] || "Calculating..."}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-auto sm:flex sm:flex-wrap">
                  {poll.options.map((option) => {
                    const percentage = poll.total_votes > 0 ? (option.vote_count / poll.total_votes) * 100 : 0
                    const isPollEnded = timeRemaining[poll.id]?.includes("ended")
                    // Find the winning option
                    const maxVotes = Math.max(...poll.options.map((opt) => opt.vote_count), 0)
                    const isLeading = maxVotes > 0 && option.vote_count === maxVotes

                    return (
                      <button
                        key={option.id}
                        onClick={() => !hasVoted && !isPollEnded && handleVote(poll.id, option.id)}
                        disabled={hasVoted || isPollEnded}
                        className={`relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-all text-center min-w-[120px] ${
                          isLeading
                            ? "border-2 border-green-500/50 bg-green-500/10 ring-2 ring-green-500/20"
                            : hasVoted || isPollEnded
                            ? "border border-border/50 bg-muted/20 cursor-not-allowed"
                            : "border-2 border-primary/40 bg-primary/8 hover:border-primary/60 hover:bg-primary/12 cursor-pointer active:scale-95"
                        }`}
                      >
                        <span className="text-xs font-medium truncate">{option.text}</span>
                        <div className="w-full max-w-[100px]">
                          <Progress value={percentage} className="h-1.5" />
                        </div>
                        <span className="text-xs text-muted-foreground font-semibold">{option.vote_count} vote{option.vote_count !== 1 ? "s" : ""}</span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>{poll.total_votes} total vote{poll.total_votes !== 1 ? "s" : ""}</span>
                  {hasVoted && <span className="text-green-600 font-semibold">✓ You voted</span>}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
