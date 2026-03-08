import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight, Terminal, Users, MessageSquare, Zap } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Footer } from "@/components/footer"

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-background overflow-y-auto">
      {/* Navigation */}
      <nav className="border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            <div className="flex items-center gap-2 shrink-0">
              <Terminal className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span className="text-lg sm:text-xl font-semibold">RootAccess</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <ThemeToggle />
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Log in
                </Button>
              </Link>
              <Link href="/signup" className="hidden sm:block">
                <Button size="sm" className="gap-2">
                  Sign up
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(116,235,160,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(116,235,160,0.03),transparent_50%)]" />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-6 lg:px-8 pt-14 pb-16 sm:pt-32 sm:pb-32">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight text-balance mb-4 sm:mb-6">
              Find your dev crew.
              <br />
              <span className="text-primary">Build together.</span>
            </h1>
            <p className="text-base sm:text-xl text-muted-foreground leading-relaxed mb-8 sm:mb-10 text-pretty px-2 sm:px-0">
              Connect with developer students who share your interests. Join communities, chat in real-time, and find
              collaborators for your next project.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-0">
              <Link href="/signup" className="w-full sm:w-auto">
                <Button size="lg" className="text-base sm:text-lg px-8 gap-2 w-full sm:w-auto">
                  Get started
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="text-base sm:text-lg px-8 w-full sm:w-auto bg-transparent">
                  Log in
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-14 sm:py-24">
        <div className="max-w-7xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4 text-balance">Everything you need to connect</h2>
            <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              Simple, focused tools for building your developer network.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            {/* Feature 1 */}
            <div className="bg-card border border-border rounded-lg p-5 sm:p-8 hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Interest-based groups</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Join communities around React, AI, Web3, or create your own. Find people working on what you care about.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border border-border rounded-lg p-5 sm:p-8 hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Real-time chat</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Group conversations and direct messages. No clutter, just fast, simple communication with your
                community.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border border-border rounded-lg p-5 sm:p-8 hover:border-primary/50 transition-colors">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 sm:mb-6">
                <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3">Simple profiles</h3>
              <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                Share your skills, interests, and what you're building. Let people find you based on what matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-14 sm:py-24 bg-card/30">
        <div className="max-w-5xl mx-auto px-5 sm:px-6 lg:px-8">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="text-2xl sm:text-4xl font-bold mb-3 sm:mb-4">Get started in minutes</h2>
          </div>

          <div className="space-y-8 sm:space-y-12">
            <div className="flex items-start gap-4 sm:gap-6">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">Sign up and tell us what you{"'"}re into</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Pick your interests - frontend, backend, AI, mobile, whatever you{"'"}re working on.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 sm:gap-6">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">Browse and join communities</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Explore groups based on your interests. Join the ones that match what you want to learn or build.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4 sm:gap-6">
              <div className="shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-semibold mb-1 sm:mb-2">Start chatting and collaborating</h3>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                  Jump into group chats, send DMs, find project partners. It{"'"}s that simple.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-14 sm:py-24">
        <div className="max-w-4xl mx-auto px-5 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-5xl font-bold mb-4 sm:mb-6 text-balance">Ready to find your people?</h2>
          <p className="text-base sm:text-xl text-muted-foreground mb-8 sm:mb-10 text-pretty">
            Join developer students building the future.
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-base sm:text-lg px-8 sm:px-10 gap-2">
              Get started for free
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
