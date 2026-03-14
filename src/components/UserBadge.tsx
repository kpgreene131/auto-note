"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Settings } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { fetchCurrentUser } from "@/lib/api"

function getInitials(name: string | null): string {
  if (!name) return "?"
  return name.split(" ").map((w) => w[0]).filter(Boolean).join("").toUpperCase().slice(0, 2)
}

export function UserBadge() {
  const [initials, setInitials] = useState("?")

  useEffect(() => {
    fetchCurrentUser()
      .then((user) => setInitials(getInitials(user.display_name)))
      .catch(() => {})
  }, [])

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/settings"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="size-5" />
      </Link>
      <Avatar>
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </div>
  )
}
