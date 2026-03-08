"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Twitter, Send, Instagram, Linkedin, Github, Upload } from "lucide-react"
import { updateProfile, getProfile } from "@/lib/actions/profile"
import { MobileHeader } from "@/components/mobile-header"
import { getUserData } from "@/lib/actions/auth"
import { useToast } from "@/hooks/use-toast"

export default function EditProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{ id: string; username: string; email: string } | null>(null)
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [bio, setBio] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [xHandle, setXHandle] = useState("")
  const [telegram, setTelegram] = useState("")
  const [instagram, setInstagram] = useState("")
  const [linkedin, setLinkedin] = useState("")
  const [github, setGithub] = useState("")

  useEffect(() => {
    async function loadProfile() {
      const userData = await getUserData()
      if (!userData) {
        router.push("/login")
        return
      }
      setUser(userData)
      setUsername(userData.username)
      setEmail(userData.email)

      const profile = await getProfile()
      if (profile) {
        setFullName(profile.full_name || "")
        setBio(profile.bio || "")
        setAvatarUrl(profile.avatar_url || "")
        setXHandle(profile.x_handle || "")
        setTelegram(profile.telegram || "")
        setInstagram(profile.instagram || "")
        setLinkedin(profile.linkedin || "")
        setGithub(profile.github || "")
      }
      setLoading(false)
    }
    loadProfile()
  }, [router])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 500 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 500KB",
        variant: "destructive",
      })
      return
    }

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarUrl(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await updateProfile({
      display_name: fullName,
      bio,
      twitter: xHandle,
      linkedin,
      github,
    })

    setSaving(false)

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Profile updated successfully",
      })
      router.push("/profile")
    }
  }

  if (loading || !user) {
    return (
      <div className="flex h-dvh bg-background items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const initials = (fullName || username || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="flex h-dvh bg-background">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <MobileHeader title="Edit Profile" />
        <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 md:px-8 py-4 md:py-8">
          <div className="hidden md:block mb-8">
            <h1 className="text-3xl font-bold mb-2">Edit Profile</h1>
            <p className="text-muted-foreground">Update your information and social media links</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-4 sm:mb-6">
            <Label className="mb-3 sm:mb-4 block text-sm">Profile Picture</Label>
            <div className="flex items-center gap-3 sm:gap-4">
              <Avatar className="w-16 h-16 sm:w-20 sm:h-20 shrink-0">
                <AvatarImage src={avatarUrl || "/placeholder.svg"} />
                <AvatarFallback className="text-lg sm:text-xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <label htmlFor="avatar-upload">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2 cursor-pointer bg-transparent"
                    asChild
                  >
                    <span>
                      <Upload className="w-4 h-4" />
                      Upload Photo
                    </span>
                  </Button>
                </label>
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG or GIF. Max size 500KB</p>
                <p className="text-sm text-muted-foreground mt-1">Username: @{username}</p>
                <p className="text-sm text-muted-foreground">Email: {email}</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Tell others about yourself..."
              />
            </div>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 mb-4 sm:mb-6 space-y-4">
            <h3 className="font-semibold text-base sm:text-lg mb-2 sm:mb-4">Social Media</h3>

            <div className="space-y-2">
              <Label htmlFor="x_handle" className="flex items-center gap-2">
                <Twitter className="w-4 h-4" />X (Twitter)
              </Label>
              <Input
                id="x_handle"
                value={xHandle}
                onChange={(e) => setXHandle(e.target.value)}
                placeholder="@username or full URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Telegram
              </Label>
              <Input
                id="telegram"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
                placeholder="@username or t.me/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="instagram" className="flex items-center gap-2">
                <Instagram className="w-4 h-4" />
                Instagram
              </Label>
              <Input
                id="instagram"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="@username or full URL"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="linkedin" className="flex items-center gap-2">
                <Linkedin className="w-4 h-4" />
                LinkedIn
              </Label>
              <Input
                id="linkedin"
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="linkedin.com/in/username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="github" className="flex items-center gap-2">
                <Github className="w-4 h-4" />
                GitHub
              </Label>
              <Input
                id="github"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="github.com/username"
              />
            </div>
          </div>

          <div className="flex gap-3 safe-bottom pb-4">
            <Button onClick={handleSave} className="flex-1 sm:flex-none" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => router.push("/profile")} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
        </div>
      </div>
    </div>
  )
}
