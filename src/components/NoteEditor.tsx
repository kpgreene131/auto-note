"use client"

import { useEffect, useRef, useCallback } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { updateNote } from "@/lib/api"
import { dispatchNoteUpdated } from "@/lib/events"
import { AI_CONFIG } from "@/lib/ai/config"

export type SaveStatus = "idle" | "saving" | "saved" | "error"

interface NoteEditorProps {
  noteId: string
  content: unknown
  onSaveStatusChange: (status: SaveStatus) => void
  onSynthesisRequest?: (content: unknown) => void
  onActivity?: () => void
}

export function NoteEditor({ noteId, content, onSaveStatusChange, onSynthesisRequest, onActivity }: NoteEditorProps) {
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedClearTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const noteIdRef = useRef(noteId)
  noteIdRef.current = noteId
  const lastSynthesizedCharCount = useRef(0)
  const synthesisTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingSynthesisJson = useRef<unknown>(null)
  const onSynthesisRequestRef = useRef(onSynthesisRequest)
  onSynthesisRequestRef.current = onSynthesisRequest
  const onActivityRef = useRef(onActivity)
  onActivityRef.current = onActivity

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
    editorProps: {
      scrollThreshold: { top: 100, bottom: 100, left: 0, right: 0 },
      scrollMargin: { top: 20, bottom: 20, left: 0, right: 0 },
    },
    onFocus: () => onActivityRef.current?.(),
    onUpdate: ({ editor }) => {
      onActivityRef.current?.()
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      if (savedClearTimeout.current) clearTimeout(savedClearTimeout.current)

      const json = editor.getJSON()
      saveTimeout.current = setTimeout(() => save(json), 1000)

      // Check synthesis trigger: delta threshold + typing pause
      const currentChars = editor.getText().length
      const delta = currentChars - lastSynthesizedCharCount.current
      const threshold = Math.max(AI_CONFIG.synthesisDeltaMin, currentChars * AI_CONFIG.synthesisDeltaRatio)

      // Always clear pending synthesis timer on new keystroke
      if (synthesisTimeout.current) clearTimeout(synthesisTimeout.current)

      if (currentChars >= AI_CONFIG.synthesisMinChars && delta >= threshold) {
        // Delta threshold met — wait for typing pause before firing
        pendingSynthesisJson.current = json
        synthesisTimeout.current = setTimeout(() => {
          lastSynthesizedCharCount.current = currentChars
          onSynthesisRequestRef.current?.(pendingSynthesisJson.current)
          pendingSynthesisJson.current = null
        }, AI_CONFIG.synthesisTypingPauseMs)
      }
    },
  })

  // Update editor content when noteId changes
  useEffect(() => {
    if (editor && content !== undefined) {
      editor.commands.setContent(content as Parameters<typeof editor.commands.setContent>[0])
      // Reset synthesis tracking for new note
      lastSynthesizedCharCount.current = 0
    }
  }, [editor, noteId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Page leave: flush any pending save immediately
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!editor) return
      // If there's a pending save timeout, clear it and fire save now
      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current)
        saveTimeout.current = null
        const json = editor.getJSON()
        // Use keepalive fetch for reliable delivery during page unload
        fetch(`/api/notes/${noteIdRef.current}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: json }),
          keepalive: true,
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [editor])

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current)
      if (savedClearTimeout.current) clearTimeout(savedClearTimeout.current)
      if (synthesisTimeout.current) clearTimeout(synthesisTimeout.current)
    }
  }, [])

  return (
    <EditorContent editor={editor} className="h-full prose dark:prose-invert max-w-none [&_*:first-child]:mt-0 [&>.tiptap]:min-h-full" />
  )
}
