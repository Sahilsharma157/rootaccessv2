"use client"

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react"

interface SidebarContextType {
  isOpen: boolean
  open: () => void
  close: () => void
  toggle: () => void
}

const SidebarContext = createContext<SidebarContextType>({
  isOpen: false,
  open: () => {},
  close: () => {},
  toggle: () => {},
})

export function useSidebar() {
  return useContext(SidebarContext)
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const touchStartTime = useRef(0)

  const open = useCallback(() => setIsOpen(true), [])
  const close = useCallback(() => setIsOpen(false), [])
  const toggle = useCallback(() => setIsOpen((prev) => !prev), [])

  // Swipe gesture handling
  useEffect(() => {
    const EDGE_THRESHOLD = 50 // px from left edge to start swipe
    const SWIPE_MIN_DISTANCE = 40 // lower = easier to trigger
    const SWIPE_MAX_Y = 100 // max vertical movement to count as horizontal swipe
    const SWIPE_MAX_TIME = 500 // ms

    function handleTouchStart(e: TouchEvent) {
      const touch = e.touches[0]
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
      touchStartTime.current = Date.now()
    }

    function handleTouchEnd(e: TouchEvent) {
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartX.current
      const deltaY = Math.abs(touch.clientY - touchStartY.current)
      const elapsed = Date.now() - touchStartTime.current

      if (deltaY > SWIPE_MAX_Y || elapsed > SWIPE_MAX_TIME) return

      // Swipe right from left edge -> open
      if (!isOpen && touchStartX.current < EDGE_THRESHOLD && deltaX > SWIPE_MIN_DISTANCE) {
        setIsOpen(true)
        return
      }

      // Swipe left -> close
      if (isOpen && deltaX < -SWIPE_MIN_DISTANCE) {
        setIsOpen(false)
        return
      }
    }

    document.addEventListener("touchstart", handleTouchStart, { passive: true })
    document.addEventListener("touchend", handleTouchEnd, { passive: true })
    return () => {
      document.removeEventListener("touchstart", handleTouchStart)
      document.removeEventListener("touchend", handleTouchEnd)
    }
  }, [isOpen])

  return (
    <SidebarContext.Provider value={{ isOpen, open, close, toggle }}>
      {children}
    </SidebarContext.Provider>
  )
}
