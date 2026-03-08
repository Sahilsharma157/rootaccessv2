"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, MessageCircle, MapPin, Wrench, Shield, Zap } from "lucide-react"
import { MobileHeader } from "@/components/mobile-header"
import { getUserData } from "@/lib/actions/auth"
import { searchUsers } from "@/lib/actions/search"
import Link from "next/link"

interface UserResult {
  id: string
  username: string
  email: string
  full_name: string | null
  bio: string | null
  location: string | null
  building: string | null
  avatar_url: string | null
  role?: string
}

export default function SearchPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; username: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<UserResult[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    async function loadUser() {
      const userData = await getUserData()
      if (!userData) {
        router.push("/login")
        return
      }
      setUser(userData)
      setLoading(false)
    }
    loadUser()
  }, [router])

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    const result = await searchUsers(query)
    if (result.success) {
      setSearchResults(result.users || [])
    }
    setSearching(false)
  }

  if (loading || !user) {
    return (
      <div className="flex h-dvh bg-background items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="flex h-dvh bg-background">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <MobileHeader title="Search" />
        <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 md:px-8 py-4 md:py-8">
          <div className="hidden md:block mb-8">
            <h1 className="text-3xl font-bold mb-2">Search Users</h1>
            <p className="text-muted-foreground">Find developers by name or username</p>
          </div>

          <div className="mb-4 md:mb-8">
            <div className="relative max-w-2xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or username..."
                className="pl-9 h-10 text-sm"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {searching && <p className="text-muted-foreground text-center">Searching...</p>}

            {!searching && searchQuery && searchResults.length === 0 && (
              <p className="text-muted-foreground text-center">No users found</p>
            )}

            {searchResults.map((result) => {
              const initials = (result.full_name || result.username)
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)

              return (
                <div
                  key={result.id}
                  className="bg-card border border-border rounded-lg p-3 sm:p-4 hover:border-primary/50 active:bg-accent/30 transition-colors"
                >
                  <div className="flex items-center gap-3 md:gap-4">
                      <Link href={`/user/${result.id}`} className="shrink-0">
                        <Avatar className="w-10 h-10 md:w-12 md:h-12">
                          <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                        </Avatar>
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <Link href={`/user/${result.id}`} className="min-w-0">
                            <span className="flex items-center gap-2">
                              <h3 className="font-semibold truncate hover:text-primary transition-colors">{result.full_name || result.username}</h3>
                              {result.role === "ninja" && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-purple-500/20 text-purple-500 flex items-center gap-0.5">
                                  <Zap className="w-2.5 h-2.5" /> Ninja
                                </span>
                              )}
                              {result.role === "moderator" && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/20 text-blue-500 flex items-center gap-0.5">
                                  <Shield className="w-2.5 h-2.5" /> Mod
                                </span>
                              )}
                              {result.role === "owner" && (
                                <span className="shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-500 flex items-center gap-0.5">
                                  <Shield className="w-2.5 h-2.5" /> Owner
                                </span>
                              )}
                            </span>
                          </Link>
                          <div className="hidden md:flex gap-2 shrink-0">
                            <Link href={`/user/${result.id}`}>
                              <Button variant="outline" size="sm">
                                View Profile
                              </Button>
                            </Link>
                            <Link href={`/messages?user=${result.id}`}>
                              <Button size="sm" className="gap-2">
                                <MessageCircle className="w-4 h-4" />
                                Message
                              </Button>
                            </Link>
                          </div>
                        </div>
                        <Link href={`/user/${result.id}`}>
                          <p className="text-sm text-muted-foreground truncate">@{result.username}</p>
                          {result.bio && <p className="text-sm text-muted-foreground mt-1 line-clamp-1">{result.bio}</p>}
                          <div className="flex items-center gap-3 mt-1">
                            {result.location && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="w-3 h-3" />
                                {result.location}
                              </span>
                            )}
                            {result.building && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Wrench className="w-3 h-3" />
                                {result.building}
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>
                    </div>
                </div>
              )
            })}
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
