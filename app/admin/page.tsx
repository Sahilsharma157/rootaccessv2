"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { AppSidebar } from "@/components/app-sidebar"
import { MobileHeader } from "@/components/mobile-header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Shield,
  Users,
  AlertTriangle,
  Ban,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  ChevronRight,
  Swords,
} from "lucide-react"
import {
  getAdminPageData,
  banUser,
  unbanUser,
  muteUser,
  unmuteUser,
  setUserRole,
  resolveReport,
} from "@/lib/actions/admin"

type Tab = "users" | "reports" | "bans"

interface UserItem {
  id: string
  username: string
  email: string
  created_at: string
  role: string
  ban: { reason: string; created_at: string } | null
  mute: { muted_until: string; reason: string } | null
  isMuted: boolean
}

interface ReportItem {
  id: string
  reported_user_id: string
  reported_by: string
  reason: string
  status: string
  created_at: string
  reportedUser: { id: string; username: string; email: string } | null
  reportedBy: { id: string; username: string } | null
}

const fetcher = async () => {
  const res = await getAdminPageData()
  return res
}

export default function AdminPage() {
  const router = useRouter()
  const { data, mutate, isLoading } = useSWR("admin-page-data", fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 5000,
  })

  const [tab, setTab] = useState<Tab>("users")
  const [searchQuery, setSearchQuery] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Dialog states
  const [banDialog, setBanDialog] = useState<{ open: boolean; user: UserItem | null }>({ open: false, user: null })
  const [banReason, setBanReason] = useState("")
  const [muteDialog, setMuteDialog] = useState<{ open: boolean; user: UserItem | null }>({ open: false, user: null })
  const [muteReason, setMuteReason] = useState("")
  const [muteHours, setMuteHours] = useState("5")
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; user: UserItem | null }>({ open: false, user: null })

  const user = data?.user || null
  const role = data?.role || "member"
  const users: UserItem[] = data?.users || []
  const reports: ReportItem[] = data?.reports || []
  const loading = isLoading && !data

  // Redirect if not authorized
  if (data && !data.user) { router.push("/login") }
  if (data && data.error === "Unauthorized") { router.push("/home") }

  const handleBan = async () => {
    if (!banDialog.user || !banReason.trim()) return
    setActionLoading(banDialog.user.id)
    await banUser(banDialog.user.email, banReason.trim())
    setBanDialog({ open: false, user: null })
    setBanReason("")
    await mutate()
    setActionLoading(null)
  }

  const handleUnban = async (email: string, userId: string) => {
    setActionLoading(userId)
    await unbanUser(email)
    await mutate()
    setActionLoading(null)
  }

  const handleMute = async () => {
    if (!muteDialog.user) return
    setActionLoading(muteDialog.user.id)
    await muteUser(muteDialog.user.id, parseInt(muteHours), muteReason.trim())
    setMuteDialog({ open: false, user: null })
    setMuteReason("")
    await mutate()
    setActionLoading(null)
  }

  const handleUnmute = async (userId: string) => {
    setActionLoading(userId)
    await unmuteUser(userId)
    await mutate()
    setActionLoading(null)
  }

  const handleSetRole = async (newRole: string) => {
    if (!roleDialog.user) return
    setActionLoading(roleDialog.user.id)
    await setUserRole(roleDialog.user.id, newRole)
    setRoleDialog({ open: false, user: null })
    await mutate()
    setActionLoading(null)
  }

  const handleResolve = async (reportId: string, action: "dismissed" | "banned", reportedEmail?: string, reason?: string) => {
    setActionLoading(reportId)
    if (action === "banned" && reportedEmail) {
      await banUser(reportedEmail, reason || "Banned via report review")
    }
    await resolveReport(reportId, action)
    await mutate()
    setActionLoading(null)
  }

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const pendingReports = reports.filter((r) => r.status === "pending")
  const bannedUsers = users.filter((u) => u.ban !== null)

  if (loading || !user) {
    return (
      <div className="flex h-dvh bg-background items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-dvh bg-background">
      <AppSidebar user={user} />
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <MobileHeader title="Admin" />

        {/* Tabs */}
        <div className="border-b border-border shrink-0">
          <div className="flex px-3 sm:px-6 md:px-8">
            {[
              { key: "users" as Tab, label: "Users", icon: Users, count: users.length },
              { key: "reports" as Tab, label: "Reports", icon: AlertTriangle, count: pendingReports.length },
              { key: "bans" as Tab, label: "Banned", icon: Ban, count: bannedUsers.length },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {t.label}
                {t.count > 0 && (
                  <span className={`min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] font-bold px-1 ${
                    t.key === "reports" && t.count > 0 ? "bg-destructive text-destructive-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-3 sm:px-6 md:px-8 py-4 md:py-6">

            {/* Users Tab */}
            {tab === "users" && (
              <div>
                <div className="mb-4">
                  <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      className="pl-9 h-10 text-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="bg-card border border-border rounded-lg p-3 sm:p-4">
                      {/* Top row: avatar + name + badges */}
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {u.username.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-medium truncate">{u.username}</p>
                            {u.role !== "member" && (
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                u.role === "owner" ? "bg-amber-500/20 text-amber-500" :
                                u.role === "moderator" ? "bg-blue-500/20 text-blue-500" :
                                u.role === "ninja" ? "bg-purple-500/20 text-purple-500" :
                                "bg-muted text-muted-foreground"
                              }`}>
                                {u.role}
                              </span>
                            )}
                            {u.ban && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-destructive/20 text-destructive">
                                banned
                              </span>
                            )}
                            {u.isMuted && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-500/20 text-orange-500">
                                muted
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>

                      {/* Bottom row: action buttons */}
                      {u.role !== "owner" && (
                        <div className="flex items-center gap-2 pl-12">
                          {/* Mute/Unmute */}
                          {u.isMuted ? (
                            <button
                              className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-semibold bg-orange-500/15 text-orange-600 border border-orange-500/30 hover:bg-orange-500/25 transition-colors disabled:opacity-50"
                              onClick={() => handleUnmute(u.id)}
                              disabled={actionLoading === u.id}
                            >
                              <Clock className="w-3 h-3" />
                              Unmute
                            </button>
                          ) : (
                            <button
                              className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-semibold bg-orange-500/10 text-orange-500 border border-orange-500/25 hover:bg-orange-500/20 transition-colors disabled:opacity-50"
                              onClick={() => { setMuteDialog({ open: true, user: u }); setMuteReason(""); setMuteHours("5") }}
                              disabled={actionLoading === u.id}
                            >
                              <Clock className="w-3 h-3" />
                              Mute
                            </button>
                          )}

                          {/* Ban/Unban - owner only */}
                          {role === "owner" && (
                            <>
                              {u.ban ? (
                                <button
                                  className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-semibold bg-red-500/15 text-red-600 border border-red-500/30 hover:bg-red-500/25 transition-colors disabled:opacity-50"
                                  onClick={() => handleUnban(u.email, u.id)}
                                  disabled={actionLoading === u.id}
                                >
                                  <Ban className="w-3 h-3" />
                                  Unban
                                </button>
                              ) : (
                                <button
                                  className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-500 border border-red-500/25 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                  onClick={() => { setBanDialog({ open: true, user: u }); setBanReason("") }}
                                  disabled={actionLoading === u.id}
                                >
                                  <Ban className="w-3 h-3" />
                                  Ban
                                </button>
                              )}

                              {/* Role */}
                              <button
                                className="inline-flex items-center gap-1 h-7 px-3 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-500 border border-blue-500/25 hover:bg-blue-500/20 transition-colors disabled:opacity-50"
                                onClick={() => setRoleDialog({ open: true, user: u })}
                                disabled={actionLoading === u.id}
                              >
                                <Shield className="w-3 h-3" />
                                Role
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reports Tab */}
            {tab === "reports" && (
              <div>
                {pendingReports.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <CheckCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No pending reports</p>
                    <p className="text-sm mt-1">All reports have been reviewed</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingReports.map((report) => (
                      <div key={report.id} className="bg-card border border-border rounded-lg p-3 sm:p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mb-1">
                              <span className="text-sm font-medium">{report.reportedUser?.username || "Unknown"}</span>
                              <span className="text-[11px] text-muted-foreground">reported by</span>
                              <span className="text-sm font-medium">{report.reportedBy?.username || "Unknown"}</span>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3 bg-muted/50 rounded-md p-2">
                              {report.reason}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {new Date(report.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Owner actions */}
                        {role === "owner" && (
                          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                            <Button
                              size="sm"
                              variant="destructive"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleResolve(report.id, "banned", report.reportedUser?.email, report.reason)}
                              disabled={actionLoading === report.id}
                            >
                              <Ban className="w-3 h-3" />
                              Ban User
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs gap-1"
                              onClick={() => handleResolve(report.id, "dismissed")}
                              disabled={actionLoading === report.id}
                            >
                              <XCircle className="w-3 h-3" />
                              Dismiss
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Resolved reports */}
                {reports.filter((r) => r.status !== "pending").length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">Resolved Reports</h3>
                    <div className="space-y-2">
                      {reports.filter((r) => r.status !== "pending").map((report) => (
                        <div key={report.id} className="bg-card/50 border border-border/50 rounded-lg p-3 opacity-60">
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              report.status === "banned" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                            }`}>
                              {report.status}
                            </span>
                            <span className="font-medium">{report.reportedUser?.username}</span>
                            <span className="text-muted-foreground">-</span>
                            <span className="text-muted-foreground truncate">{report.reason}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Bans Tab */}
            {tab === "bans" && (
              <div>
                {bannedUsers.length === 0 ? (
                  <div className="text-center py-16 text-muted-foreground">
                    <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium">No banned users</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {bannedUsers.map((u) => (
                      <div key={u.id} className="bg-card border border-destructive/20 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 shrink-0">
                            <AvatarFallback className="text-xs bg-destructive/10 text-destructive">
                              {u.username.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{u.username}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                            {u.ban?.reason && (
                              <p className="text-xs text-destructive mt-1">Reason: {u.ban.reason}</p>
                            )}
                          </div>
                          {role === "owner" && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => handleUnban(u.email, u.id)}
                              disabled={actionLoading === u.id}
                            >
                              Unban
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ban Dialog */}
      <Dialog open={banDialog.open} onOpenChange={(open) => setBanDialog({ open, user: open ? banDialog.user : null })}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Ban {banDialog.user?.username}?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This will permanently ban <strong>{banDialog.user?.email}</strong> from the platform. They will not be able to log in or register with this email.
          </p>
          <Input
            placeholder="Reason for ban..."
            value={banReason}
            onChange={(e) => setBanReason(e.target.value)}
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setBanDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBan} disabled={!banReason.trim()}>
              Ban User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Mute Dialog */}
      <Dialog open={muteDialog.open} onOpenChange={(open) => setMuteDialog({ open, user: open ? muteDialog.user : null })}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Mute {muteDialog.user?.username}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            This user will not be able to send messages or post for the duration.
          </p>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Duration</label>
              <div className="flex gap-2">
                {["1", "5", "24", "168"].map((h) => (
                  <Button
                    key={h}
                    variant={muteHours === h ? "default" : "outline"}
                    size="sm"
                    className="text-xs"
                    onClick={() => setMuteHours(h)}
                  >
                    {h === "1" ? "1hr" : h === "5" ? "5hr" : h === "24" ? "24hr" : "7d"}
                  </Button>
                ))}
              </div>
            </div>
            <Input
              placeholder="Reason for mute..."
              value={muteReason}
              onChange={(e) => setMuteReason(e.target.value)}
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" size="sm" onClick={() => setMuteDialog({ open: false, user: null })}>
              Cancel
            </Button>
            <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white" onClick={handleMute} disabled={!muteReason.trim()}>
              Mute User
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Role Dialog */}
      <Dialog open={roleDialog.open} onOpenChange={(open) => setRoleDialog({ open, user: open ? roleDialog.user : null })}>
        <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Set Role for {roleDialog.user?.username}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            Current role: <strong className="capitalize">{roleDialog.user?.role}</strong>
          </p>
          <div className="space-y-2">
            {[
              { role: "moderator" as const, label: "Moderator", desc: "Can mute users, review reports", color: "text-blue-500" },
              { role: "ninja" as const, label: "Ninja", desc: "Open to work badge, discoverable techie", color: "text-purple-500" },
              { role: "member" as const, label: "Member", desc: "Regular user, no special permissions", color: "text-muted-foreground" },
            ].map((r) => (
              <button
                key={r.role}
                onClick={() => roleDialog.user && handleSetRole(r.role)}
                disabled={actionLoading === roleDialog.user?.id}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                  roleDialog.user?.role === r.role ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                <Shield className={`w-4 h-4 ${r.color}`} />
                <div className="text-left">
                  <p className="text-sm font-medium">{r.label}</p>
                  <p className="text-xs text-muted-foreground">{r.desc}</p>
                </div>
                {roleDialog.user?.role === r.role && (
                  <CheckCircle className="w-4 h-4 text-primary ml-auto" />
                )}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
