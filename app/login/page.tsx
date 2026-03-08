"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Terminal, AlertCircle, Loader2, ShieldAlert } from "lucide-react"
import { signIn } from "@/lib/actions/auth"
import { ThemeToggle } from "@/components/theme-toggle"
import { Footer } from "@/components/footer"

export default function LoginPage() {
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [shake, setShake] = useState(false)
  const [staySignedIn, setStaySignedIn] = useState(false)

  // Remove logout overlay when login page mounts
  useEffect(() => {
    // Small delay to ensure smooth transition
    const timeout = setTimeout(() => {
      const overlay = document.getElementById("auth-loading-overlay")
      if (overlay) overlay.remove()
    }, 100)
    return () => clearTimeout(timeout)
  }, [])

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
      formData.set("staySignedIn", staySignedIn ? "true" : "false")
      const result = await signIn(formData)

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

  // Full-screen loading overlay - shown immediately when login button clicked
  if (loading) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Logging you in...</p>
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

      {/* Login Form */}
      <div className="flex-1 flex items-center justify-center px-4 py-6 sm:px-5 sm:py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back</h1>
            <p className="text-muted-foreground">Log in to continue to your communities</p>
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
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  className="bg-background"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                    Forgot?
                  </Link>
                </div>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-background"
                  required
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none group w-fit">
                <span
                  role="checkbox"
                  aria-checked={staySignedIn}
                  onClick={() => setStaySignedIn(!staySignedIn)}
                  className={`inline-flex items-center justify-center w-[16px] h-[16px] rounded-[3px] border transition-all ${
                    staySignedIn
                      ? "bg-primary border-primary"
                      : "border-muted-foreground/40 group-hover:border-muted-foreground/70"
                  }`}
                >
                  {staySignedIn && (
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary-foreground" />
                    </svg>
                  )}
                </span>
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  Stay signed in
                </span>
              </label>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Log in"
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-muted-foreground">
              {"Don't have an account? "}
              <Link href="/signup" className="text-primary hover:underline font-medium">
                Sign up
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
