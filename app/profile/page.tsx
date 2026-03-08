import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Settings, MapPin, Calendar, LinkIcon, Twitter, Send, Instagram, Linkedin, Github, Shield, Zap } from "lucide-react"
import { MobileHeader } from "@/components/mobile-header"
import { XPStats } from "@/components/xp-stats"
import Link from "next/link"
import { getProfile } from "@/lib/actions/profile"
import { getCurrentUser } from "@/lib/actions/auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"

export default async function ProfilePage() {
  const user = await getCurrentUser()
  const profile = await getProfile()

  if (!profile || !user) {
    redirect("/login")
  }

  const supabase = createAdminClient()
  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()
  const myRole = roleData?.role || "member"

  const joinedDate = profile.created_at
    ? new Date(profile.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently"

  const initials = (profile.full_name || profile.username || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-dvh bg-background">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <MobileHeader title="Profile" />
        <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 md:px-8 py-4 md:py-8">
          <div className="hidden md:flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Your Profile</h1>
            <Link href="/profile/edit">
              <Button variant="outline" className="gap-2 bg-transparent">
                <Settings className="w-4 h-4" />
                Edit Profile
              </Button>
            </Link>
          </div>

          {/* Mobile edit button */}
          <div className="flex md:hidden justify-end mb-3">
            <Link href="/profile/edit">
              <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs bg-transparent">
                <Settings className="w-3.5 h-3.5" />
                Edit Profile
              </Button>
            </Link>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 md:p-8 mb-4 md:mb-6">
            <div className="flex gap-4 sm:gap-6 mb-4 sm:mb-6">
              <Avatar className="w-16 h-16 sm:w-24 sm:h-24 shrink-0">
                <AvatarImage src={profile.avatar_url || "/placeholder.svg"} />
                <AvatarFallback className="text-lg sm:text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-lg sm:text-2xl font-bold truncate">{profile.full_name || profile.username}</h2>
                  {myRole === "owner" && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase bg-amber-500/20 text-amber-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Owner
                    </span>
                  )}
                  {myRole === "moderator" && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase bg-blue-500/20 text-blue-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Mod
                    </span>
                  )}
                  {myRole === "ninja" && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase bg-purple-500/20 text-purple-500 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Ninja
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2 sm:mb-4">@{profile.username}</p>
                {profile.bio && <p className="text-xs sm:text-sm leading-relaxed mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">{profile.bio}</p>}
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-1">
                      <LinkIcon className="w-4 h-4" />
                      <a
                        href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`}
                        className="text-primary hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {joinedDate}</span>
                  </div>
                </div>
              </div>
            </div>

            {(profile.x_handle || profile.telegram || profile.instagram || profile.linkedin || profile.github) && (
              <div className="pt-3 sm:pt-4 border-t border-border">
                <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Social Media</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {profile.x_handle && (
                    <a
                      href={`https://x.com/${profile.x_handle.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="text-sm">{profile.x_handle}</span>
                    </a>
                  )}
                  {profile.telegram && (
                    <a
                      href={`https://t.me/${profile.telegram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span className="text-sm">{profile.telegram}</span>
                    </a>
                  )}
                  {profile.instagram && (
                    <a
                      href={`https://instagram.com/${profile.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <Instagram className="w-4 h-4" />
                      <span className="text-sm">{profile.instagram}</span>
                    </a>
                  )}
                  {profile.linkedin && (
                    <a
                      href={
                        profile.linkedin.startsWith("http")
                          ? profile.linkedin
                          : `https://linkedin.com/in/${profile.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="text-sm">LinkedIn</span>
                    </a>
                  )}
                  {profile.github && (
                    <a
                      href={profile.github.startsWith("http") ? profile.github : `https://github.com/${profile.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <Github className="w-4 h-4" />
                      <span className="text-sm">GitHub</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-4 md:mb-6">
            <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-500" />
              Your Stats
            </h3>
            <XPStats userId={user.id} />
          </div>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-4 md:mb-6">
            <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Contact</h3>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
