"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus } from "lucide-react"
import { mockNotes } from "@/mock/notes"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      <div className="flex items-center h-10 px-3 border-b border-border shrink-0">
        <Button variant="outline" size="xs" className="gap-1.5 bg-muted/50">
          <Plus className="size-4" />
          New Note
        </Button>
      </div>

      <ScrollArea className="flex-1 min-h-0">
        <nav>
          {mockNotes.map((note) => {
            const isActive = pathname === `/notes/${note.id}`
            return (
              <Link
                key={note.id}
                href={`/notes/${note.id}`}
                className={`block p-3 border-b border-border hover:bg-accent transition-colors ${isActive ? "bg-accent" : ""}`}
              >
                <div className="font-medium text-sm truncate">
                  {note.title}
                </div>
                <div className="text-xs text-muted-foreground truncate mt-0.5">
                  {note.content.slice(0, 60)}...
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            )
          })}
        </nav>
      </ScrollArea>
    </>
  )
}
