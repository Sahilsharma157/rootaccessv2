"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { AppSidebar } from "@/components/app-sidebar"
import type { SidebarCommunity } from "@/components/app-sidebar"
import { PostsPanel } from "@/components/posts-panel"
import { CommunitiesList } from "@/components/communities-list"
import { MobileHeader } from "@/components/mobile-header"
import { getCommunities } from "@/lib/actions/channels"
import { getUserRole } from "@/lib/actions/admin"

interface HomeClientProps {
  user: {
    id: string
    username: string
    email: string
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

const roleFetcher = async () => {
  const { role } = await getUserRole()
  return role
}

export function HomeClient({ user }: HomeClientProps) {
  const router = useRouter()

  const { data: allCommunities = [] } = useSWR("communities", communitiesFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 10000,
  })
  const { data: userRole = "member" } = useSWR("user-role", roleFetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 30000,
  })
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null)
  const [selectedCommunityName, setSelectedCommunityName] = useState<string | null>(null)
  const [selectedChannelName, setSelectedChannelName] = useState<string | null>(null)
  const [activeCommunity, setActiveCommunity] = useState<SidebarCommunity | null>(null)
  const [expandedChannels, setExpandedChannels] = useState<string[]>([])

  const handleSelectChannel = (
    communityId: string,
    channelId: string,
    communityName: string,
    channelName: string,
  ) => {
    const community = allCommunities.find((c) => c.id === communityId)
    if (community) {
      setActiveCommunity(community)
    }

    setSelectedChannel(channelId)
    setSelectedCommunityName(communityName)
    setSelectedChannelName(channelName)
    setExpandedChannels((prev) => (prev.includes(channelName) ? prev : [...prev, channelName]))
  }

  const handleNavigateHome = () => {
    setSelectedChannel(null)
    setSelectedCommunityName(null)
    setSelectedChannelName(null)
    setActiveCommunity(null)
    setExpandedChannels([])
  }

  const handleBack = () => {
    setSelectedChannel(null)
    setSelectedCommunityName(null)
    setSelectedChannelName(null)
  }

  return (
    <div className="flex h-dvh bg-background">
      <AppSidebar
        user={user}
        activeCommunity={activeCommunity}
        selectedChannel={selectedChannel}
        onSelectChannel={handleSelectChannel}
        onNavigateHome={handleNavigateHome}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {!selectedChannel && <MobileHeader />}
        {selectedChannel ? (
          <PostsPanel
            communityName={selectedCommunityName}
            channelName={selectedChannelName}
            channelId={selectedChannel}
            onBack={handleBack}
            currentUserId={user.id}
          />
        ) : (
          <CommunitiesList onSelectCommunity={handleSelectChannel} userRole={userRole} />
        )}
      </div>
    </div>
  )
}
