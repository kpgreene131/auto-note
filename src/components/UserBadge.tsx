"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

export function UserBadge() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/settings"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="size-5" />
      </Link>
      <Avatar>
        <AvatarFallback>KG</AvatarFallback>
      </Avatar>
    </div>
  )
}
