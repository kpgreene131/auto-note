# Spec: Touch & Gesture Overhaul — Viewport-Locked Layout

## Status

in-progress

## Context

Testing on iPhone + Chrome after specs 010/011 revealed that most mobile gesture/layout bugs share a single root cause: **the page itself is scrollable**. The synthesis panel uses `position: fixed` and the editor height is calculated independently via `calc(100dvh - 6rem - sheetHeight)`. These two systems go out of sync during drag and snap transitions, causing:

- **Dark gap** between editor and synthesis after snap (editor animates over 200ms while sheet snaps instantly)
- **Whole-page scrolling** during sheet drag (sheet grows via fixed positioning but editor hasn't shrunk, total content exceeds viewport)
- **Synthesis scroll lock-up** (page scroll animation steals scroll context from synthesis content)
- **Pull-to-refresh triggering** (page is scrollable, Chrome intercepts overscroll)
- **Sidebar content scrolling the page** instead of scrolling within itself

Additionally, the sidebar **left-edge swipe to open** is unusable on iOS — the browser owns that gesture for back-navigation and cannot be overridden.

See: [Testing findings](../temp/gesture-testing-findings.md), GitHub #23–#28.

## Goals

1. **Viewport-locked page**: The app fills the screen exactly. No page-level scroll. `html`/`body` have `overflow: hidden`, height locked to `100dvh`.
2. **Flexbox layout**: Editor and synthesis are in-flow siblings in a `flex-col` container. Editor is `flex: 1`. Synthesis has an explicit height. No `position: fixed`, no `calc()`.
3. **Component-internal scroll**: Editor, synthesis content, and sidebar each scroll within their own container via `overflow-y: auto`.
4. **No sync bugs**: Because the editor's height is `flex: 1` (remaining space), it is always exactly `viewport - header - synthesis`. No transition mismatch, no gap.
5. **Drop sidebar edge-swipe-to-open**: Remove the left-edge swipe gesture. Keep swipe-left-to-close. Rely on hamburger icon to open.
6. **Sidebar viewport-locked**: Sidebar sits under the header, ends at screen bottom, scrolls within. "Recently Deleted" stays sticky at the bottom.

## Non-Goals

- Changes to desktop layout (desktop already uses flexbox sidebar)
- New gesture types (pinch, long-press, etc.)
- Spring physics or momentum-based animations
- Editor input issues (line spacing, iOS keyboard, autofill — tracked in #29–#32)
- Stale synthesis indicator (#33)

## Design

### Layout Hierarchy (Mobile)

```
html/body — overflow: hidden, height: 100dvh
└── AppShell — flex flex-col h-[100dvh]
    ├── Header — h-12 shrink-0, always present
    └── main — flex flex-1 min-h-0
        ├── Sidebar (when open)
        │   └── overflow-y-auto, sticky footer for "Recently Deleted"
        └── Note page — flex flex-col flex-1 min-h-0
            ├── Title bar — shrink-0
            ├── Editor — flex-1 min-h-0 overflow-y-auto
            └── SynthesisPanel — shrink-0, explicit height
                ├── Handle bar — 48px, touch target for drag
                └── Content — flex-1 overflow-y-auto (when not collapsed)
```

Key change: **SynthesisPanel is no longer `position: fixed`**. It's a flex child with an explicit height. The editor takes whatever space remains via `flex: 1`.

### Synthesis Panel Heights

Same states as spec 011, but expressed as flex-friendly values:

| State | Height | Notes |
|-------|--------|-------|
| `collapsed` | `48px` | Handle bar only |
| `small` | `33dvh` | ~1/3 screen |
| `large` | `67dvh` | ~2/3 screen |
| `full` | `100%` of container | Editor hidden |

When `full`: the editor container gets `hidden` (overflow: hidden, h-0, or display: none) so it doesn't try to maintain scroll state or receive touches.

### Drag Behavior

**During drag** (touchmove):
- Sheet height is set directly on the DOM (`sheetRef.style.height = px`) — same as current
- Editor shrinks in real-time via flex: as the sheet grows, the editor's `flex: 1` naturally gives it less space
- This is fine because the editor text doesn't visually jump — content that goes below the shrinking boundary is just overflow, the visible text stays in place
- `touch-action: none` on the handle bar to prevent page scroll during drag

**On release** (touchend):
- Sheet snaps to target state height (with ~150ms ease-out transition)
- Parent state updates → React re-renders
- No gap possible since they're flex siblings — the editor is always exactly the remaining space

**Key difference from current**: No `position: fixed`, no `calc()`, no two-system sync. The flexbox is the single source of truth for layout. The editor doesn't need its own height transition — it follows the sheet's transition automatically via flex.

### Page Scroll Prevention

```css
html, body {
  overflow: hidden;
  height: 100dvh;
  /* Prevent pull-to-refresh */
  overscroll-behavior: none;
}
```

Additionally, on the handle bar:
```css
.sheet-handle {
  touch-action: none; /* prevent any browser gesture on this element */
}
```

This eliminates page scroll, pull-to-refresh, and overscroll interference globally.

### Sidebar Changes

1. **Remove** left-edge swipe-to-open gesture from AppShell
2. **Keep** swipe-left-to-close gesture (works fine, no iOS conflict)
3. **Keep** hamburger icon as primary open trigger
4. **Fix sidebar scroll**: `overflow-y: auto` on sidebar content, not on the page
5. **Sticky footer**: "Recently Deleted" section uses `sticky bottom-0` or is positioned outside the scroll container

### Gesture Map (Final)

| Gesture | Where | Action |
|---------|-------|--------|
| Tap hamburger icon | Header | Open sidebar |
| Swipe left | Anywhere (when sidebar open) | Close sidebar |
| Tap handle bar | Synthesis handle | Cycle: collapsed → small → large |
| Drag handle bar (vertical) | Synthesis handle | Resize sheet freely |
| Swipe handle bar (fast flick) | Synthesis handle | Jump 2 states |
| Scroll (vertical) | Editor area | Scroll note content within editor |
| Scroll (vertical) | Synthesis content | Scroll synthesis within panel |
| Scroll (vertical) | Sidebar | Scroll sidebar within panel |
| Tap editor area | Editor | Focus editor, collapse sheet if full |

**Removed**: Left-edge swipe to open sidebar.

## File Inventory

| File | Change |
|------|--------|
| `src/app/globals.css` | Add `overflow: hidden`, `height: 100dvh`, `overscroll-behavior: none` to html/body |
| `src/app/(app)/notes/[id]/page.tsx` | Replace calc-based editor height with flex layout; remove `transition-[height]` from editor; synthesis panel is now in-flow flex child |
| `src/components/SynthesisPanel.tsx` | Remove `fixed inset-x-0 bottom-0`; render as flex child with explicit height; add `touch-action: none` on handle; hide editor content in `full` state |
| `src/components/AppShell.tsx` | Remove swipe-to-open gesture; fix sidebar to be viewport-locked with internal scroll; sticky "Recently Deleted" |
| `src/hooks/useSwipeGesture.ts` | No changes expected (still used for swipe-to-close sidebar) |

## Acceptance Criteria

- [ ] `html`/`body` have `overflow: hidden` and `overscroll-behavior: none` — page cannot scroll
- [ ] Editor and synthesis are flex siblings — no `position: fixed` on synthesis, no `calc()` on editor
- [ ] Dragging synthesis handle does NOT scroll the page
- [ ] No dark gap appears between editor and synthesis during or after drag/snap
- [ ] Synthesis content scrolls independently within its container
- [ ] Editor content scrolls independently within its container
- [ ] Pull-to-refresh does NOT trigger during any gesture
- [ ] Sidebar scrolls within its container, does not scroll the page
- [ ] "Recently Deleted" is sticky at the bottom of the sidebar
- [ ] Left-edge swipe to open sidebar is removed
- [ ] Swipe-left to close sidebar still works
- [ ] All four sheet states (collapsed, small, large, full) work correctly
- [ ] In `full` state, editor content is hidden (not just zero-height with scroll state)
- [ ] Velocity-based swipe detection still works (spec 011 behavior preserved)
- [ ] Desktop layout is unchanged
- [ ] `npm run build` passes with no type errors

## Open Questions

None — all resolved.

## Decision Log

- **Flexbox over fixed positioning**: `position: fixed` creates two independent layout systems that must be manually synced. Flexbox makes them one system. Eliminates the entire class of gap/sync bugs.
- **Editor resizes in real-time during drag**: Since both are flex siblings, the editor naturally shrinks as the sheet grows. The visible text doesn't jump — content below the boundary is overflow. This feels connected and correct for a flex layout. No need for overlay hacks or freezing the editor height.
- **Drop sidebar edge swipe**: iOS Chrome/Safari own the left-edge gesture for back-navigation. Cannot be overridden at any edge zone width. Hamburger icon is reliable.
- **Global overflow hidden**: Fixes page scroll, pull-to-refresh, and sidebar scroll issues all at once. Components manage their own scroll.
- **Short transition on snap**: ~150ms ease-out on the synthesis panel height during snap. Editor adjusts via flex — no transition needed on the editor, it follows naturally.
- **Swipe down to exit full state**: Editor is already hidden in full state (current behavior). Swipe down on the handle is sufficient to exit — no additional close button or tap behavior needed.

## References

- [Spec 010: Mobile Responsive Layout](./010-mobile-responsive.md)
- [Spec 011: Bottom Sheet Gesture Rework](./011-bottom-sheet-gestures.md)
- [Testing findings](../temp/gesture-testing-findings.md)
- GitHub: #23 (umbrella), #24–#28 (individual issues)
