"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Plus, Trash2, Undo2, ChevronDown, ChevronRight } from "lucide-react"
import { generateText } from "@tiptap/core"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { fetchNotes, createNote, deleteNote, fetchTrash, restoreNote, permanentlyDeleteNote } from "@/lib/api"
import type { Note } from "@/lib/api"

function getPreview(content: unknown): string {
  if (!content || typeof content !== "object") return "Empty note"
  try {
    return generateText(content as Parameters<typeof generateText>[0], [StarterKit]).slice(0, 60) || "Empty note"
  } catch {
    return "Empty note"
  }
}

function getDeletedAgo(deletedAt: Date | string): string {
  const ms = Date.now() - new Date(deletedAt).getTime()
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  if (days === 0) return "Deleted today"
  if (days === 1) return "Deleted 1 day ago"
  return `Deleted ${days} days ago`
}

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [deleteTarget, setDeleteTarget] = useState<Note | null>(null)

  const [trashOpen, setTrashOpen] = useState(false)
  const [trashNotes, setTrashNotes] = useState<Note[]>([])
  const [trashCount, setTrashCount] = useState(0)
  const [trashLoading, setTrashLoading] = useState(false)
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<Note | null>(null)

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

  const loadTrash = useCallback(async () => {
    setTrashLoading(true)
    try {
      const data = await fetchTrash()
      setTrashNotes(data)
      setTrashCount(data.length)
    } catch (err) {
      console.error("Failed to fetch trash:", err)
    } finally {
      setTrashLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotes()
  }, [loadNotes])

  // Fetch trash count on mount
  useEffect(() => {
    fetchTrash().then((data) => setTrashCount(data.length)).catch(() => {})
  }, [])

  // Fetch full trash when expanded
  useEffect(() => {
    if (trashOpen) loadTrash()
  }, [trashOpen, loadTrash])

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
      // Refresh trash count (and list if open)
      const data = await fetchTrash()
      setTrashNotes(data)
      setTrashCount(data.length)
      if (wasActive) {
        router.push("/")
      }
    } catch (err) {
      console.error("Failed to delete note:", err)
    }
  }

  async function handleRestore(note: Note) {
    try {
      await restoreNote(note.id)
      await loadNotes()
      const data = await fetchTrash()
      setTrashNotes(data)
      setTrashCount(data.length)
    } catch (err) {
      console.error("Failed to restore note:", err)
    }
  }

  async function handlePermanentDelete(note: Note) {
    try {
      await permanentlyDeleteNote(note.id)
      const data = await fetchTrash()
      setTrashNotes(data)
      setTrashCount(data.length)
    } catch (err) {
      console.error("Failed to permanently delete note:", err)
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

      {/* Recently Deleted — sticky bottom */}
      <div className="shrink-0 border-t border-border">
        <button
          onClick={() => setTrashOpen((prev) => !prev)}
          className="flex items-center w-full px-3 py-2 text-sm text-muted-foreground hover:bg-accent transition-colors gap-1.5"
        >
          {trashOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
          <span>Recently Deleted</span>
          {trashCount > 0 && (
            <span className="ml-auto text-xs bg-muted px-1.5 py-0.5 rounded-full">
              {trashCount}
            </span>
          )}
        </button>

        {trashOpen && (
          <div className="max-h-[40vh] overflow-y-auto">
            {trashLoading ? (
              <div className="p-3 text-xs text-muted-foreground">Loading...</div>
            ) : trashNotes.length === 0 ? (
              <div className="p-3 text-xs text-muted-foreground">No deleted notes</div>
            ) : (
              trashNotes.map((note) => (
                <div
                  key={note.id}
                  className="flex items-center gap-2 px-3 py-2 border-t border-border text-sm"
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{note.title ?? "Untitled"}</div>
                    <div className="text-xs text-muted-foreground">
                      {note.deleted_at ? getDeletedAgo(note.deleted_at) : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRestore(note)}
                    className="p-1 rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                    aria-label={`Restore ${note.title ?? "note"}`}
                  >
                    <Undo2 className="size-3.5" />
                  </button>
                  <button
                    onClick={() => setPermanentDeleteTarget(note)}
                    className="p-1 rounded text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive transition-colors"
                    aria-label={`Permanently delete ${note.title ?? "note"}`}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="Delete note"
        description={`Are you sure you want to delete "${deleteTarget?.title ?? "Untitled"}"? It will be moved to Recently Deleted.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => {
          if (deleteTarget) handleDelete(deleteTarget)
        }}
      />

      <ConfirmDialog
        open={permanentDeleteTarget !== null}
        onOpenChange={(open) => { if (!open) setPermanentDeleteTarget(null) }}
        title="Delete forever"
        description={`Permanently delete "${permanentDeleteTarget?.title ?? "Untitled"}"? This cannot be undone.`}
        confirmLabel="Delete forever"
        destructive
        onConfirm={() => {
          if (permanentDeleteTarget) handlePermanentDelete(permanentDeleteTarget)
        }}
      />
    </>
  )
}
