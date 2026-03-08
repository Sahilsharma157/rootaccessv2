"use client"

import { useLayoutEffect } from "react"

export function ThemeInitializer() {
  useLayoutEffect(() => {
    try {
      const theme = localStorage.getItem("theme")
      if (theme === "light") {
        document.documentElement.classList.remove("dark")
      } else {
        // Default to dark mode if no preference is set
        document.documentElement.classList.add("dark")
      }
    } catch {}
  }, [])

  return null
}
