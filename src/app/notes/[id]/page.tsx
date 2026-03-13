"use client"

import { use, useState, useCallback } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { NoteEditor } from "@/components/NoteEditor"
import { SynthesisPanel } from "@/components/SynthesisPanel"
import { Button } from "@/components/ui/button"
import { mockNotes } from "@/mock/notes"

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const note = mockNotes.find((n) => n.id === id)
  const [synthesisCollapsed, setSynthesisCollapsed] = useState(false)

  const toggleSynthesis = useCallback(() => {
    setSynthesisCollapsed((prev) => !prev)
  }, [])

  if (!note) {
    return <div className="p-4 text-muted-foreground">Note not found.</div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-10 px-4 border-b border-border shrink-0" style={{ backgroundColor: "var(--surface-titlebar)" }}>
        <span className="text-sm font-medium flex-1 truncate">
          {note.title}
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={toggleSynthesis}
          aria-label={
            synthesisCollapsed ? "Show synthesis" : "Hide synthesis"
          }
        >
          {synthesisCollapsed ? (
            <ChevronLeft className="size-4" />
          ) : (
            <ChevronRight className="size-4" />
          )}
        </Button>
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: "var(--surface-content)" }}>
          <NoteEditor content={note.content} />
        </div>
        <SynthesisPanel
          markdown={note.synthesis}
          collapsed={synthesisCollapsed}
          onCollapsedChange={setSynthesisCollapsed}
        />
      </div>
    </div>
  )
}
