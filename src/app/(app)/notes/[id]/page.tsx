"use client"

import { use, useState, useEffect, useCallback, useRef } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { NoteEditor, type SaveStatus } from "@/components/NoteEditor"
import { SynthesisPanel } from "@/components/SynthesisPanel"
import { Button } from "@/components/ui/button"
import { fetchNote, updateNote } from "@/lib/api"
import { dispatchNoteUpdated } from "@/lib/events"
import type { Note } from "@/lib/api"

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [synthesisCollapsed, setSynthesisCollapsed] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const titleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleClearTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setNote(null)
    setSaveStatus("idle")

    fetchNote(id)
      .then(setNote)
      .catch((err) => setError(err.message ?? "Failed to load note"))
      .finally(() => setLoading(false))
  }, [id])

  const handleTitleInput = useCallback((e: React.FormEvent<HTMLDivElement>) => {
    const newTitle = e.currentTarget.textContent ?? ""
    if (titleTimeout.current) clearTimeout(titleTimeout.current)
    if (titleClearTimeout.current) clearTimeout(titleClearTimeout.current)
    setSaveStatus("saving")
    titleTimeout.current = setTimeout(async () => {
      try {
        await updateNote(id, { title: newTitle || null })
        setSaveStatus("saved")
        dispatchNoteUpdated()
        titleClearTimeout.current = setTimeout(() => setSaveStatus("idle"), 2000)
      } catch {
        setSaveStatus("error")
      }
    }, 1000)
  }, [id])

  // Cleanup title timeouts
  useEffect(() => {
    return () => {
      if (titleTimeout.current) clearTimeout(titleTimeout.current)
      if (titleClearTimeout.current) clearTimeout(titleClearTimeout.current)
    }
  }, [])

  const toggleSynthesis = useCallback(() => {
    setSynthesisCollapsed((prev) => !prev)
  }, [])

  const handleEditorSaveStatus = useCallback((status: SaveStatus) => {
    setSaveStatus(status)
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center h-10 px-4 border-b border-border shrink-0" style={{ backgroundColor: "var(--surface-titlebar)" }}>
          <div className="h-4 w-48 bg-muted animate-pulse rounded" />
        </div>
        <div className="flex-1 p-4" style={{ backgroundColor: "var(--surface-content)" }}>
          <div className="space-y-3">
            <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
            <div className="h-4 w-2/3 bg-muted animate-pulse rounded" />
          </div>
        </div>
      </div>
    )
  }

  if (error || !note) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>{error ?? "Note not found."}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center h-10 px-4 border-b border-border shrink-0 gap-2" style={{ backgroundColor: "var(--surface-titlebar)" }}>
        <div
          contentEditable
          suppressContentEditableWarning
          onInput={handleTitleInput}
          className="text-sm font-medium flex-1 truncate outline-none focus:ring-1 focus:ring-ring/50 rounded px-1 -mx-1"
        >
          {note.title ?? "Untitled"}
        </div>
        {saveStatus !== "idle" && (
          <span className={`text-xs shrink-0 ${saveStatus === "error" ? "text-destructive" : "text-muted-foreground"}`}>
            {saveStatus === "saving" && "Saving..."}
            {saveStatus === "saved" && "Saved"}
            {saveStatus === "error" && "Save failed"}
          </span>
        )}
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
          <NoteEditor
            noteId={id}
            content={note.content}
            onSaveStatusChange={handleEditorSaveStatus}
          />
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
