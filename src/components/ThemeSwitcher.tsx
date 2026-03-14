"use client"

import { useState, useEffect, useRef } from "react"
import { Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { themes, DEFAULT_THEME } from "@/lib/themes"
import { fetchCurrentUser, updateCurrentUser } from "@/lib/api"

function applyTheme(themeId: string) {
  const theme = themes.find((t) => t.id === themeId)
  if (!theme) return

  const html = document.documentElement
  // Remove all theme classes
  themes.forEach((t) => html.classList.remove(t.id))
  // Remove dark class
  html.classList.remove("dark")
  // Add new theme class
  html.classList.add(themeId)
  // Add dark class if needed (for Tailwind dark: variant)
  if (theme.isDark) {
    html.classList.add("dark")
  }
}

export function ThemeSwitcher() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState(DEFAULT_THEME)
  const ref = useRef<HTMLDivElement>(null)

  // Load saved theme on mount, then reconcile with API
  useEffect(() => {
    const saved = localStorage.getItem("auto-note-theme") || DEFAULT_THEME
    setCurrent(saved)
    applyTheme(saved)

    fetchCurrentUser().then((user) => {
      if (user.color_theme && user.color_theme !== saved) {
        setCurrent(user.color_theme)
        applyTheme(user.color_theme)
        localStorage.setItem("auto-note-theme", user.color_theme)
      }
    }).catch(() => {})
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function selectTheme(themeId: string) {
    setCurrent(themeId)
    applyTheme(themeId)
    localStorage.setItem("auto-note-theme", themeId)
    setOpen(false)
    updateCurrentUser({ color_theme: themeId }).catch(() => {})
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => setOpen(!open)}
        aria-label="Change theme"
      >
        <Palette className="size-4" />
      </Button>

      {open && (
        <div className="absolute right-0 top-full mt-2 p-2 rounded-lg border border-border bg-popover shadow-lg z-50 min-w-[160px]">
          <div className="text-xs font-medium text-muted-foreground px-2 py-1">
            Light
          </div>
          {themes
            .filter((t) => !t.isDark)
            .map((theme) => (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors ${current === theme.id ? "bg-accent" : ""}`}
              >
                <span
                  className="size-3 rounded-full shrink-0 border border-border"
                  style={{ backgroundColor: theme.swatch }}
                />
                {theme.label}
              </button>
            ))}

          <div className="text-xs font-medium text-muted-foreground px-2 py-1 mt-1">
            Dark
          </div>
          {themes
            .filter((t) => t.isDark)
            .map((theme) => (
              <button
                key={theme.id}
                onClick={() => selectTheme(theme.id)}
                className={`flex items-center gap-2 w-full px-2 py-1.5 rounded text-sm hover:bg-accent transition-colors ${current === theme.id ? "bg-accent" : ""}`}
              >
                <span
                  className="size-3 rounded-full shrink-0 border border-border"
                  style={{ backgroundColor: theme.swatch }}
                />
                {theme.label}
              </button>
            ))}
        </div>
      )}
    </div>
  )
}
