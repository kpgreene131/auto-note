# Spec: Wire UI to API Routes

## Status

proposed

## Context

The UI prototype (spec 002) runs on hardcoded mock data imported from `src/mock/notes.ts`. The API routes (spec 004) are implemented and tested against a real Postgres database. This spec replaces mock data with real API calls, making the app functional end-to-end.

The mock data uses a `MockNote` interface with plain string content. The database stores Tiptap JSON in a `jsonb` column. This transition requires updating how content flows between components.

## Goals

- Replace all mock data imports with real API calls
- Add note creation, editing (auto-save), and deletion to the UI
- Persist theme preference to the database (in addition to localStorage)
- Display real user data (display name) in the UserBadge
- Remove `src/mock/notes.ts`

## Non-Goals

- AI synthesis triggering (spec #7)
- Optimistic UI updates or SWR/React Query (add if needed later — start simple)
- Offline support or service workers
- Real-time collaboration or polling for changes
- Settings page implementation (just the UserBadge and ThemeSwitcher for now)

## Data Fetching Strategy

Components marked `"use client"` (Sidebar, NotePage, ThemeSwitcher, UserBadge) run in the browser and cannot import server-only code like Kysely/pg. They use **client-side `fetch`** to call the API routes. The home page (`src/app/page.tsx`) is a server component — it runs on the server and can query Postgres directly via the Kysely client, avoiding an HTTP round-trip just to determine the redirect target.

No data fetching library (SWR, React Query) for now. Plain `fetch` + `useState`/`useEffect` is sufficient for an MVP with a single user and few notes. Add a library if the fetch logic becomes painful.

### API client helper

Create `src/lib/api.ts` with typed wrapper functions to avoid raw `fetch` boilerplate in every component:

```typescript
// src/lib/api.ts
export async function fetchNotes(): Promise<Note[]>
export async function fetchNote(id: string): Promise<Note>
export async function createNote(body?: { title?: string; content?: unknown }): Promise<Note>
export async function updateNote(id: string, body: { title?: string; content?: unknown; synthesis?: string }): Promise<Note>
export async function deleteNote(id: string): Promise<void>
export async function fetchCurrentUser(): Promise<User>
export async function updateCurrentUser(body: { display_name?: string; color_theme?: string }): Promise<User>
```

Each function calls the corresponding API route, checks `response.ok`, and throws on error. Components call these instead of raw `fetch`.

## Component Changes

### `src/app/page.tsx` (Home)

**Currently:** imports `mockNotes`, redirects to first mock note.

**Change:** Query the database directly (server component) via `getCurrentUser` + Kysely to find the most recent note. If no notes exist, render the empty state. This avoids a client-side fetch just to redirect.

```typescript
import { db } from '@/db'
import { getCurrentUser } from '@/db/queries'

export default async function Home() {
  const user = await getCurrentUser()
  const firstNote = await db.selectFrom('notes')
    .select('id')
    .where('user_id', '=', user.id)
    .orderBy('updated_at', 'desc')
    .limit(1)
    .executeTakeFirst()

  if (firstNote) redirect(`/notes/${firstNote.id}`)
  // else render empty state
}
```

### `src/components/Sidebar.tsx`

**Currently:** imports `mockNotes`, maps over them statically.

**Changes:**
- Fetch notes from `fetchNotes()` on mount via `useEffect`
- Store in `useState<Note[]>`
- "New Note" button calls `createNote()`, then navigates to the new note via `router.push`
- Add a loading skeleton while notes load
- Accept an `onNotesChange` callback or use a simple refetch pattern so the sidebar updates after create/delete
- Display `note.title ?? "Untitled"` (titles can be null)
- Content preview: use Tiptap's built-in `generateText()` from `@tiptap/core` to extract plain text from JSON for the preview snippet, or show "Empty note" if no content
- Add a trash icon on each note item for deletion (with confirmation modal). On delete: call `deleteNote(id)`, re-fetch the note list, navigate to the next note or home if none remain
- Date display: use `note.updated_at` (snake_case from API, not camelCase)

### `src/app/notes/[id]/page.tsx` (NotePage)

**Currently:** imports `mockNotes`, finds note by ID with `.find()`.

**Changes:**
- Fetch single note from `fetchNote(id)` on mount
- Handle loading state (skeleton or spinner)
- Handle 404 (note not found) — show error message
- Pass fetched note data to `NoteEditor` and `SynthesisPanel`
- Content is now Tiptap JSON (object), not a plain string — pass directly to TipTap editor

### `src/components/NoteEditor.tsx`

**Currently:** receives `content: string`, renders TipTap editor, read-only in practice (no save).

**Changes:**
- Change prop type from `content: string` to `content: unknown` (Tiptap JSON from DB)
- Add `onUpdate` prop or accept `noteId` and handle saving internally
- **Auto-save with debounce:** save content via `updateNote(id, { content })` after the user stops typing for ~1 second
- Use TipTap's `onUpdate` callback to trigger the debounced save
- Show a subtle save indicator (e.g., "Saving..." / "Saved" text in the title bar)
- **Inline editable title** at the top of the main content area using `contentEditable`. Save title changes via the same `updateNote` call, also debounced.

### `src/components/SynthesisPanel.tsx`

**Currently:** receives `markdown: string`, renders with react-markdown.

**Change:** Handle `markdown: null` gracefully — show an empty state like "No synthesis yet" instead of rendering null. The `synthesis` field is nullable in the database.

### `src/components/ThemeSwitcher.tsx`

**Currently:** persists theme to `localStorage` only.

**Change:** After setting localStorage, also call `updateCurrentUser({ color_theme: themeId })` to persist to the database. On mount, prefer the API value if available (fetch user, use their `color_theme`), fall back to localStorage for instant load before the API responds.

### `src/components/UserBadge.tsx`

**Currently:** hardcoded "KG" avatar fallback.

**Change:** Fetch user via `fetchCurrentUser()` on mount. Derive initials from `display_name` (e.g., "Default User" → "DU"). Fall back to "?" if no display name.

## Content Format Transition

The mock data uses plain strings for `content`. The database stores Tiptap JSON (`jsonb`). Key differences:

| | Mock | Database |
|---|---|---|
| Content type | `string` | Tiptap JSON (`{ type: "doc", content: [...] }`) |
| Editor init | TipTap parses string as HTML/text | TipTap accepts JSON directly |
| Preview text | `content.slice(0, 60)` | Extract first text node from JSON tree |

TipTap's `useEditor` accepts both strings and JSON objects as `content`, so the editor itself handles this seamlessly. The sidebar preview is the main place that needs a helper to extract plain text from Tiptap JSON.

### Plain text extraction

Tiptap provides a built-in `generateText()` function in `@tiptap/core` that converts JSON content to plain text without requiring an editor instance:

```typescript
import { generateText } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'

const preview = generateText(note.content, [StarterKit]).slice(0, 60)
```

No custom helper needed — use this directly in the Sidebar for note previews.

## File Inventory

New files:
| File | Purpose |
|------|---------|
| `src/lib/api.ts` | Typed API client wrapper functions |

Modified files:
| File | Change |
|------|--------|
| `src/app/page.tsx` | Replace mock import with server-side DB query |
| `src/components/Sidebar.tsx` | Fetch notes from API, wire up "New Note" button |
| `src/app/notes/[id]/page.tsx` | Fetch note from API, pass Tiptap JSON to editor |
| `src/components/NoteEditor.tsx` | Accept JSON content, add debounced auto-save |
| `src/components/SynthesisPanel.tsx` | Handle null synthesis |
| `src/components/ThemeSwitcher.tsx` | Persist theme to API |
| `src/components/UserBadge.tsx` | Fetch and display real user data |

Deleted files:
| File | Reason |
|------|--------|
| `src/mock/notes.ts` | Replaced by real API data |

## Save Indicator UX

The title bar for a note currently shows the title and a collapse button. Add a small save status indicator:

- **Idle:** nothing shown
- **Saving:** "Saving..." in muted text
- **Saved:** "Saved" briefly, then fades out
- **Error:** "Save failed" in red, stays visible

This is a simple state machine: `idle → saving → saved → idle` (or `idle → saving → error`).

## Acceptance Criteria

- [ ] App loads with no mock data imports — `src/mock/notes.ts` is deleted
- [ ] Sidebar lists notes from the database, ordered by most recently updated
- [ ] "New Note" button creates a note via API and navigates to it
- [ ] Clicking a note in the sidebar loads it from the API
- [ ] Editing a note title or content auto-saves after a debounce
- [ ] Save status indicator shows saving/saved/error states
- [ ] Trash icon on sidebar notes opens a confirmation modal before deleting
- [ ] Deleting a note removes it, re-fetches sidebar, and navigates to next note or home
- [ ] Synthesis panel shows "No synthesis yet" when synthesis is null
- [ ] ThemeSwitcher persists theme to both localStorage and the API
- [ ] UserBadge displays initials from the user's display name
- [ ] Home page redirects to most recent note or shows empty state (from DB, not mock)
- [ ] Loading states shown while data is being fetched
- [ ] 404 handling when navigating to a non-existent note ID

## Design Decisions

- **No data fetching library** — plain `fetch` + hooks for MVP. The app has one user and few notes; caching and deduplication aren't worth a dependency yet.
- **API client module (`src/lib/api.ts`)** — centralizes fetch logic and types, keeps components clean, easy to swap for a library later. Will earn its keep when auth adds token injection.
- **Server-side redirect on home page** — `page.tsx` is a server component so it can query Postgres directly, avoiding a client-side fetch + loading flash just to figure out where to redirect.
- **Debounced auto-save over explicit save button** — matches user expectations for a modern note-taking app. No "unsaved changes" warnings needed.
- **localStorage + API for theme** — localStorage for instant theme on page load (no flash of wrong theme), API for persistence across devices.
- **Tiptap built-in `generateText()`** — no custom plain text extraction helper needed. Tiptap ships this in `@tiptap/core`.
- **Inline `contentEditable` for title editing** — feels natural for a note-taking app, lives at the top of the main content area.
- **Trash icon on sidebar notes with confirmation modal** — discoverable, low-risk (confirmation prevents accidents).
- **Re-fetch sidebar after create/delete** — simpler than local state mutation, guarantees consistency with the database.

## References

- [Spec 002: UI Prototype](./002-ui-prototype.md)
- [Spec 004: API Routes](./004-api-routes.md)
- [GitHub Issue #7: Core feature: note input and AI synthesis](https://github.com/kpgre/auto-note/issues/7)
- [TipTap documentation: getJSON / content format](https://tiptap.dev/docs/editor/guide/output)
