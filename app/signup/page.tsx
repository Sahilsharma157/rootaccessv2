"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Terminal, AlertCircle, ShieldAlert, Loader2 } from "lucide-react"
import { signUp } from "@/lib/actions/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { Footer } from "@/components/footer"

export default function SignupPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (shake) {
      const t = setTimeout(() => setShake(false), 500)
      return () => clearTimeout(t)
    }
  }, [shake])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const formData = new FormData(e.currentTarget)
      const result = await signUp(formData)

      if (result?.error) {
        setError(result.error)
        setShake(true)
        setLoading(false)
        return
      }

      if (result?.success) {
        // Keep loading state true, redirect - the loading UI stays visible
        window.location.href = "/home"
        return
      } else {
        setError("Something went wrong. Please try again.")
        setLoading(false)
      }
    } catch {
      setError("Unable to connect. Please check your internet and try again.")
      setLoading(false)
    }
  }

  // Full-screen loading overlay - shown immediately when signup button clicked
  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Creating your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-background flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <Link href="/" className="flex items-center gap-2">
              <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span className="text-lg sm:text-xl font-semibold">RootAccess</span>
            </Link>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Signup Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:px-5 sm:py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Join RootAccess</h1>
            <p className="text-muted-foreground">Create your account and find your dev crew</p>
          </div>

          <div className={`bg-card border border-border rounded-lg p-5 sm:p-8 transition-transform ${shake ? "animate-[shake_0.5s_ease-in-out]" : ""}`}>
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-start gap-2.5">
                {error.includes("banned") ? (
                  <ShieldAlert className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                )}
                <p className="text-sm text-destructive leading-snug">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="alexjohnson"
                  className="bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@university.edu"
                  className="bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-background"
                  required
                  minLength={8}
                />
                <p className="text-xs text-muted-foreground">At least 8 characters</p>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  "Create account"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {"Already have an account? "}
              <Link href="/login" className="text-primary hover:underline font-medium">
                Log in
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  )
}
