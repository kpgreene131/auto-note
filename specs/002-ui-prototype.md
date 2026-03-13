# Spec: UI Prototype — Core Layout and Components

## Status

approved

## Context

Auto-note is a note-taking app where users capture unstructured/messy notes and AI synthesizes them into clean, organized summaries. Before building features, we need to establish the core layout and visual language. This prototype defines the spatial arrangement and key components — the result becomes the foundation for STYLE.md and all future UI work.

The layout draws inspiration from apps like Apple Notes, OneNote, and Claude's artifact panel.

## Goals

- Define a single-page layout with three primary regions: sidebar, editor, and synthesis preview
- Build working React components for each region using static/mock data
- Establish the visual aesthetic and component patterns that become the project's style guide
- Keep it simple — this is a scaffold, not a feature-complete app

## Layout

The app uses a persistent shell (header + sidebar) with swappable main content. This mirrors the Claude desktop pattern — the sidebar is always visible for navigation, and route changes only replace the content area.

```
┌──────────────────────────────────────────────────────┐
│  User identity                              [Settings]│
├────────────┬─────────────────────────────────────────┤
│            │                                         │
│  Sidebar   │   Main Content Area                     │
│            │   (swaps per route)                     │
│ [+ New]    │                                         │
│            │   /notes/[id] → NoteEditor + Synthesis  │
│  Note list │   /settings   → Settings content        │
│            │   /            → empty / redirect        │
│  (future:  │                                         │
│   labels,  │                                         │
│   tags,    │                                         │
│   folders) │                                         │
│            │                                         │
├────────────┴─────────────────────────────────────────┤
└──────────────────────────────────────────────────────┘
```

### Route Structure

```
app/
  layout.tsx          ← persistent shell: header (user badge) + sidebar
  page.tsx            ← landing: empty state or redirect to first note
  notes/
    [id]/
      page.tsx        ← note view: editor + synthesis panel
  settings/
    page.tsx          ← settings (replaces editor + synthesis, sidebar stays)
```

The root `layout.tsx` owns the header and sidebar. Child routes render into the main content area. This means the sidebar and user identity never unmount during navigation.

### Active Note State — URL-Driven

The active note is determined by the URL (`/notes/[id]`), not React state or context. This gives us:
- **Bookmarkable/shareable links** — copy a URL to revisit a specific note
- **Browser back/forward** works naturally
- **No custom state management** — the URL is the source of truth
- **Sidebar highlighting** — reads `usePathname()` to know which note is active

Clicking a note in the sidebar is a `<Link href="/notes/{id}">`. The `notes/[id]/page.tsx` receives `params.id` and looks up the note.

### Header
- Contains user identity (avatar/name/initials) and settings link
- Always visible, part of root layout

### Sidebar
- Note list showing titles/previews, ordered by recency
- "New Note" action at top
- Later: labels, tags, organization/folders, search
- Visually similar to a chat list (Claude, ChatGPT, Apple Notes)
- Always visible, part of root layout

### Note Editor (main content — `/`)
- Primary focus of the screen — takes the most space
- Plain text entry with basic formatting support (bold, italic, bulleted lists, headings)
- Input is intentionally low-friction — messy notes, stream of consciousness, speech-to-text dumps
- No rich-text WYSIWYG needed initially; lightweight markdown-ish formatting is fine

### Synthesis Panel (main content — `/`, beside editor)
- Displays AI-generated summary as rendered markdown
- Positioned to the right of the editor (alternative: below, TBD during prototyping)
- Collapsible/expandable — can be minimized by default and expanded on demand
- Read-only; content is generated on the backend

## Pages

- **Main page** (`/`) — note editor + synthesis panel side by side
- **Settings page** (`/settings`) — replaces the main content area; sidebar remains visible

## Project Structure

```
src/
  app/
    layout.tsx              ← root layout (header + sidebar + content slot)
    page.tsx                ← landing (empty state / redirect)
    globals.css             ← global styles / Tailwind
    notes/
      [id]/
        page.tsx            ← note view (editor + synthesis)
    settings/
      page.tsx              ← settings (future, placeholder for now)
    components/
      Sidebar.tsx
      NoteEditor.tsx
      SynthesisPanel.tsx
      UserBadge.tsx
  mock/
    notes.ts                ← mock note data (deleted once real data layer exists)
```

Components live in `src/app/components/` — flat structure, no subdirectories needed at this scale. Mock data lives in `src/mock/` and will be removed when we connect real storage.

## Components

| Component | Description | Data | Key Dependencies |
|-----------|-------------|------|-----------------|
| `Sidebar` | Note list + new-note action | List of notes (title, snippet, date) | shadcn ScrollArea, Button |
| `NoteEditor` | Rich text editor with basic formatting | Current note content | Tiptap (`@tiptap/react`, StarterKit) |
| `SynthesisPanel` | Rendered markdown preview, collapsible | Synthesized markdown string | `react-markdown` |
| `UserBadge` | User avatar/initials + name, top-right | User name/avatar | shadcn Avatar |

## Dependencies to Add

| Package | Purpose |
|---------|---------|
| `@tiptap/react` | React bindings for Tiptap editor |
| `@tiptap/pm` | ProseMirror core (Tiptap peer dep) |
| `@tiptap/starter-kit` | Battery-included extensions: bold, italic, headings, lists, code, blockquote, undo/redo |
| `react-markdown` | Render markdown strings in SynthesisPanel |
| `@tailwindcss/typography` | Provides `prose` classes used by NoteEditor and SynthesisPanel for styled text rendering |
| `shadcn` (init + components) | UI component library — Button, Avatar, ScrollArea, icons (Lucide) |

## Server vs Client Components

The root `layout.tsx` is a **Server Component** (Next.js default) — it renders the HTML shell, imports the sidebar and header. However, most leaf components are **Client Components** (`'use client'`):

- **`NoteEditor`** — must be client. Tiptap manipulates the DOM and uses browser APIs. Requires `immediatelyRender: false` to avoid SSR hydration mismatch.
- **`SynthesisPanel`** — client, because it has interactive collapse/expand state.
- **`Sidebar`** — client, because selecting a note updates shared state (which note is active).
- **`UserBadge`** — could be server, but will be client once auth is wired up.

SSR isn't providing value in this prototype since all data is mock/local. It becomes meaningful when we have a real database — the sidebar note list and synthesis content could be server-fetched. For now, everything renders client-side and that's fine.

## Mock Data

Mock data lives in `src/mock/notes.ts` as a typed array. This file gets deleted when real storage is connected. Each mock note includes raw content (for the editor) and a synthesized markdown string (for the preview panel).

```ts
// src/mock/notes.ts
export interface MockNote {
  id: string
  title: string
  content: string           // raw note text (editor content)
  synthesis: string         // markdown string (AI-generated summary)
  updatedAt: string         // ISO date string
}

export const mockNotes: MockNote[] = [
  {
    id: '1',
    title: 'Meeting Notes — Project Kickoff',
    content: 'discussed timeline, Q3 launch target, need to finalize tech stack...',
    synthesis: '## Project Kickoff Summary\n\n- **Timeline:** targeting Q3 launch\n- **Next steps:** finalize tech stack by EOW\n- **Owner:** @team-lead',
    updatedAt: '2026-03-13T10:30:00Z',
  },
  {
    id: '2',
    title: 'Research: Auth Options',
    content: 'looked at nextauth vs clerk vs custom. clerk is simpler but vendor lock...',
    synthesis: '## Auth Research\n\n### Options Compared\n| Option | Pros | Cons |\n|--------|------|------|\n| NextAuth | OSS, flexible | More setup |\n| Clerk | Simple, fast | Vendor lock-in |\n\n**Recommendation:** defer decision until MVP scope is clearer.',
    updatedAt: '2026-03-12T16:00:00Z',
  },
  // ... more notes
]
```

## File Stubs

### `src/app/layout.tsx` — Root Layout (Server Component)

```tsx
import type { Metadata } from 'next'
import './globals.css'
import { Sidebar } from './components/Sidebar'
import { UserBadge } from './components/UserBadge'

export const metadata: Metadata = {
  title: 'Auto-Note',
  description: 'AI-powered note synthesis',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* Full-height flex layout */}
        <div className="flex h-screen">
          {/* Sidebar — fixed width, full height */}
          <aside className="w-64 border-r flex flex-col">
            <Sidebar />
          </aside>

          {/* Main area — header + content */}
          <div className="flex-1 flex flex-col">
            {/* Header bar */}
            <header className="h-12 border-b flex items-center justify-end px-4 gap-2">
              {/* Settings gear icon + user badge, top-right */}
              <UserBadge />
            </header>

            {/* Page content — swaps per route */}
            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  )
}
```

**Why this structure:** The outer `flex h-screen` creates a full-viewport layout. The sidebar is a fixed-width column. The right side stacks a thin header over the routed content area. `children` is the Next.js slot — `page.tsx` or `settings/page.tsx` renders here.

### `src/app/page.tsx` — Landing Page (Server Component)

```tsx
import { redirect } from 'next/navigation'
import { mockNotes } from '@/mock/notes'

export default function Home() {
  // Redirect to the first note, or show empty state
  if (mockNotes.length > 0) {
    redirect(`/notes/${mockNotes[0].id}`)
  }

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p>No notes yet. Create one to get started.</p>
    </div>
  )
}
```

**Why server component:** No interactivity needed — just a redirect or empty state. The redirect happens server-side before the page even renders.

### `src/app/notes/[id]/page.tsx` — Note View (Client Component)

```tsx
'use client'

import { use } from 'react'
import { NoteEditor } from '@/app/components/NoteEditor'
import { SynthesisPanel } from '@/app/components/SynthesisPanel'
import { mockNotes } from '@/mock/notes'

export default function NotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const note = mockNotes.find((n) => n.id === id)

  if (!note) {
    return <div className="p-4 text-muted-foreground">Note not found.</div>
  }

  return (
    <div className="flex h-full">
      {/* Editor takes majority of space */}
      <div className="flex-1 p-4">
        <NoteEditor content={note.content} />
      </div>

      {/* Synthesis panel — right side, collapsible */}
      <SynthesisPanel markdown={note.synthesis} />
    </div>
  )
}
```

**Why `'use client'`:** The editor and synthesis panel are both interactive client components. The page receives `params.id` from the URL segment (`/notes/[id]`) and looks up the note. In Next.js 16, `params` is a Promise that we unwrap with `use()`.

**No shared state needed:** The sidebar reads `usePathname()` to highlight the active note. This page reads `params.id` to load the note. The URL is the single source of truth — no context, no store, no prop drilling.

### `src/app/components/Sidebar.tsx`

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { mockNotes } from '@/mock/notes'
// shadcn: ScrollArea, Button

export function Sidebar() {
  const pathname = usePathname()

  return (
    <>
      {/* New Note button */}
      <div className="p-2">
        <button className="w-full">+ New Note</button>
      </div>

      {/* Note list */}
      <nav className="flex-1 overflow-y-auto">
        {mockNotes.map((note) => {
          const isActive = pathname === `/notes/${note.id}`
          return (
            <Link
              key={note.id}
              href={`/notes/${note.id}`}
              className={`block p-3 border-b hover:bg-muted ${isActive ? 'bg-muted' : ''}`}
            >
              <div className="font-medium text-sm truncate">{note.title}</div>
              <div className="text-xs text-muted-foreground truncate">
                {note.content.slice(0, 60)}...
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(note.updatedAt).toLocaleDateString()}
              </div>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
```

**Why client:** `usePathname()` is a client hook — needed to highlight the active note based on the current URL. Note selection is just a `<Link>` — no state management needed.

### `src/app/components/NoteEditor.tsx`

```tsx
'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'

interface NoteEditorProps {
  content: string
}

export function NoteEditor({ content }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false, // required for Next.js — avoids SSR hydration mismatch
  })

  return (
    <div className="h-full">
      <EditorContent editor={editor} className="prose max-w-none h-full" />
    </div>
  )
}
```

**Why `immediatelyRender: false`:** Tiptap creates a ProseMirror EditorView which requires the DOM. Setting this to `false` tells Tiptap to skip rendering during SSR and only mount in the browser, preventing hydration mismatches.

**StarterKit includes:** Bold, Italic, Strike, Code, Headings (1-6), BulletList, OrderedList, Blockquote, CodeBlock, HorizontalRule, Undo/Redo. This covers all the basic formatting needs.

**Content sync caveat:** Tiptap does not re-render when the `content` prop changes. When the user navigates between notes (URL change), the implementer must call `editor.commands.setContent(newContent)` in a `useEffect` watching the `content` prop. Without this, switching notes will show stale content from the previous note.

### `src/app/components/SynthesisPanel.tsx`

```tsx
'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'

interface SynthesisPanelProps {
  markdown: string
}

export function SynthesisPanel({ markdown }: SynthesisPanelProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={`border-l transition-all ${collapsed ? 'w-10' : 'w-96'}`}>
      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-2 w-full text-left"
      >
        {collapsed ? '▶' : '◀'}
      </button>

      {/* Markdown content */}
      {!collapsed && (
        <div className="p-4 overflow-y-auto prose prose-sm">
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      )}
    </aside>
  )
}
```

**Why client:** Interactive collapse/expand state. `react-markdown` itself works in both server and client components, but the toggle requires client.

### `src/app/components/UserBadge.tsx`

```tsx
// Could be server component for now, but marking client
// since it will need interactivity once auth is wired up
'use client'

// shadcn: Avatar

export function UserBadge() {
  return (
    <div className="flex items-center gap-2">
      {/* Settings gear — links to /settings */}
      <a href="/settings" className="text-muted-foreground hover:text-foreground">
        {/* Lucide Settings icon */}
        ⚙
      </a>
      {/* User avatar/initials */}
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-sm">
        KG
      </div>
    </div>
  )
}
```

## Non-Goals

- Actual AI synthesis (mock/placeholder content for now)
- Authentication or real user sessions
- Persistent data storage (mock data, deleted later)
- Mobile/responsive layout (desktop-first for prototype)
- Settings page implementation

## Acceptance Criteria

- [ ] Single-page layout renders with sidebar, editor, and synthesis panel
- [ ] Sidebar displays a list of mock notes and allows selecting one
- [ ] Selecting a note shows its content in the editor
- [ ] Synthesis panel shows placeholder markdown content, rendered as formatted text
- [ ] Synthesis panel can be collapsed and expanded
- [ ] "New Note" action exists in the sidebar
- [ ] User identity is visible in a corner
- [ ] Layout looks intentional and polished (this becomes the style baseline)

## Open Questions

- **Synthesis panel position:** Right side vs bottom? Start with right side, evaluate during prototyping.
- **Sidebar width:** Fixed or resizable?
- **Dark mode:** Support from the start or add later?

## Decision Log

- **Sidebar in root layout** — sidebar and header are always visible (like Claude desktop). Route changes only swap the main content area. This means `/settings` keeps the sidebar; no route groups needed.
- **Project-specific conventions** go in ARCHITECTURE.md, not a separate doc. Standard Next.js project structure (app/, components/, etc.) doesn't need to be duplicated from framework docs.
- **Tiptap** for NoteEditor — rich text editing with StarterKit (bold, italic, headings, lists, code, blockquote, undo/redo). Requires `'use client'` and `immediatelyRender: false` for Next.js compatibility.
- **react-markdown** for SynthesisPanel — lightweight, renders markdown strings to React elements.
- **shadcn/ui** for base UI components — provides polished defaults we'll customize into the style guide.
- **Synthesis storage** — markdown stored as plain text in a Postgres `TEXT` column, not as files. Prototype uses a local mock file (`src/mock/notes.ts`) that gets deleted when real storage is connected.
- **Client Components for prototype** — all interactive components are `'use client'`. SSR isn't providing value with mock data; we'll leverage it when real data fetching is added.
- **URL-driven active note** — active note determined by `/notes/[id]` route, not React context or state. Bookmarkable, shareable, browser history works naturally. Sidebar uses `usePathname()` to highlight; no shared state management needed.

## References

- GitHub Issue: #4
- Prior art: Apple Notes, Notion, OneNote, Claude artifacts panel
