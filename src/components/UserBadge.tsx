"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { Show, UserButton, SignInButton } from "@clerk/nextjs"

export function UserBadge() {
  return (
    <div className="flex items-center gap-2">
      <Link
        href="/settings"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <Settings className="size-5" />
      </Link>
      <Show when="signed-in">
        <UserButton />
      </Show>
      <Show when="signed-out">
        <SignInButton />
      </Show>
    </div>
  )
}
