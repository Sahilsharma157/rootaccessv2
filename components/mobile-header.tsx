"use client"

import { Menu, Terminal } from "lucide-react"
import { useSidebar } from "@/components/sidebar-provider"

interface MobileHeaderProps {
  title?: string
  children?: React.ReactNode
}

export function MobileHeader({ title, children }: MobileHeaderProps) {
  const { toggle } = useSidebar()

  return (
    <div className="flex md:hidden items-center h-12 px-3 border-b border-border bg-card shrink-0">
      <button
        onClick={toggle}
        className="p-2 -ml-1 rounded-md hover:bg-accent/50 text-foreground transition-colors"
        aria-label="Toggle sidebar"
      >
        <Menu className="w-5 h-5" />
      </button>
      {title ? (
        <h1 className="ml-2 text-sm font-semibold truncate">{title}</h1>
      ) : (
        <div className="ml-2 flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold font-mono">RootAccess</span>
        </div>
      )}
      {children && <div className="ml-auto flex items-center">{children}</div>}
    </div>
  )
}
