"use client"

import Link from "next/link"
import { Settings } from "lucide-react"
import { Show, UserButton, SignInButton } from "@clerk/nextjs"

export function UserBadge() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/settings"
        className="inline-flex items-center justify-center size-11 md:size-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
      >
        <Settings className="size-5 md:size-4" />
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
