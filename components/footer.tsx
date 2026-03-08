import { Terminal } from "lucide-react"

export function Footer() {
  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          <span className="font-semibold">RootAccess</span>
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">© 2026 RootAccess. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
