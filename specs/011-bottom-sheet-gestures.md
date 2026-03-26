# Spec: Bottom Sheet Gesture Rework

## Status

completed

## Context

The initial mobile bottom sheet implementation (Spec 010) used a simple snap-to-nearest-breakpoint model on touch release. Three problems emerged during testing:

1. **No velocity detection** — fast swipes and slow drags were treated identically, so users couldn't flick past intermediate states
2. **Can't jump states** — dragging from collapsed to full required stopping at every intermediate breakpoint
3. **Confusing state names** — `peek` (48px bar) and `small` (33dvh) were ambiguous; the 48px handle is a UI element present in all visible states, not a state itself

Additionally, the original three content states (peek at 48px, small at 33dvh, expanded at 67dvh) didn't provide enough height granularity — the jump from 33% to 67% was too large with no intermediate option.

## Goals

- Distinguish fast swipes from slow drags using velocity detection
- Allow swipes to skip intermediate states for fluid, native-feeling interaction
- Rename states for clarity and add a fourth content height
- Keep the 48px handle bar as a persistent UI element (not a state)

## Non-Goals

- Spring/momentum physics or inertia-based animations
- Gesture library integration (custom touch handlers are sufficient)
- Changes to desktop layout

## Design

### State Model

| State | Height | Index |
|-------|--------|-------|
| `collapsed` | handle bar only (48px) | 0 |
| `small` | 33dvh | 1 |
| `large` | 67dvh | 2 |
| `full` | 85dvh | 3 |

The 48px handle bar is always visible in all states (including collapsed). The sheet is fully hidden only when there's no synthesis content and nothing loading — controlled by the parent, not by a sheet state.

State renames from Spec 010:
- `peek` (48px bar) → `collapsed` (handle-bar-only, always visible when synthesis exists)
- `small` (33dvh) → `small` (33dvh)
- `expanded` (67dvh) → split into `large` (67dvh) and `full` (85dvh)

### Gesture Model

**Swipe (fast flick):**
- Detected by velocity: `|dy| / dt > 0.5 px/ms` AND `dt < 300ms`
- Jumps **2 states** in the flick direction (capped at bounds)
- Swipe up: `collapsed→large`, `small→full`, `large→full`
- Swipe down: `full→small`, `large→collapsed`, `small→collapsed`

**Drag (slow, deliberate release):**
- Velocity below threshold
- Snaps to **nearest breakpoint** by pixel distance (existing behavior from Spec 010)

**Tap handle bar:**
- From `collapsed` → `small`
- From `small` → `large`
- No tap behavior from `large` or `full` (user drags or swipes instead)

### Auto Behaviors

- **Auto-peek:** When synthesis is loading and sheet is `collapsed`, auto-transition to `small`
- **Editor focus shrink:** When editor gains focus and sheet is `full`, shrink to `large`

## File Inventory

| File | Change |
|------|--------|
| `src/components/SynthesisPanel.tsx` | State type rename, velocity detection in touch handlers, swipe-vs-drag logic, updated clamp range, tap behavior, height constants |
| `src/app/(app)/notes/[id]/page.tsx` | State name updates in auto-peek and editor focus handlers |

## Acceptance Criteria

- [x] `BottomSheetState` type is `"collapsed" | "small" | "large" | "full"`
- [x] Fast swipe up from `small` lands on `full` (skips `large`)
- [x] Fast swipe down from `full` lands on `small` (skips `large`)
- [x] Slow drag snaps to nearest breakpoint by pixel distance
- [x] Swipe velocity threshold is 0.5 px/ms with max 300ms gesture duration
- [x] Tap handle from `small` transitions to `large`
- [x] Drag clamp range extends to `full` (85dvh) — user can drag all the way up
- [x] Content renders in all non-collapsed states (small, large, full)
- [x] Auto-peek sets `small` (not old `peek`)
- [x] Editor focus shrinks `full` to `large` (not old `expanded` to `small`)
- [x] Desktop layout completely unchanged
- [x] `npm run build` passes with no type errors

## Open Questions

None — all resolved during implementation.

## Decision Log

- **Velocity-based gesture detection over gesture library:** Custom `touchstart`/`touchmove`/`touchend` with timestamp tracking is sufficient for swipe vs drag detection. Avoids a dependency for a single interaction pattern. See [ADR-006](../ADR/006-bottom-sheet-velocity-gestures.md).
- **2-state jump for swipes:** A swipe should feel like a decisive action. Jumping 2 states makes swipes distinct from drags (which move 0-1 states). Capping at bounds prevents overshooting.
- **33/67/85 dvh heights:** 33dvh (~1/3 screen) shows a quick glance of synthesis. 67dvh (~2/3 screen) is a comfortable reading height with editor still visible. 85dvh gives near-full-screen synthesis while keeping the status bar visible.
- **Collapsed shows handle bar, not hidden:** Users need a persistent affordance to re-open the sheet. Fully hiding it removes the ability to drag back up. The sheet is only truly hidden when there's no synthesis content at all (parent controls this).
- **300ms max gesture duration:** Prevents slow drags from being misclassified as swipes. A real flick gesture completes in under 300ms.

## References

- [Spec 010: Mobile & Tablet Responsive Layout](./010-mobile-responsive.md) — original implementation this spec revises
- [ADR-006: Velocity-Based Bottom Sheet Gestures](../ADR/006-bottom-sheet-velocity-gestures.md)
