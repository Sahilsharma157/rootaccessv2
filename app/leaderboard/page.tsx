import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth-utils"
import { LeaderboardClient } from "@/components/leaderboard-client"

export const metadata = {
  title: "Leaderboard | RootAccess",
  description: "Top contributors and community leaders",
}

export default async function LeaderboardPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <LeaderboardClient user={{ id: user.id, username: user.username || 'User', email: user.email }} />
  )
}
