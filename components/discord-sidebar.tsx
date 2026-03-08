"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"

import {
  Terminal,
  Home,
  MessageSquare,
  LogOut,
  ChevronDown,
  Hash,
  Settings,
  User,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ThemeToggle } from "./theme-toggle"

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

interface DiscordSidebarProps {
  user: {
    id: string
    username: string
    email: string
  }
  selectedChannel: string | null
  activeCommunity: SidebarCommunity | null
  expandedChannels: string[]
  onSelectChannel: (communityId: string, channelId: string, communityName: string, channelName: string) => void
  onToggleChannel: (channelName: string) => void
  onNavigate: (page: "home" | "messages" | "search" | "profile" | "settings") => void
  activePage: string
}

export function DiscordSidebar({
  user,
  selectedChannel,
  activeCommunity,
  expandedChannels,
  onSelectChannel,
  onToggleChannel,
  onNavigate,
  activePage,
}: DiscordSidebarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

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
    // Inject persistent overlay with hard-coded dark colors
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

  return (
    <div className="w-64 border-r border-border bg-card flex flex-col h-screen shrink-0">
      {/* Logo */}
      <div className="h-14 border-b border-border flex items-center px-4 justify-between shrink-0">
        <Link href="/home" className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold font-mono">RootAccess</span>
        </Link>
        <ThemeToggle />
      </div>

      {/* Top Nav */}
      <div className="p-3 space-y-1 shrink-0">
        <button
          onClick={() => onNavigate("home")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activePage === "home"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <Home className="w-4 h-4" />
          Home
        </button>
        <button
          onClick={() => onNavigate("messages")}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            activePage === "messages"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-accent"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Messages
        </button>
      </div>

      {/* Active Community Tree - only shows when a community is selected */}
      {activeCommunity && (
        <div className="flex-1 overflow-y-auto px-3 pt-2 border-t border-border">
          {/* Community name */}
          <button
            onClick={() => onNavigate("home")}
            className="w-full flex items-center gap-1.5 px-2 py-2 rounded-md text-sm font-semibold hover:bg-accent transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5 text-primary" />
            <span className="flex-1 text-left truncate">{activeCommunity.name}</span>
          </button>

          {/* Channels as tree */}
          <div className="ml-3 border-l border-border/50 pl-2 space-y-0.5 mt-0.5">
            {activeCommunity.channels.map((channel) => {
              const isSelected = selectedChannel === channel.id

              return (
                <button
                  key={channel.id}
                  onClick={() =>
                    onSelectChannel(activeCommunity.id, channel.id, activeCommunity.name, channel.name)
                  }
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-sm transition-colors ${
                    isSelected
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  }`}
                >
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                  <span className="flex-1 text-left truncate">{channel.name}</span>
                  {channel.unread && channel.unread > 0 && (
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
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

      {/* Bottom User Section with Dropup */}
      <div className="border-t border-border p-3 shrink-0 relative" ref={menuRef}>
        {/* Dropup Menu */}
        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-2 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
            <button
              onClick={() => {
                onNavigate("profile")
                setShowUserMenu(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => {
                onNavigate("settings")
                setShowUserMenu(false)
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-accent transition-colors"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <div className="border-t border-border" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent transition-colors"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs bg-primary/10 text-primary">
              {user.username.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium truncate">{user.username}</p>
            <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
          </div>
        </button>
      </div>
    </div>
  )
}
