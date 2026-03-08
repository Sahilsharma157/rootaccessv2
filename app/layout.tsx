import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import NextTopLoader from "nextjs-toploader"
import { SidebarProvider } from "@/components/sidebar-provider"
import { ThemeInitializer } from "@/components/theme-initializer"
import { SessionXPTracker } from "@/components/session-xp-tracker"
import { MessageNotificationListener } from "@/components/message-notification-listener"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover" as const,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1e1e1e" },
  ],
}

export const metadata: Metadata = {
  title: "RootAccess - Connect with Developer Students",
  description: "Join interest-based dev communities, find collaborators, and build together.",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/icon-dark-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`font-sans antialiased`}>
        <ThemeInitializer />
        <SessionXPTracker />
        <MessageNotificationListener />
        <NextTopLoader
          color="rgb(134 239 172)"
          initialPosition={0.08}
          crawlSpeed={200}
          height={3}
          crawl={true}
          showSpinner={false}
          easing="ease"
          speed={200}
          shadow="0 0 10px rgb(134 239 172),0 0 5px rgb(134 239 172)"
        />
        <SidebarProvider>
          {children}
        </SidebarProvider>
        <Analytics />
      </body>
    </html>
  )
}
