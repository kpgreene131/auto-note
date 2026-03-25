"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { PanelLeftClose, PanelLeftOpen, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/Sidebar"
import { UserBadge } from "@/components/UserBadge"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"
import { useIsMobile } from "@/hooks/useMediaQuery"
import { useSwipeGesture } from "@/hooks/useSwipeGesture"

export function AppShell({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Force sidebar collapsed on mobile
  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(true)
    }
  }, [isMobile])

  // Auto-close mobile sidebar on route change
  useEffect(() => {
    if (isMobile) {
      setMobileSidebarOpen(false)
    }
  }, [pathname, isMobile])

  // Swipe from left edge to open sidebar
  useSwipeGesture(containerRef, {
    direction: "horizontal",
    edgeZone: 20,
    threshold: 50,
    enabled: isMobile && !mobileSidebarOpen,
    onSwipe: useCallback(
      (dir: string) => {
        if (dir === "right") setMobileSidebarOpen(true)
      },
      []
    ),
  })

  // Swipe left on sidebar to close
  const sidebarRef = useRef<HTMLElement>(null)
  useSwipeGesture(sidebarRef, {
    direction: "horizontal",
    threshold: 50,
    enabled: isMobile && mobileSidebarOpen,
    onSwipe: useCallback(
      (dir: string) => {
        if (dir === "left") setMobileSidebarOpen(false)
      },
      []
    ),
  })

  const toggleSidebar = () => {
    if (isMobile) {
      setMobileSidebarOpen((prev) => !prev)
    } else {
      setSidebarCollapsed((prev) => !prev)
    }
  }

  return (
    <div ref={containerRef} className="flex flex-col h-screen">
      <header className="h-12 border-b border-border flex items-center px-4 gap-2 shrink-0 bg-background">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={toggleSidebar}
          aria-label={
            isMobile
              ? mobileSidebarOpen
                ? "Close menu"
                : "Open menu"
              : sidebarCollapsed
                ? "Show sidebar"
                : "Hide sidebar"
          }
          className="md:size-8 size-11"
        >
          {isMobile ? (
            <Menu className="size-5" />
          ) : sidebarCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>

        <div className="flex-1" />

        <ThemeSwitcher />
        <UserBadge />
      </header>

      <div className="flex flex-1 min-h-0 relative overflow-hidden">
        {/* Mobile sidebar */}
        {isMobile && (
          <>
            <aside
              ref={sidebarRef}
              className={`absolute inset-y-0 left-0 w-64 z-30 border-r border-border flex flex-col transition-transform duration-200 ease-out ${
                mobileSidebarOpen
                  ? "translate-x-0"
                  : "-translate-x-full"
              }`}
              style={{ backgroundColor: "var(--surface-sidebar)" }}
            >
              <Sidebar />
            </aside>

            {/* Tap-to-dismiss overlay */}
            {mobileSidebarOpen && (
              <div
                className="absolute inset-0 z-20"
                onClick={() => setMobileSidebarOpen(false)}
                aria-hidden
              />
            )}
          </>
        )}

        {/* Desktop sidebar */}
        {!isMobile && !sidebarCollapsed && (
          <aside
            className="w-64 border-r border-border flex flex-col"
            style={{ backgroundColor: "var(--surface-sidebar)" }}
          >
            <Sidebar />
          </aside>
        )}

        {/* Main content — push right on mobile when sidebar open */}
        <main
          className={`flex-1 overflow-hidden transition-transform duration-200 ease-out ${
            isMobile && mobileSidebarOpen ? "translate-x-64" : ""
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
