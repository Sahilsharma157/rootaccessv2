import { redirect } from "next/navigation"
import { getUser } from "@/lib/auth-utils"
import { ProjectsClient } from "@/components/projects-client"

export const metadata = {
  title: "Projects | RootAccess",
  description: "Find projects, collaborate, and build with others",
}

export default async function ProjectsPage() {
  const user = await getUser()

  if (!user) {
    redirect("/login")
  }

  return (
    <ProjectsClient user={{ id: user.id, username: user.username || 'User', email: user.email }} />
  )
}
