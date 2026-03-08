import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { MapPin, Calendar, LinkIcon, Twitter, Github, Linkedin, MessageCircle, ArrowLeft, Shield, Swords, Zap } from "lucide-react"
import { MobileHeader } from "@/components/mobile-header"
import { ReportButton } from "@/components/report-button"
import Link from "next/link"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect("/login")
  }

  const supabase = createAdminClient()

  const { data: user } = await supabase
    .from("users")
    .select("id, username, email, created_at")
    .eq("id", userId)
    .maybeSingle()

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  const { data: roleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle()

  const userRole = roleData?.role || "member"

  // Also get current user's role for showing report button
  const { data: currentRoleData } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", currentUser.id)
    .maybeSingle()

  const currentUserRole = currentRoleData?.role || "member"

  if (!user) {
    return (
      <div className="flex h-dvh bg-background">
        <AppSidebar user={currentUser} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <MobileHeader title="Profile" />
          <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">User not found</p>
          <Link href="/search">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Button>
          </Link>
          </div>
        </div>
      </div>
    )
  }

  const isOwnProfile = currentUser.id === userId

  const joinedDate = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Recently"

  const displayName = profile?.display_name || user.username || "User"
  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-dvh bg-background">
      <AppSidebar user={currentUser} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <MobileHeader title="Profile" />
        <div className="flex-1">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 md:px-8 py-4 md:py-8">
          {/* Header - back button only */}
          <div className="flex items-center mb-3 md:mb-6">
            <Link href="/search">
              <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10">
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
              </Button>
            </Link>
            <h1 className="hidden md:block text-3xl font-bold ml-2">Profile</h1>
          </div>

          {/* Profile Card */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 md:p-8 mb-4 md:mb-6">
            <div className="flex gap-4 sm:gap-6 mb-4 sm:mb-6">
              <Avatar className="w-16 h-16 sm:w-24 sm:h-24 shrink-0">
                <AvatarFallback className="text-lg sm:text-2xl bg-primary/10 text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-lg sm:text-2xl font-bold truncate">{displayName}</h2>
                  {userRole === "owner" && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase bg-amber-500/20 text-amber-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Owner
                    </span>
                  )}
                  {userRole === "moderator" && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase bg-blue-500/20 text-blue-500 flex items-center gap-1">
                      <Shield className="w-3 h-3" /> Mod
                    </span>
                  )}
                  {userRole === "ninja" && (
                    <span className="shrink-0 px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-bold uppercase bg-purple-500/20 text-purple-500 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Ninja
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2 sm:mb-3">@{user.username}</p>
                {profile?.bio && <p className="text-xs sm:text-sm leading-relaxed mb-2 sm:mb-4 line-clamp-3 sm:line-clamp-none">{profile.bio}</p>}
                {profile?.building && (
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2 sm:mb-4">
                    <span className="font-medium text-foreground">Building:</span> {profile.building}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                  {profile?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile?.website && (
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

            {/* Action buttons */}
            {!isOwnProfile && (
              <div className="flex flex-wrap gap-2 pb-2">
                <Link href={`/messages?user=${userId}`}>
                  <Button className="gap-2">
                    <MessageCircle className="w-4 h-4" />
                    Send Message
                  </Button>
                </Link>
                <ReportButton reportedUserId={userId} reportedUsername={user.username} />
              </div>
            )}
            {isOwnProfile && (
              <div className="pb-2">
                <Link href="/profile/edit">
                  <Button variant="outline" className="w-full sm:w-auto">Edit Profile</Button>
                </Link>
              </div>
            )}

            {/* Social Links */}
            {(profile?.twitter || profile?.linkedin || profile?.github) && (
              <div className="pt-3 sm:pt-4 border-t border-border">
                <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Social</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {profile.twitter && (
                    <a
                      href={`https://x.com/${profile.twitter.replace("@", "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-lg hover:border-primary transition-colors"
                    >
                      <Twitter className="w-4 h-4" />
                      <span className="text-sm">{profile.twitter}</span>
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
                      <span className="text-sm">{profile.github}</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="bg-card border border-border rounded-lg p-4 sm:p-6">
            <h3 className="font-semibold text-sm sm:text-base mb-2 sm:mb-3">Contact</h3>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
