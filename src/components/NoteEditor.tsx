"use client"

import { useEffect, useRef, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { updateNote } from "@/lib/api"
import { dispatchNoteUpdated } from "@/lib/events"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

interface NoteEditorProps {
  noteId: string
  content: unknown
  onSaveStatusChange: (status: SaveStatus) => void
}

export function NoteEditor({ noteId, content, onSaveStatusChange }: NoteEditorProps) {
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedClearTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noteIdRef = useRef(noteId)
  noteIdRef.current = noteId

  const save = useCallback(async (json: unknown) => {
    onSaveStatusChange("saving")
    try {
      await updateNote(noteIdRef.current, { content: json })
      onSaveStatusChange("saved")
      dispatchNoteUpdated()
      savedClearTimeout.current = setTimeout(() => onSaveStatusChange("idle"), 2000)
    } catch {
      onSaveStatusChange("error")
    }
  }, [onSaveStatusChange])

  const editor = useEditor({
    extensions: [StarterKit],
    content: content as Parameters<typeof useEditor>[0] extends { content?: infer C } ? C : never,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      if (savedClearTimeout.current) clearTimeout(savedClearTimeout.current)
      saveTimeout.current = setTimeout(() => save(editor.getJSON()), 1000)
    },
  })

  // Update editor content when noteId changes
  useEffect(() => {
    if (editor && content !== undefined) {
      editor.commands.setContent(content as Parameters<typeof editor.commands.setContent>[0])
    }
  }, [editor, noteId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      if (savedClearTimeout.current) clearTimeout(savedClearTimeout.current)
    }
  }, [])

  return (
    <EditorContent editor={editor} className="h-full prose dark:prose-invert max-w-none [&_*:first-child]:mt-0 [&>.tiptap]:min-h-full" />
  )
}
