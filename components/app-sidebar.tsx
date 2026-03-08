"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  Terminal,
  Home,
  MessageSquare,
  LogOut,
  Settings,
  User,
  Search,
  ChevronDown,
  Hash,
  Shield,
  Trophy,
  Vote,
  Folder,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "./theme-toggle"
import { getUnreadCount } from "@/lib/actions/messages"
import { useSidebar } from "@/components/sidebar-provider"
import { getUserRole } from "@/lib/actions/admin"

export interface SidebarChannel {
  id: string
  name: string
  unread?: number
}

export interface SidebarCommunity {
  id: string
  name: string
  channels: SidebarChannel[]
}

interface AppSidebarProps {
  user: {
    id: string
    username: string
    email: string
    avatar_url?: string
  } | null
  activeCommunity?: SidebarCommunity | null
  selectedChannel?: string | null
  onSelectChannel?: (communityId: string, channelId: string, communityName: string, channelName: string) => void
  onNavigateHome?: () => void
}

export function AppSidebar({
  user,
  activeCommunity,
  selectedChannel,
  onSelectChannel,
  onNavigateHome,
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { isOpen, close } = useSidebar()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [userRole, setUserRole] = useState<string>("member")
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchUnread() {
      const { count } = await getUnreadCount()
      setUnreadCount(count)
    }
    fetchUnread()
    const interval = setInterval(fetchUnread, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    async function fetchRole() {
      try {
        const { role } = await getUserRole()
        setUserRole(role)
      } catch {}
    }
    fetchRole()
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleLogout = () => {
    // Inject persistent overlay with hard-coded dark colors (CSS vars don't work in inline styles)
    const isDark = document.documentElement.classList.contains("dark")
    const bgColor = isDark ? "#09090b" : "#ffffff"
    const textColor = isDark ? "#a1a1aa" : "#71717a"
    const spinnerBorder = isDark ? "#27272a" : "#e4e4e7"
    const spinnerAccent = "#22c55e"
    
    const overlay = document.createElement("div")
    overlay.id = "auth-loading-overlay"
    overlay.style.cssText = `
      position: fixed; inset: 0; z-index: 9999;
      background: ${bgColor};
      display: flex; align-items: center; justify-content: center;
      flex-direction: column; gap: 16px;
    `
    overlay.innerHTML = `
      <div style="width: 32px; height: 32px; border: 3px solid ${spinnerBorder}; border-top-color: ${spinnerAccent}; border-radius: 50%; animation: spin 1s linear infinite;"></div>
      <p style="color: ${textColor};">Logging out...</p>
      <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
    `
    document.body.appendChild(overlay)
    document.cookie = "user_id=; path=/; max-age=0"
    window.location.href = "/login"
  }

  const handleNavClick = () => {
    // Close sidebar on mobile after nav
    close()
  }

  const navItems = [
    { href: "/home", icon: Home, label: "Home", badge: 0 },
    { href: "/messages", icon: MessageSquare, label: "Messages", badge: unreadCount },
    { href: "/search", icon: Search, label: "Search", badge: 0 },
    { href: "/projects", icon: Folder, label: "Projects", badge: 0 },
    { href: "/leaderboard", icon: Trophy, label: "Leaderboard", badge: 0 },
    { href: "/polls", icon: Vote, label: "Polls", badge: 0 },
    ...(userRole === "owner" || userRole === "moderator"
      ? [{ href: "/admin", icon: Shield, label: "Admin", badge: 0 }]
      : []),
  ]

  const sidebarContent = (
    <aside className="w-56 md:w-40 border-r border-border bg-card flex flex-col h-full shrink-0">
      {/* Logo */}
      <div className="h-12 border-b border-border flex items-center px-3 justify-between shrink-0">
        <Link href="/home" onClick={handleNavClick} className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold font-mono">RootAccess</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Navigation */}
      <nav className="px-2 pt-2 pb-1 space-y-0.5 shrink-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href === "/home" && pathname === "/home" && !activeCommunity)
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href} onClick={handleNavClick}>
              <button
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.badge > 0 && (
                  <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </button>
            </Link>
          )
        })}
      </nav>

      {/* Active Community Channels */}
      {activeCommunity && onSelectChannel && (
        <div className="flex-1 overflow-y-auto px-2 pt-1.5 border-t border-border mt-1">
          <button
            onClick={() => { onNavigateHome?.(); handleNavClick() }}
            className="w-full flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-semibold text-foreground hover:bg-accent/50 transition-colors"
          >
            <ChevronDown className="w-3 h-3 text-primary" />
            <span className="flex-1 text-left truncate">{activeCommunity.name}</span>
          </button>

          <div className="ml-2.5 border-l border-border/40 pl-1.5 space-y-px mt-0.5">
            {activeCommunity.channels.map((channel) => {
              const isSelected = selectedChannel === channel.id
              return (
                <button
                  key={channel.id}
                  onClick={() => {
                    onSelectChannel(activeCommunity.id, channel.id, activeCommunity.name, channel.name)
                    handleNavClick()
                  }}
                  className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/30"
                  }`}
                >
                  <Hash className="w-3 h-3 shrink-0" />
                  <span className="flex-1 text-left truncate">{channel.name}</span>
                  {channel.unread && channel.unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1 py-px rounded-full min-w-[14px] text-center">
                      {channel.unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Spacer when no community */}
      {!activeCommunity && <div className="flex-1" />}

      {/* User Section */}
      <div className="border-t border-border p-2 shrink-0 relative" ref={menuRef}>
        {showUserMenu && (
          <div className="absolute bottom-full left-2 right-2 mb-1.5 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
            <button
              onClick={() => { router.push("/profile"); setShowUserMenu(false); close() }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-accent/50 transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => { router.push("/settings"); setShowUserMenu(false); close() }}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-accent/50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <div className="border-t border-border" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-2.5 px-2 py-2 rounded-md hover:bg-accent/50 transition-colors"
        >
          <Avatar className="h-7 w-7 shrink-0">
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
              {user?.username?.substring(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-xs font-medium truncate">{user?.username}</p>
            <p className="text-[10px] text-muted-foreground truncate">@{user?.username}</p>
          </div>
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop: static sidebar */}
      <div className="hidden md:flex h-full shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: overlay sidebar */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={close}
          />
          {/* Slide-in panel */}
          <div className="absolute inset-y-0 left-0 w-56 shadow-xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}
