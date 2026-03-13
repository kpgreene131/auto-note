"use client"

import { useCallback, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"

interface SynthesisPanelProps {
  markdown: string
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
}

const DEFAULT_WIDTH = 384 // w-96
const MIN_WIDTH = 200
const COLLAPSE_THRESHOLD = 100

export function SynthesisPanel({
  markdown,
  collapsed,
  onCollapsedChange,
}: SynthesisPanelProps) {
  const widthRef = useRef(DEFAULT_WIDTH)
  const isDragging = useRef(false)

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
      // Direct DOM update for smooth dragging
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

  // Restore to at least default width when uncollapsing
  const displayWidth = collapsed
    ? 0
    : Math.max(widthRef.current, DEFAULT_WIDTH)

  // Update ref when uncollapsing
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

      <div className="flex-1 min-h-0 p-4 overflow-y-auto prose prose-sm dark:prose-invert max-w-none">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </aside>
  )
}
