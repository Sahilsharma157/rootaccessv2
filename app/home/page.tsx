import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import { HomeClient } from "@/components/home-client"

export default async function HomePage() {
  const user = await getCurrentUser()
  if (!user) redirect("/login")
  return <HomeClient user={user} />
}
