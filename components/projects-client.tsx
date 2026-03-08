"use client"

import { useState } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import type { SidebarCommunity } from "@/components/app-sidebar"
import { ProjectsTab } from "@/components/projects-tab"
import { MobileHeader } from "@/components/mobile-header"
import { ThemeToggle } from "@/components/theme-toggle"
import useSWR from "swr"
import { getCommunities } from "@/lib/actions/channels"

interface ProjectsClientProps {
  user: {
    id: string
    username: string
    email?: string
    avatar_url?: string
  }
}

const communitiesFetcher = async () => {
  const { communities } = await getCommunities()
  return communities.map((c: any) => ({
    id: c.id,
    name: c.name,
    channels: c.channels.map((ch: any) => ({ id: ch.id, name: ch.name })),
  })) as SidebarCommunity[]
}

export function ProjectsClient({ user }: ProjectsClientProps) {
  const { data: allCommunities = [] } = useSWR("communities", communitiesFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  })

  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [activeCommunity, setActiveCommunity] = useState<SidebarCommunity | null>(null)

  const handleSelectChannel = (
    communityId: string,
    channelId: string,
  ) => {
    const community = allCommunities.find((c) => c.id === communityId)
    if (community) {
      setActiveCommunity(community)
    }
    setSelectedChannel(channelId)
  }

  const handleNavigateHome = () => {
    setSelectedChannel(null)
    setActiveCommunity(null)
  }

  return (
    <div className="flex h-screen w-full">
      {/* Sidebar */}
      <AppSidebar
        user={user}
        activeCommunity={activeCommunity}
        selectedChannel={selectedChannel}
        onSelectChannel={handleSelectChannel}
        onNavigateHome={handleNavigateHome}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <MobileHeader title="Projects">
          <ThemeToggle />
        </MobileHeader>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <ProjectsTab currentUserId={user.id} />
        </div>
      </div>
    </div>
  )
}
