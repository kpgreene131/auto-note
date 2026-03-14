# Spec: Soft Delete and Trash

## Status

proposed

## Context

Notes are currently hard-deleted — once gone, they're gone. This is risky for a note-taking app where accidental deletion can lose important work. Users expect a "Recently Deleted" safety net (like Apple Notes, Google Docs, Notion).

This spec adds soft-delete: deleted notes are marked with a timestamp instead of removed, appear in a collapsible "Recently Deleted" section in the sidebar, and can be restored. Notes older than 30 days are permanently purged on-access (when the trash list is fetched), keeping the implementation simple with no external cron or scheduler.

## Goals

- Soft-delete notes instead of hard-deleting them
- Show a "Recently Deleted" section in the sidebar with restore and permanent delete actions
- Auto-purge trashed notes older than 30 days (on-access cleanup)
- Preserve existing delete UX (trash icon, confirmation modal) — just change what happens behind the scenes

## Non-Goals

- Server-side scheduled purge (cron, pg_cron, etc.) — on-access cleanup is sufficient for single-user MVP
- Editing or viewing trashed notes — they're read-only in the trash
- Bulk restore or bulk permanent delete
- Undo/snackbar-style "undo delete" (the trash section serves this purpose)
- Search within trash

## Database Changes

### Migration: `002_soft_delete.ts`

Add a nullable `deleted_at` column to the `notes` table:

```typescript
import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('notes')
    .addColumn('deleted_at', sql`timestamptz`)
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('notes')
    .dropColumn('deleted_at')
    .execute()
}
```

### Type changes

Add `deleted_at` to `NotesTable` in `src/db/types.ts`:

```typescript
deleted_at: Date | null
```

No `Generated<>` wrapper — the column is nullable with no default, set explicitly on soft-delete.

## API Changes

### Existing routes — filter out soft-deleted notes

All existing note queries add `WHERE deleted_at IS NULL`:

- `GET /api/notes` — list only active notes
- `GET /api/notes/[id]` — return 404 if note is soft-deleted
- `PUT /api/notes/[id]` — return 404 if note is soft-deleted
- Home page server query — only consider active notes for redirect

### `DELETE /api/notes/[id]` — soft delete (changed behavior)

Instead of `DELETE FROM notes`, set `deleted_at = now()`:

```typescript
db.updateTable('notes')
  .set({ deleted_at: new Date() })
  .where('id', '=', id)
  .where('user_id', '=', userId)
  .where('deleted_at', 'is', null)
  .returningAll()
  .executeTakeFirst()
```

Response shape stays the same: `{ "deleted": true }`.

### `GET /api/notes/trash` — list trashed notes (new)

Returns notes where `deleted_at IS NOT NULL`, ordered by `deleted_at` descending (most recently deleted first).

**Before returning results**, purge notes where `deleted_at < now() - 30 days`:

```typescript
// Purge expired trash
await db.deleteFrom('notes')
  .where('user_id', '=', userId)
  .where('deleted_at', 'is not', null)
  .where('deleted_at', '<', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  .execute()

// Then fetch remaining trash
const notes = await db.selectFrom('notes')
  .selectAll()
  .where('user_id', '=', userId)
  .where('deleted_at', 'is not', null)
  .orderBy('deleted_at', 'desc')
  .execute()
```

**Response 200:**
```json
{
  "notes": [
    {
      "id": "uuid",
      "title": "Deleted Note",
      "deleted_at": "2026-03-14T...",
      ...
    }
  ]
}
```

### `POST /api/notes/[id]/restore` — restore a trashed note (new)

Clears `deleted_at`, sets `updated_at` to now:

```typescript
db.updateTable('notes')
  .set({ deleted_at: null, updated_at: new Date() })
  .where('id', '=', id)
  .where('user_id', '=', userId)
  .where('deleted_at', 'is not', null)
  .returningAll()
  .executeTakeFirst()
```

**Response 200:** The restored note object.

**Response 404:** Note not found or not in trash.

### `DELETE /api/notes/[id]/permanent` — permanently delete (new)

Hard-deletes a trashed note. Only works on notes that are already soft-deleted:

```typescript
db.deleteFrom('notes')
  .where('id', '=', id)
  .where('user_id', '=', userId)
  .where('deleted_at', 'is not', null)
  .returningAll()
  .executeTakeFirst()
```

**Response 200:** `{ "deleted": true }`

**Response 404:** Note not found or not in trash.

## API Client Changes

Add to `src/lib/api.ts`:

```typescript
export async function fetchTrash(): Promise<Note[]>
export async function restoreNote(id: string): Promise<Note>
export async function permanentlyDeleteNote(id: string): Promise<void>
```

## UI Changes

### Sidebar

Add a collapsible "Recently Deleted" section at the bottom of the sidebar:

- **Layout**: The sidebar becomes a flex column with three sections:
  1. **New Note button** (fixed height, top)
  2. **Active notes list** (`flex-1 min-h-0 overflow-y-auto`) — scrolls independently
  3. **Recently Deleted** (sticky bottom) — always visible regardless of active notes overflow
- **Header**: "Recently Deleted" label with a chevron toggle and a trash count badge. Collapsed by default. Clicking the header toggles open/closed.
- **When collapsed**: just the header bar is visible at the bottom — a single compact row
- **When expanded**: the trash list appears above the header (or below it pushing upward), taking up to ~40% of the sidebar height (`max-h-[40%] overflow-y-auto`). The active notes list shrinks to accommodate.
- **Each trashed note shows**:
  - Title (or "Untitled")
  - "Deleted X days ago" relative timestamp
  - Restore button (undo icon) — calls `restoreNote(id)`, refetches both active and trash lists
  - Permanent delete button (trash icon) — confirmation modal, then `permanentlyDeleteNote(id)`, refetches trash
- **Trashed notes are not clickable** — no navigation to `/notes/[id]`
- **Empty state**: "No deleted notes" when trash is empty

### Active note list

No changes to the existing delete flow. The trash icon + confirmation modal stays the same — the API just soft-deletes instead of hard-deleting now. After soft-delete, the sidebar refetches the active list (note disappears) and if the trash section is expanded, it refetches trash too (note appears there).

## Route Structure

```
src/app/api/
  notes/
    route.ts                → GET (list active), POST (create)
    trash/
      route.ts              → GET (list trash, with purge)
    [id]/
      route.ts              → GET, PUT, DELETE (soft-delete)
      restore/
        route.ts            → POST (restore from trash)
      permanent/
        route.ts            → DELETE (hard delete)
```

## File Inventory

New files:
| File | Purpose |
|------|---------|
| `src/db/migrations/002_soft_delete.ts` | Add `deleted_at` column |
| `src/app/api/notes/trash/route.ts` | GET trash list (with purge) |
| `src/app/api/notes/[id]/restore/route.ts` | POST restore |
| `src/app/api/notes/[id]/permanent/route.ts` | DELETE permanent |

Modified files:
| File | Change |
|------|--------|
| `src/db/types.ts` | Add `deleted_at` to `NotesTable` |
| `src/lib/api.ts` | Add `fetchTrash`, `restoreNote`, `permanentlyDeleteNote` |
| `src/app/api/notes/route.ts` | Filter `deleted_at IS NULL` in GET |
| `src/app/api/notes/[id]/route.ts` | Filter `deleted_at IS NULL` in GET/PUT, soft-delete in DELETE |
| `src/app/page.tsx` | Filter `deleted_at IS NULL` in redirect query |
| `src/components/Sidebar.tsx` | Add collapsible "Recently Deleted" section |

## Acceptance Criteria

- [ ] Migration adds `deleted_at` column to `notes` table
- [ ] `DELETE /api/notes/[id]` sets `deleted_at` instead of removing the row
- [ ] `GET /api/notes` excludes soft-deleted notes
- [ ] `GET /api/notes/[id]` returns 404 for soft-deleted notes
- [ ] `PUT /api/notes/[id]` returns 404 for soft-deleted notes
- [ ] Home page redirect ignores soft-deleted notes
- [ ] `GET /api/notes/trash` returns soft-deleted notes ordered by `deleted_at` desc
- [ ] `GET /api/notes/trash` purges notes with `deleted_at` older than 30 days before returning
- [ ] `POST /api/notes/[id]/restore` clears `deleted_at` and updates `updated_at`
- [ ] `DELETE /api/notes/[id]/permanent` hard-deletes only already-trashed notes
- [ ] Sidebar shows collapsible "Recently Deleted" section (collapsed by default)
- [ ] Trashed notes show title and relative "deleted X days ago" timestamp
- [ ] Restore button moves note back to active list
- [ ] Permanent delete button (with confirmation) removes note forever
- [ ] Trashed notes are not clickable/navigable
- [ ] TypeScript: `npx tsc --noEmit` passes

## Design Decisions

- **On-access purge over scheduled job** — single-user MVP with few notes. The trash list is fetched infrequently, so running a purge query before returning results is cheap and avoids external scheduling infrastructure. Revisit if the app goes multi-user or trash volume grows.
- **30-day retention** — industry standard (Apple Notes, Google Docs, Notion). Long enough to catch mistakes, short enough to not accumulate garbage.
- **Collapsed by default** — trash is a safety net, not a primary workflow. Keeping it collapsed reduces sidebar noise.
- **No editing trashed notes** — simplifies the UX and avoids edge cases (what if you edit a note that's about to be purged?). Restore first, then edit.
- **Separate `/permanent` route over query param** — clearer intent, harder to accidentally hard-delete. The `DELETE /notes/[id]` route always soft-deletes; you must explicitly hit the `/permanent` endpoint.
- **Purge before fetch, not after** — ensures the response never includes expired notes, even on the first request after a long absence.

## References

- [Spec 004: API Routes](./004-api-routes.md)
- [Spec 005: Wire UI to API](./005-wire-ui-to-api.md)
- [Spec 003: Initial Data Model](./003-initial-data-model.md)
