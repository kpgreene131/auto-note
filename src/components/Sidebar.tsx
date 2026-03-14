"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Plus, Trash2 } from "lucide-react"
import { generateText } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { fetchNotes, createNote, deleteNote } from "@/lib/api"
import type { Note } from "@/lib/api"

function getPreview(content: unknown): string {
  if (!content || typeof content !== "object") return "Empty note"
  try {
    return generateText(content as Parameters<typeof generateText>[0], [StarterKit]).slice(0, 60) || "Empty note"
  } catch {
    return "Empty note"
  }
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)

  const loadNotes = useCallback(async () => {
    try {
      const data = await fetchNotes()
      setNotes(data)
    } catch (err) {
      console.error("Failed to fetch notes:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  async function handleCreate() {
    try {
      const note = await createNote()
      await loadNotes()
      router.push(`/notes/${note.id}`)
    } catch (err) {
      console.error("Failed to create note:", err)
    }
  }

  async function handleDelete(note: Note) {
    const wasActive = pathname === `/notes/${note.id}`
    try {
      await deleteNote(note.id)
      await loadNotes()
      if (wasActive) {
        router.push("/")
      }
    } catch (err) {
      console.error("Failed to delete note:", err)
    }
  }

  return (
    <>
      <div className="flex items-center h-10 px-3 border-b border-border shrink-0">
        <Button variant="outline" size="xs" className="gap-1.5 bg-muted/50" onClick={handleCreate}>
          <Plus className="size-4" />
          New Note
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <nav>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 border-b border-border">
                <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
                <div className="h-3 w-1/2 bg-muted animate-pulse rounded mt-1.5" />
                <div className="h-3 w-1/3 bg-muted animate-pulse rounded mt-1.5" />
              </div>
            ))
          ) : notes.length === 0 ? (
            <div className="p-3 text-sm text-muted-foreground">
              No notes yet
            </div>
          ) : (
            notes.map((note) => {
              const isActive = pathname === `/notes/${note.id}`
              return (
                <div
                  key={note.id}
                  className={`relative border-b border-border hover:bg-accent transition-colors ${isActive ? "bg-accent" : ""}`}
                >
                  <Link
                    href={`/notes/${note.id}`}
                    className="block p-3 pr-8"
                  >
                    <div className="font-medium text-sm truncate mask-r-from-80%">
                      {note.title ?? "Untitled"}
                    </div>
                    <div className="text-xs text-muted-foreground truncate mt-0.5 mask-r-from-80%">
                      {getPreview(note.content)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(note.updated_at).toLocaleDateString()}
                    </div>
                  </Link>
                  <button
                    onClick={() => setDeleteTarget(note)}
                    className="absolute right-2 top-3 p-1 rounded text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label={`Delete ${note.title ?? "note"}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              )
            })
          )}
        </nav>
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete note"
        description={`Are you sure you want to delete "${deleteTarget?.title ?? "Untitled"}"? This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget)
        }}
      />
    </>
  )
}
