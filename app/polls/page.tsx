import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth-utils"
import { PollsClient } from "@/components/polls-client"
import { createAdminClient } from "@/lib/supabase/admin"

export const metadata = {
  title: "Polls | RootAccess",
  description: "Participate in community polls and surveys",
}

export default async function PollsPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  // Get user's first community
  const supabase = createAdminClient()
  const { data: membership } = await supabase
    .from("community_members")
    .select("community_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  const communityId = membership?.community_id || null

  return (
    <PollsClient 
      user={{ id: user.id, username: user.username || 'User' }}
      communityId={communityId}
    />
  )
}
