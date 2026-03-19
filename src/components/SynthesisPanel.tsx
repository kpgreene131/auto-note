"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import { X } from "lucide-react"
import type { QuestionState } from "@/lib/ai/types"

interface SynthesisPanelProps {
  markdown: string | null
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  loading?: boolean
  question?: QuestionState | null
  onQuestionAnswer?: (answer: string) => void
  onQuestionDismiss?: () => void
}

const DEFAULT_WIDTH = 384 // w-96
const MIN_WIDTH = 200
const COLLAPSE_THRESHOLD = 100

export function SynthesisPanel({
  markdown,
  collapsed,
  onCollapsedChange,
  loading = false,
  question = null,
  onQuestionAnswer,
  onQuestionDismiss,
}: SynthesisPanelProps) {
  const widthRef = useRef(DEFAULT_WIDTH)
  const isDragging = useRef(false)
  const [otherInput, setOtherInput] = useState("")
  const [showOtherInput, setShowOtherInput] = useState(false)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const newWidth = window.innerWidth - e.clientX
      if (newWidth < COLLAPSE_THRESHOLD) {
        onCollapsedChange(true)
        return
      }
      onCollapsedChange(false)
      widthRef.current = Math.max(MIN_WIDTH, newWidth)
      const aside = document.querySelector<HTMLElement>(
        "[data-slot='synthesis-panel']"
      )
      if (aside) aside.style.width = `${widthRef.current}px`
    }

    const handleMouseUp = () => {
      if (!isDragging.current) return
      isDragging.current = false
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [onCollapsedChange])

  // Reset "Other" input state when question changes
  useEffect(() => {
    setOtherInput("")
    setShowOtherInput(false)
  }, [question?.text])

  const displayWidth = collapsed
    ? 0
    : Math.max(widthRef.current, DEFAULT_WIDTH)

  if (!collapsed && widthRef.current < DEFAULT_WIDTH) {
    widthRef.current = DEFAULT_WIDTH
  }

  if (collapsed) return null

  const handleOptionClick = (option: string) => {
    if (option === "Other") {
      setShowOtherInput(true)
      return
    }
    onQuestionAnswer?.(option)
  }

  const handleOtherSubmit = () => {
    const trimmed = otherInput.trim()
    if (trimmed) {
      onQuestionAnswer?.(trimmed)
      setOtherInput("")
      setShowOtherInput(false)
    }
  }

  return (
    <aside
      data-slot="synthesis-panel"
      className="relative border-l-2 border-muted-foreground/30 flex flex-col overflow-hidden shrink-0"
      style={{ backgroundColor: "var(--surface-content)", width: displayWidth }}
    >
      {/* Drag handle */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-ring/50 active:bg-ring/50 z-10"
      />

      <div className="flex-1 min-h-0 p-4 overflow-y-auto">
        {/* Loading indicator */}
        {loading && !markdown && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm italic">
            <span className="inline-block size-2 rounded-full bg-muted-foreground/50 animate-pulse" />
            Synthesizing...
          </div>
        )}

        {/* Synthesis content */}
        {markdown ? (
          <div className="relative">
            {loading && (
              <div className="absolute top-0 right-0">
                <span className="inline-block size-2 rounded-full bg-muted-foreground/50 animate-pulse" />
              </div>
            )}
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown>{markdown}</ReactMarkdown>
            </div>
          </div>
        ) : (
          !loading && (
            <p className="text-muted-foreground text-sm italic">No synthesis yet</p>
          )
        )}

        {/* Clarifying question */}
        {question && !question.answer && (
          <div className="mt-4 rounded-lg border border-border/60 bg-muted/30 p-3">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-foreground/80">{question.text}</p>
              {onQuestionDismiss && (
                <button
                  onClick={onQuestionDismiss}
                  className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Dismiss question"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {question.options.map((option) => (
                <button
                  key={option}
                  onClick={() => handleOptionClick(option)}
                  className="inline-flex items-center rounded-full border border-border/60 bg-background px-2.5 py-1 text-xs text-foreground/80 hover:bg-muted hover:text-foreground transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
            {showOtherInput && (
              <div className="mt-2 flex gap-1.5">
                <input
                  type="text"
                  value={otherInput}
                  onChange={(e) => setOtherInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleOtherSubmit()}
                  placeholder="Type your answer..."
                  className="flex-1 rounded border border-border/60 bg-background px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-ring/50"
                  autoFocus
                />
                <button
                  onClick={handleOtherSubmit}
                  className="rounded border border-border/60 bg-background px-2 py-1 text-xs hover:bg-muted transition-colors"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
