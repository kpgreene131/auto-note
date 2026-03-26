# ADR-006: Velocity-Based Bottom Sheet Gestures

## Status

accepted

## Context

The initial bottom sheet implementation (Spec 010) treated all touch releases identically — it snapped to the nearest breakpoint by pixel distance. This created a poor UX:

- Fast flicks and slow drags behaved the same way
- Users couldn't jump past intermediate states (e.g., flick from collapsed to full)
- The gesture feel was rigid and un-native compared to iOS/Android bottom sheets

We needed to decide between:

1. **Gesture library** (e.g., `@use-gesture/react`, `react-use-gesture`) — provides velocity detection, inertia, spring physics out of the box
2. **Custom velocity detection** — track timestamps in `touchstart`/`touchend`, compute `dy/dt`, branch on a threshold

The bottom sheet is the only swipe-gesture surface in the app. The sidebar uses swipe-from-edge but that's a simpler binary open/close detection.

## Decision

Use custom velocity detection with raw touch events. The gesture model:

- **Swipe** (velocity > 0.5 px/ms, duration < 300ms): jump 2 states in the flick direction
- **Drag** (below threshold): snap to nearest breakpoint by pixel distance

Implementation adds a single `useRef` for `dragStartTime` and ~10 lines of velocity math in `handleSheetTouchEnd`. No new dependencies.

## Consequences

**Positive:**
- Zero added dependencies for a single interaction pattern
- Simple, readable implementation — velocity is just `|dy| / dt`
- The 2-state jump heuristic creates a clear distinction between swipe and drag intent
- Easy to tune — `SWIPE_VELOCITY` and the 300ms cap are named constants

**Negative:**
- No spring/inertia physics — snaps are CSS transition-based (200ms ease-out), not momentum-based
- If we add more swipe surfaces later, we may want to extract a shared hook or adopt a library
- The 0.5 px/ms threshold and 2-state jump are heuristics that may need tuning based on real device testing

**Deferred:**
- Extracting a `useSwipeGesture` hook if more surfaces need velocity detection
- Spring physics / momentum-based animation (would require `framer-motion` or similar)
