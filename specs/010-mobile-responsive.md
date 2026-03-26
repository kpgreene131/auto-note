# Spec: Mobile & Tablet Responsive Layout

## Status

proposed

## Context

The app currently assumes a desktop viewport — the three-panel layout (sidebar, editor, synthesis) doesn't adapt to smaller screens. Notes are often captured on mobile or tablet, so the app needs to feel native on touch devices. This is also a portfolio piece, so responsive quality matters.

## Goals

- Make the full app usable on tablet and phone screens without horizontal scrolling or overlapping panels
- Synthesis panel: bottom sheet on mobile with peek/expand/full states and swipe gestures
- Notes sidebar: off-screen by default on mobile, slides in from left via hamburger icon or swipe-from-edge, auto-dismisses on content tap
- Increase touch target sizes for icons and interactive elements across all viewports
- Fix spacing/alignment issues in the header (settings gear too close to profile picture)

## Non-Goals

- Native mobile app or PWA wrapper
- Mobile-specific features (camera capture, voice input)
- Landscape tablet layout (use desktop layout for horizontal tablets)
- Redesigning the desktop layout — changes should be additive/responsive, not breaking

## Design

### 1. Breakpoint

**`768px`** (`md` in Tailwind) is the mobile/tablet cutoff. Below this, the mobile layout activates. Horizontal tablets and desktops get the existing side-by-side layout.

### 2. Synthesis Panel → Bottom Sheet (mobile)

On viewports below `768px`, the synthesis panel moves from a right sidebar to a **bottom sheet** anchored to the bottom of the screen.

**Three snap points:**
1. **Collapsed** — Hidden, no visible UI. Default state when no synthesis exists.
2. **Peek** — A small bar (~48px) at the bottom showing a one-line preview of the synthesis (first line or "Synthesizing..." with the pulse indicator). Visible whenever synthesis content exists or synthesis is loading. Has a drag handle at the top.
3. **Expanded** — Takes up ~2/3 of the screen height. The note editor shrinks to ~1/3 above it. Scrollable content area.

**Interactions:**
- Tap the peek bar → expand to full
- Swipe up on peek bar → expand
- Swipe down on expanded sheet → collapse to peek
- Drag the sheet edge to resize freely between peek and full height
- The chevron toggle button in the title bar is **hidden on mobile** — the bottom sheet replaces it

**Auto-peek:** When synthesis is loading and the sheet is collapsed, auto-transition to peek to show the loading indicator.

### 3. Notes Sidebar (mobile)

On mobile, the sidebar is **off-screen by default**.

**Opening:**
- Hamburger icon in the header (replaces or supplements the existing PanelLeftOpen icon)
- Swipe from left edge of screen

Both methods are always available — user can use whichever feels natural.

**Behavior when open:**
- Sidebar slides in from the left
- Main content pushes to the right (not overlay — content shifts)
- Transition: ~200ms ease-out for snappy feel

**Closing:**
- Tap anywhere on the main content area → auto-collapse (mobile only)
- Tap the hamburger/close icon
- Swipe left on sidebar

### 4. Touch Target & Spacing Improvements (all viewports)

**Header icons:**
- Increase icon button sizes slightly — currently the collapse toggle, palette, settings gear, and profile picture are small for touch
- Fix spacing: settings gear is visually too close to the profile picture. Add consistent gap between all header items

**Title bar:**
- Increase vertical padding on the note title bar — currently `h-10` (40px), increase to `h-12` (48px) on all viewports
- The contentEditable title gets a larger tap target with more padding

**General:**
- All interactive elements should have a minimum tap target of 44x44px on touch devices (Apple HIG guideline)
- On desktop, current sizes can remain but the title bar padding increase applies everywhere

### 5. Hidden/Adapted Elements on Mobile

| Element | Desktop | Mobile |
|---------|---------|--------|
| Synthesis chevron toggle | Visible in title bar | Hidden (bottom sheet replaces it) |
| Sidebar | Collapsible side panel | Off-screen, push-right slide-in |
| Sidebar collapse icon | PanelLeftOpen/Close | Hamburger menu icon |
| Synthesis panel | Right sidebar with drag resize | Bottom sheet with snap points |
| Header icon sizes | Current | Slightly larger tap targets |

## File Inventory

Modified files (estimated):

| File | Change |
|------|--------|
| `src/components/AppShell.tsx` | Mobile sidebar behavior: off-screen default, push-right animation, tap-to-dismiss, hamburger icon |
| `src/components/Sidebar.tsx` | Responsive width, swipe-from-edge gesture, transition animations |
| `src/components/SynthesisPanel.tsx` | Bottom sheet mode on mobile: peek/expand/full, swipe gestures, drag resize, auto-peek on loading |
| `src/app/(app)/notes/[id]/page.tsx` | Hide chevron on mobile, pass mobile state to SynthesisPanel, adjust layout for bottom sheet |
| `src/components/UserBadge.tsx` | Fix spacing between settings gear and profile picture |
| `src/components/ThemeSwitcher.tsx` | Larger tap target |

Possibly new:

| File | Purpose |
|------|---------|
| `src/hooks/useMediaQuery.ts` | Hook to detect mobile breakpoint (`< 768px`) |
| `src/hooks/useSwipeGesture.ts` | Reusable swipe detection for sidebar and bottom sheet (if complexity warrants extraction) |

## Acceptance Criteria

- [ ] Below 768px viewport, synthesis panel renders as a bottom sheet instead of right sidebar
- [ ] Bottom sheet has three states: collapsed, peek, expanded
- [ ] Swipe up on peek → expand, swipe down on expanded → peek
- [ ] Bottom sheet is draggable to resize between peek and full height
- [ ] Auto-peek when synthesis starts loading from collapsed state
- [ ] Peek bar shows one-line synthesis preview or loading indicator
- [ ] Chevron toggle hidden on mobile viewports
- [ ] Notes sidebar is off-screen by default on mobile
- [ ] Hamburger icon in header opens sidebar on mobile
- [ ] Swipe from left edge opens sidebar on mobile
- [ ] Sidebar pushes main content right when open (not overlay)
- [ ] Tapping main content area auto-closes sidebar (mobile only)
- [ ] Note title bar height increased to 48px on all viewports
- [ ] Header icons have adequate touch targets (≥44px)
- [ ] Settings gear spacing fixed relative to profile picture
- [ ] Desktop layout unchanged — all changes are additive via responsive breakpoints
- [ ] Horizontal tablet (landscape) uses desktop layout

## Open Questions

- **Swipe gesture library vs custom?** Could use a lightweight library like `@use-gesture/react` or roll our own with touch events. Custom is simpler for two-direction swipes but a library handles edge cases (velocity, inertia, scroll conflicts).
- **Bottom sheet snap physics:** Should the snap between peek/expanded feel springy (momentum-based) or rigid (snap immediately)? Springy feels more native but adds complexity.
- **Recently Deleted on mobile:** The collapsible trash section in the sidebar works fine on desktop. On mobile where sidebar auto-closes on tap, navigating trash items could be awkward. May need a dedicated trash view or keep sidebar open when interacting with trash.

## Decision Log

- **768px breakpoint over 640px:** Tablet users benefit from the mobile layout too — a 768px iPad in portrait doesn't have room for sidebar + editor + synthesis side-by-side. Landscape tablets get the desktop layout.
- **Push-right over overlay for sidebar:** Overlay hides context and feels like a modal. Push-right keeps spatial awareness — you can see the content shifting, which feels more like rearranging panels than opening a dialog.
- **Three snap points over two:** Collapsed + peek + expanded gives the user more control. Peek is the "I want to glance at synthesis without losing my editor" state, which is the most common mobile use case.
- **Both hamburger and swipe-from-edge:** Different users have different muscle memory. Having both costs nothing and prevents frustration.

## References

- GitHub Issue #15 — Make app responsive and mobile-friendly
- [Apple HIG: Touch targets](https://developer.apple.com/design/human-interface-guidelines/accessibility#Touch-targets)
- [Spec 009: AI Synthesis](./009-ai-synthesis.md) — SynthesisPanel that this spec adapts for mobile
