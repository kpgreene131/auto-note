"use client"

import { useState } from "react"
import { PanelLeftClose, PanelLeftOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sidebar } from "@/components/Sidebar"
import { UserBadge } from "@/components/UserBadge"
import { ThemeSwitcher } from "@/components/ThemeSwitcher"

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex flex-col h-screen">
      <header className="h-12 border-b border-border flex items-center px-4 gap-2 shrink-0 bg-background">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="size-4" />
          ) : (
            <PanelLeftClose className="size-4" />
          )}
        </Button>

        <div className="flex-1" />

        <ThemeSwitcher />
        <UserBadge />
      </header>

      <div className="flex flex-1 min-h-0">
        {!sidebarCollapsed && (
          <aside className="w-64 border-r border-border flex flex-col" style={{ backgroundColor: "var(--surface-sidebar)" }}>
            <Sidebar />
          </aside>
        )}

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}
