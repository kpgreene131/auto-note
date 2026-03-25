"use client"

import { use, useState, useEffect, useCallback, useRef } from "react"
import { ChevronRight, ChevronLeft } from "lucide-react"
import { NoteEditor, type SaveStatus } from "@/components/NoteEditor"
import { SynthesisPanel } from "@/components/SynthesisPanel"
import { Button } from "@/components/ui/button"
import { useIsMobile } from "@/hooks/useMediaQuery"
import { fetchNote, updateNote, synthesizeNote } from "@/lib/api"
import { dispatchNoteUpdated } from "@/lib/events"
import type { Note } from "@/lib/api"
import type { QuestionState } from "@/lib/ai/types"

export default function NotePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const isMobile = useIsMobile()
  const [note, setNote] = useState<Note | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [synthesisCollapsed, setSynthesisCollapsed] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle")
  const [synthesisLoading, setSynthesisLoading] = useState(false)
  const [synthesisMarkdown, setSynthesisMarkdown] = useState<string | null>(null)
  const [questionState, setQuestionState] = useState<QuestionState | null>(null)
  const titleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleClearTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const synthesisAbort = useRef<AbortController | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    setNote(null)
    setSaveStatus("idle")
    setSynthesisMarkdown(null)
    setQuestionState(null)

    fetchNote(id)
      .then((n) => {
        setNote(n)
        setSynthesisMarkdown(n.synthesis)
      })
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

  const handleSynthesisRequest = useCallback(async (content: unknown) => {
    // Cancel any in-flight synthesis
    synthesisAbort.current?.abort()
    const controller = new AbortController()
    synthesisAbort.current = controller

    setSynthesisLoading(true)
    try {
      const questionContext = questionState
        ? { text: questionState.text, answer: questionState.answer }
        : undefined

      const result = await synthesizeNote(id, { content, questionContext })

      // Check if this request was aborted
      if (controller.signal.aborted) return

      // Update synthesis markdown
      if (result.synthesis) {
        setSynthesisMarkdown(result.synthesis.markdown)
      }

      // Update title if proposed or cleaned
      if (result.title) {
        if (result.title.action === "propose") {
          setNote(prev => prev ? { ...prev, title: result.title!.suggested } : prev)
          // Update the contentEditable title display
          if (titleRef.current) {
            titleRef.current.textContent = result.title.suggested
          }
          dispatchNoteUpdated()
        } else if (result.title.action === "clean") {
          setNote(prev => {
            if (!prev || prev.title === result.title!.suggested) return prev
            return { ...prev, title: result.title!.suggested }
          })
          if (titleRef.current && titleRef.current.textContent !== result.title.suggested) {
            titleRef.current.textContent = result.title.suggested
          }
          dispatchNoteUpdated()
        }
      }

      // Update question state
      if (result.question) {
        setQuestionState({
          text: result.question.text,
          options: result.question.options,
        })
      } else {
        setQuestionState(null)
      }
    } catch (err) {
      // Silently ignore aborted requests and 422 (too short)
      if (controller.signal.aborted) return
      console.error("Synthesis failed:", err)
    } finally {
      if (!controller.signal.aborted) {
        setSynthesisLoading(false)
      }
    }
  }, [id, questionState])

  const handleQuestionAnswer = useCallback((answer: string) => {
    setQuestionState(prev => prev ? { ...prev, answer } : null)
  }, [])

  const handleQuestionDismiss = useCallback(() => {
    // Mark as unanswered so it gets passed back in next synthesis
    setQuestionState(prev => prev ? { ...prev, unanswered: true } : null)
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
        <div className="flex items-center h-12 px-4 border-b border-border shrink-0" style={{ backgroundColor: "var(--surface-titlebar)" }}>
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
      <div className="flex items-center h-12 px-4 border-b border-border shrink-0 gap-2" style={{ backgroundColor: "var(--surface-titlebar)" }}>
        <div
          ref={titleRef}
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
        {!isMobile && (
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
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        <div className="flex-1 p-4 overflow-y-auto" style={{ backgroundColor: "var(--surface-content)" }}>
          <NoteEditor
            noteId={id}
            content={note.content}
            onSaveStatusChange={handleEditorSaveStatus}
            onSynthesisRequest={handleSynthesisRequest}
          />
        </div>
        <SynthesisPanel
          markdown={synthesisMarkdown}
          collapsed={synthesisCollapsed}
          onCollapsedChange={setSynthesisCollapsed}
          loading={synthesisLoading}
          question={questionState}
          onQuestionAnswer={handleQuestionAnswer}
          onQuestionDismiss={handleQuestionDismiss}
        />
      </div>
    </div>
  )
}
