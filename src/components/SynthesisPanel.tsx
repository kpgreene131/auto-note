"use client"

import { useCallback, useRef, useEffect, useState } from "react"
import ReactMarkdown from "react-markdown"
import { X } from "lucide-react"
import { useIsMobile } from "@/hooks/useMediaQuery"
import type { QuestionState } from "@/lib/ai/types"

export type BottomSheetState = "collapsed" | "small" | "large" | "full"

interface SynthesisPanelProps {
  markdown: string | null
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  loading?: boolean
  question?: QuestionState | null
  onQuestionAnswer?: (answer: string) => void
  onQuestionDismiss?: () => void
  sheetState?: BottomSheetState
  onSheetStateChange?: (state: BottomSheetState) => void
}

const DEFAULT_WIDTH = 384 // w-96
const MIN_WIDTH = 200
const COLLAPSE_THRESHOLD = 100
const HANDLE_HEIGHT = 48
const SMALL_DVH = 33
const LARGE_DVH = 67
const FULL_DVH = 100
const SWIPE_VELOCITY = 0.5 // px/ms threshold

const STATE_ORDER: BottomSheetState[] = ["collapsed", "small", "large", "full"]

export function getSheetHeight(state: BottomSheetState): string {
  switch (state) {
    case "collapsed": return `${HANDLE_HEIGHT}px`
    case "small":     return `${SMALL_DVH}dvh`
    case "large":     return `${LARGE_DVH}dvh`
    case "full":      return `${FULL_DVH}dvh`
  }
}

export function SynthesisPanel({
  markdown,
  collapsed,
  onCollapsedChange,
  loading = false,
  question = null,
  onQuestionAnswer,
  onQuestionDismiss,
  sheetState = "collapsed",
  onSheetStateChange,
}: SynthesisPanelProps) {
  const isMobile = useIsMobile()
  const widthRef = useRef(DEFAULT_WIDTH)
  const isDragging = useRef(false)
  const [otherInput, setOtherInput] = useState("")
  const [showOtherInput, setShowOtherInput] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const dragStartY = useRef(0)
  const dragStartHeight = useRef(0)
  const dragStartTime = useRef(0)
  const isDraggingSheet = useRef(false)

  // Desktop drag resize
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [])

  useEffect(() => {
    if (isMobile) return

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
  }, [onCollapsedChange, isMobile])

  // Reset "Other" input state when question changes
  useEffect(() => {
    setOtherInput("")
    setShowOtherInput(false)
  }, [question?.text])

  // Bottom sheet touch handlers — attached to handle bar only
  const handleSheetTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0]
    dragStartY.current = touch.clientY
    dragStartTime.current = Date.now()
    isDraggingSheet.current = true
    // Capture current height of sheet
    if (sheetRef.current) {
      dragStartHeight.current = sheetRef.current.getBoundingClientRect().height
    }
  }, [])

  const handleSheetTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingSheet.current) return
    const touch = e.touches[0]
    const dy = touch.clientY - dragStartY.current // positive = finger moved down
    const vh = window.innerHeight

    // Dragging down shrinks sheet, dragging up grows it
    const maxHeight = vh * (FULL_DVH / 100)
    const newHeight = Math.max(HANDLE_HEIGHT, Math.min(maxHeight, dragStartHeight.current - dy))

    if (sheetRef.current) {
      sheetRef.current.style.transition = "none"
      sheetRef.current.style.height = `${newHeight}px`
    }
  }, [])

  const handleSheetTouchEnd = useCallback(() => {
    if (!isDraggingSheet.current) return
    isDraggingSheet.current = false

    const vh = window.innerHeight
    const currentHeight = sheetRef.current?.getBoundingClientRect().height ?? HANDLE_HEIGHT
    const heightDelta = currentHeight - dragStartHeight.current // positive = grew (dragged up)
    const dt = Date.now() - dragStartTime.current
    const velocity = Math.abs(heightDelta) / Math.max(dt, 16)

    let targetState: BottomSheetState

    if (velocity > SWIPE_VELOCITY && dt < 300) {
      // Swipe: jump 2 states in flick direction
      const direction = heightDelta > 0 ? 1 : -1 // grew = up = higher index
      const currentIdx = STATE_ORDER.indexOf(sheetState)
      const targetIdx = Math.max(0, Math.min(STATE_ORDER.length - 1, currentIdx + direction * 2))
      targetState = STATE_ORDER[targetIdx]
    } else {
      // Drag: snap to nearest breakpoint by height
      const snaps: { state: BottomSheetState; h: number }[] = [
        { state: "collapsed", h: HANDLE_HEIGHT },
        { state: "small",     h: vh * (SMALL_DVH / 100) },
        { state: "large",     h: vh * (LARGE_DVH / 100) },
        { state: "full",      h: vh * (FULL_DVH / 100) },
      ]

      let nearest = snaps[0]
      let minDist = Math.abs(currentHeight - snaps[0].h)
      for (const snap of snaps) {
        const dist = Math.abs(currentHeight - snap.h)
        if (dist < minDist) {
          minDist = dist
          nearest = snap
        }
      }

      targetState = nearest.state
    }

    // Set height to target explicitly — clearing with "" would leave
    // no height between now and React's re-render, causing the sheet
    // to size to its full content
    if (sheetRef.current) {
      sheetRef.current.style.transition = ""
      sheetRef.current.style.height = getSheetHeight(targetState)
    }

    onSheetStateChange?.(targetState)
  }, [onSheetStateChange, sheetState])

  const handleSheetTouchCancel = useCallback(() => {
    isDraggingSheet.current = false
    if (sheetRef.current) {
      sheetRef.current.style.transition = ""
      sheetRef.current.style.height = getSheetHeight(sheetState)
    }
  }, [sheetState])

  // Shared content rendering
  const renderContent = () => (
    <>
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
    </>
  )

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

  // One-line preview text for peek bar
  const peekText = loading
    ? "Synthesizing..."
    : markdown
      ? markdown.split("\n").find((line) => line.trim())?.replace(/^#+\s*/, "").slice(0, 60) ?? "Synthesis"
      : "Synthesis"

  // --- Mobile bottom sheet ---
  if (isMobile) {
    // Fully hidden only when there's no synthesis content and nothing loading
    if (!markdown && !loading) return null

    return (
      <div
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-40 flex flex-col border-t border-border shadow-lg transition-[height] duration-200 ease-out"
        style={{
          backgroundColor: "var(--surface-content)",
          height: getSheetHeight(sheetState),
        }}
      >
        {/* Drag handle + peek bar — touch handlers here only */}
        <div
          className="flex items-center justify-center px-4 shrink-0 cursor-grab active:cursor-grabbing"
          style={{ height: HANDLE_HEIGHT }}
          onTouchStart={handleSheetTouchStart}
          onTouchMove={handleSheetTouchMove}
          onTouchEnd={handleSheetTouchEnd}
          onTouchCancel={handleSheetTouchCancel}
          onClick={() => {
            if (sheetState === "collapsed") onSheetStateChange?.("small")
            else if (sheetState === "small") onSheetStateChange?.("large")
          }}
        >
          <div className="w-10 h-1 rounded-full bg-muted-foreground/30 absolute top-2" />
          <span className="text-sm text-muted-foreground truncate mt-1">
            {loading && (
              <span className="inline-block size-2 rounded-full bg-muted-foreground/50 animate-pulse mr-2 align-middle" />
            )}
            {peekText}
          </span>
        </div>

        {/* Scrollable content — visible in small, large, and full states */}
        {sheetState !== "collapsed" && (
          <div className="flex-1 min-h-0 p-4 overflow-y-auto">
            {renderContent()}
          </div>
        )}
      </div>
    )
  }

  // --- Desktop side panel ---
  const displayWidth = collapsed
    ? 0
    : Math.max(widthRef.current, DEFAULT_WIDTH)

  if (!collapsed && widthRef.current < DEFAULT_WIDTH) {
    widthRef.current = DEFAULT_WIDTH
  }

  if (collapsed) return null

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
        {renderContent()}
      </div>
    </aside>
  )
}
