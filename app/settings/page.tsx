"use client"

import { useState, useEffect } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Bell, Lock, Palette, Crown, Check, Zap, Shield, Star, Sparkles } from "lucide-react"
import { MobileHeader } from "@/components/mobile-header"
import { getUserData } from "@/lib/actions/auth"

export default function SettingsPage() {
  const [user, setUser] = useState<any>(null)
  const [notifications, setNotifications] = useState(true)
  const [emailUpdates, setEmailUpdates] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    getUserData().then(setUser)
    const theme = localStorage.getItem("theme")
    setDarkMode(theme === "dark")
  }, [])

  const handleThemeToggle = (checked: boolean) => {
    setDarkMode(checked)
    const newTheme = checked ? "dark" : "light"
    localStorage.setItem("theme", newTheme)
    document.documentElement.classList.toggle("dark", checked)
  }

  return (
      <div className="flex h-dvh bg-background">
        <AppSidebar user={user} />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <MobileHeader title="Settings" />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="mx-auto max-w-4xl space-y-5 sm:space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <h1 className="hidden md:block text-3xl font-bold">Settings</h1>
                <p className="hidden md:block text-muted-foreground mt-1">Manage your account settings and preferences</p>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1.5 shrink-0 sm:h-10 sm:px-4 sm:text-sm bg-gradient-to-r from-primary to-primary/80">
                    <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    Go Premium
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                      <Crown className="h-6 w-6 text-primary" />
                      RootAccess Premium
                    </DialogTitle>
                    <DialogDescription>
                      Unlock exclusive features and take your developer journey to the next level
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 py-4">
                    {/* Pricing */}
                    <div className="flex items-end justify-center gap-2">
                      <span className="text-5xl font-bold">$9.99</span>
                      <span className="text-muted-foreground mb-2">/month</span>
                    </div>

                    {/* Features Grid */}
                    <div className="grid gap-3">
                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <Check className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-semibold">Priority Support</p>
                          <p className="text-sm text-muted-foreground">Get help within 24 hours from our team</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <Zap className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-semibold">Early Access Features</p>
                          <p className="text-sm text-muted-foreground">Try new features before anyone else</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <Crown className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-semibold">Premium Badge</p>
                          <p className="text-sm text-muted-foreground">Stand out with an exclusive profile badge</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <Shield className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-semibold">Enhanced Privacy</p>
                          <p className="text-sm text-muted-foreground">Advanced privacy controls and settings</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <Star className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-semibold">Unlimited Projects Showcase</p>
                          <p className="text-sm text-muted-foreground">Display unlimited projects on your profile</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 rounded-lg border p-3">
                        <Sparkles className="h-5 w-5 text-primary mt-0.5" />
                        <div>
                          <p className="font-semibold">Custom Profile Themes</p>
                          <p className="text-sm text-muted-foreground">Personalize your profile with custom colors</p>
                        </div>
                      </div>
                    </div>

                    <Button className="w-full" size="lg">
                      Upgrade to Premium
                    </Button>

                    <p className="text-center text-xs text-muted-foreground">Cancel anytime. No questions asked.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Account Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Account
                </CardTitle>
                <CardDescription>Manage your account security and preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email</Label>
                    <p className="text-sm text-muted-foreground">{user?.email || "Loading..."}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Password</Label>
                    <p className="text-sm text-muted-foreground">••••••••</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Change
                  </Button>
                </div>
                <div className="flex items-center justify-between border-t pt-4">
                  <div className="space-y-0.5">
                    <Label className="text-destructive">Delete Account</Label>
                    <p className="text-sm text-muted-foreground">Permanently delete your account and data</p>
                  </div>
                  <Button variant="destructive" size="sm">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notifications
                </CardTitle>
                <CardDescription>Configure how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications on this device</p>
                  </div>
                  <Switch id="notifications" checked={notifications} onCheckedChange={setNotifications} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-updates">Email Updates</Label>
                    <p className="text-sm text-muted-foreground">Get weekly updates about new features</p>
                  </div>
                  <Switch id="email-updates" checked={emailUpdates} onCheckedChange={setEmailUpdates} />
                </div>
              </CardContent>
            </Card>

            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Appearance
                </CardTitle>
                <CardDescription>Customize your RootAccess experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="dark-mode">Dark Mode</Label>
                    <p className="text-sm text-muted-foreground">Enable dark theme</p>
                  </div>
                  <Switch id="dark-mode" checked={darkMode} onCheckedChange={handleThemeToggle} />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Custom Theme</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        Premium
                      </Badge>
                      <p className="text-sm text-muted-foreground">Unlock with premium</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" disabled>
                    Customize
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        </div>
      </div>
    
  )
}
