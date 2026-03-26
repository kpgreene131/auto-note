"use client"

import { useEffect, useRef, useCallback } from "react"

interface SwipeConfig {
  direction: "horizontal" | "vertical"
  threshold?: number
  edgeZone?: number
  onSwipe: (direction: "left" | "right" | "up" | "down") => void
  onSwipeProgress?: (delta: number) => void
  enabled?: boolean
}

export function useSwipeGesture(
  ref: React.RefObject<HTMLElement | null>,
  config: SwipeConfig
) {
  const {
    direction,
    threshold = 50,
    edgeZone,
    onSwipe,
    onSwipeProgress,
    enabled = true,
  } = config

  const startX = useRef(0)
  const startY = useRef(0)
  const tracking = useRef(false)

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (!enabled) return
      const touch = e.touches[0]
      if (edgeZone && touch.clientX > edgeZone) return
      startX.current = touch.clientX
      startY.current = touch.clientY
      tracking.current = true
    },
    [enabled, edgeZone]
  )

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!tracking.current) return
      const touch = e.touches[0]
      const dx = touch.clientX - startX.current
      const dy = touch.clientY - startY.current

      // Only track if moving in the configured direction
      if (direction === "horizontal" && Math.abs(dy) > Math.abs(dx)) {
        tracking.current = false
        return
      }
      if (direction === "vertical" && Math.abs(dx) > Math.abs(dy)) {
        tracking.current = false
        return
      }

      const delta = direction === "horizontal" ? dx : dy
      onSwipeProgress?.(delta)
    },
    [direction, onSwipeProgress]
  )

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!tracking.current) return
      tracking.current = false
      const touch = e.changedTouches[0]
      const dx = touch.clientX - startX.current
      const dy = touch.clientY - startY.current

      if (direction === "horizontal") {
        if (Math.abs(dx) < threshold) return
        onSwipe(dx > 0 ? "right" : "left")
      } else {
        if (Math.abs(dy) < threshold) return
        onSwipe(dy > 0 ? "down" : "up")
      }
    },
    [direction, threshold, onSwipe]
  )

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return

    el.addEventListener("touchstart", handleTouchStart, { passive: true })
    el.addEventListener("touchmove", handleTouchMove, { passive: true })
    el.addEventListener("touchend", handleTouchEnd, { passive: true })
    el.addEventListener("touchcancel", handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener("touchstart", handleTouchStart)
      el.removeEventListener("touchmove", handleTouchMove)
      el.removeEventListener("touchend", handleTouchEnd)
      el.removeEventListener("touchcancel", handleTouchEnd)
    }
  }, [ref, enabled, handleTouchStart, handleTouchMove, handleTouchEnd])
}
