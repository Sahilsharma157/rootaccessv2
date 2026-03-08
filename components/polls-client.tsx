'use client'

import { AppSidebar } from '@/components/app-sidebar'
import { MobileHeader } from '@/components/mobile-header'
import { ThemeToggle } from '@/components/theme-toggle'
import { PollsPanel } from '@/components/polls-panel'
import { SidebarProvider, useSidebar } from '@/components/sidebar-provider'

interface PollsClientProps {
  user: {
    id: string
    username: string
  }
  communityId: string | null
}

function PollsContent({ user, communityId }: PollsClientProps) {
  const { state } = useSidebar()

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mobile Header */}
      <MobileHeader title="Polls">
        <ThemeToggle />
      </MobileHeader>

      {/* Desktop Header */}
      <div className="hidden md:flex p-6 border-b border-border/50 items-center justify-between bg-background">
        <div>
          <h2 className="font-semibold text-2xl">Community Polls</h2>
          <p className="text-sm text-muted-foreground mt-1">Vote on community questions</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <PollsPanel currentUserId={user.id} communityId={communityId} />
      </div>
    </div>
  )
}

export function PollsClient({ user, communityId }: PollsClientProps) {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <PollsContent user={user} communityId={communityId} />
      </div>
    </SidebarProvider>
  )
}
