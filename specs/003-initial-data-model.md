# Spec: Initial Data Model

## Status

proposed

## Context

The UI prototype is built with mock data. We need a real database schema to back it. Kysely is initialized (spec 001) and local Postgres is running via Docker Compose. This spec defines the initial tables: users, notes, tags, and the note-tags join table.

## Goals

- Define the schema for users, notes, tags, and note_tags
- Create Kysely type definitions matching the schema
- Write and run the initial migration using Kysely's built-in migration support

## Non-Goals

- Replacing mock data with real queries (separate task — this spec stops at "schema exists and types are defined")
- Auth integration (separate ADR, user row creation will be handled then)
- AI synthesis pipeline (separate spec)
- LLM auto-tagging logic (separate spec — schema supports it, behavior is deferred)
- Vector embeddings / pgvector (additive later, not needed now)
- Profile picture uploads

## Schema

### users

| Column        | Type        | Constraints / Defaults              |
|---------------|-------------|--------------------------------------|
| id            | uuid        | PK, default gen_random_uuid()        |
| display_name  | text        | Nullable, user-chosen nickname       |
| color_theme   | text        | Not null, default 'theme-dark'       |
| created_at    | timestamptz | Not null, default now()              |
| updated_at    | timestamptz | Not null, default now()              |

`color_theme` stores the theme `id` string from the app's theme list (e.g., `'theme-pink'`, `'theme-dark'`). Validated at the application layer, not via Postgres enum, so adding new themes doesn't require a migration.

Auth provider linking (e.g., `auth_provider_id` column) will be added when auth is implemented.

### notes

| Column         | Type        | Constraints / Defaults              |
|----------------|-------------|--------------------------------------|
| id             | uuid        | PK, default gen_random_uuid()        |
| user_id        | uuid        | FK → users.id, not null, ON DELETE CASCADE |
| title          | text        | Nullable — derived from content initially, user-editable |
| content        | jsonb       | Tiptap/ProseMirror document JSON     |
| synthesis      | text        | Nullable — AI-generated markdown     |
| created_at     | timestamptz | Not null, default now()              |
| updated_at     | timestamptz | Not null, default now()              |
| synthesized_at | timestamptz | Nullable, last time AI synthesis ran |

Content is stored as `jsonb` because Tiptap produces a ProseMirror JSON document natively. This preserves formatting (bold, italic, bullet points, etc.) without lossy conversion.

Synthesis is stored as `text` containing markdown, rendered client-side with `react-markdown`.

`updated_at` is set by the application in UPDATE queries (`updated_at: new Date()`), not via a database trigger. Kysely queries are explicit, so this is straightforward and avoids hidden trigger machinery.

### tags

| Column     | Type        | Constraints / Defaults              |
|------------|-------------|--------------------------------------|
| id         | integer     | PK, generated always as identity     |
| user_id    | uuid        | FK → users.id, not null, ON DELETE CASCADE |
| name       | text        | Not null                             |
| created_at | timestamptz | Not null, default now()              |

Tags are scoped per user. Each user builds their own tag taxonomy. A unique constraint on `(user_id, name)` prevents duplicate tag names per user.

### note_tags

| Column  | Type    | Constraints                                    |
|---------|---------|------------------------------------------------|
| note_id | uuid    | FK → notes.id, not null, ON DELETE CASCADE      |
| tag_id  | integer | FK → tags.id, not null, ON DELETE CASCADE        |

Composite PK on `(note_id, tag_id)`. Standard many-to-many join table.

All foreign keys cascade on delete: deleting a user removes their notes, tags, and all note_tags. Deleting a note or tag removes the associated note_tags rows.

## Migration

Use Kysely's built-in migration support. Create a migration file at:

```
src/db/migrations/001_initial_schema.ts
```

The migration should use `db.schema.createTable(...)` to create all four tables with the types, constraints, and defaults described above. The `down` migration drops the tables in reverse dependency order: `note_tags`, `tags`, `notes`, `users`.

Add a migration runner script to `package.json`:

```json
{
  "scripts": {
    "db:migrate": "tsx src/db/migrate.ts"
  }
}
```

The runner (`src/db/migrate.ts`) uses Kysely's `Migrator` class with a `FileMigrationProvider` pointing at the migrations directory.

## Kysely Type Definitions

Update `src/db/types.ts` to match the schema. Target state:

```typescript
import { Generated, Selectable, Insertable, Updateable, ColumnType } from 'kysely'

// --- users ---
export interface UsersTable {
  id: Generated<string>             // uuid, generated by Postgres
  display_name: string | null
  color_theme: Generated<string>    // default 'theme-dark'
  created_at: Generated<Date>
  updated_at: Generated<Date>
}

export type User = Selectable<UsersTable>
export type NewUser = Insertable<UsersTable>
export type UserUpdate = Updateable<UsersTable>

// --- notes ---
export interface NotesTable {
  id: Generated<string>             // uuid, generated by Postgres
  user_id: string
  title: string | null
  content: ColumnType<unknown, string | unknown, string | unknown>  // jsonb
  synthesis: string | null
  created_at: Generated<Date>
  updated_at: Generated<Date>
  synthesized_at: Date | null
}

export type Note = Selectable<NotesTable>
export type NewNote = Insertable<NotesTable>
export type NoteUpdate = Updateable<NotesTable>

// --- tags ---
export interface TagsTable {
  id: Generated<number>             // serial
  user_id: string
  name: string
  created_at: Generated<Date>
}

export type Tag = Selectable<TagsTable>
export type NewTag = Insertable<TagsTable>
export type TagUpdate = Updateable<TagsTable>

// --- note_tags ---
export interface NoteTagsTable {
  note_id: string
  tag_id: number
}

export type NoteTag = Selectable<NoteTagsTable>
export type NewNoteTag = Insertable<NoteTagsTable>

// --- database ---
export interface Database {
  users: UsersTable
  notes: NotesTable
  tags: TagsTable
  note_tags: NoteTagsTable
}
```

## Design Decisions

- **UUIDs for users and notes** — Decouples identity from auth provider. Notes use UUID in URLs for clean, non-sequential public-facing IDs.
- **Serial integer for tags** — Tags are internal (never in URLs), so integer is simpler and more performant for joins.
- **User-scoped tags** — Each user has their own tags. Supports future LLM auto-tagging (LLM suggests, app code persists) and manual tagging without cross-user pollution.
- **`timestamptz` everywhere** — Per PostgreSQL best practices. Bare `timestamp` causes timezone bugs.
- **`text` over `varchar(n)`** — Per PostgreSQL best practices. Length constraints enforced at application layer where needed.
- **`jsonb` for Tiptap content** — Native format, queryable, preserves rich text structure. Switching editors later just means converting this column.
- **Synthesis as markdown `text`** — Already rendering with react-markdown. Simple, portable, no special storage needs.
- **No Postgres enums for color_theme** — Adding themes shouldn't require a migration. Store as text, validate in app code.
- **No soft delete (yet)** — Can add `deleted_at` column later if undo-delete is needed. Keeping it simple for now.
- **`updated_at` set by application, not trigger** — Kysely queries are explicit. Setting `updated_at: new Date()` in UPDATE calls is simple and transparent. No hidden database triggers.
- **ON DELETE CASCADE on all FKs** — MVP simplicity. Deleting a user cleans up everything. Revisit if soft delete is added later.
- **Kysely built-in migrations** — Simple, no extra tooling. Migrations are TypeScript files using `db.schema` builder.

## Acceptance Criteria

- [ ] Migration file exists at `src/db/migrations/001_initial_schema.ts`
- [ ] Migration runner exists at `src/db/migrate.ts` with `db:migrate` script
- [ ] Migration creates all four tables with correct types, PKs, FKs, and defaults
- [ ] ON DELETE CASCADE on all foreign keys
- [ ] Unique constraint on `tags(user_id, name)`
- [ ] Kysely Database interface in `src/db/types.ts` matches the schema (all four tables)
- [ ] Migration runs successfully against local Docker Postgres (`npm run db:migrate`)
- [ ] Basic CRUD queries compile and execute (insert a user, insert a note, tag it)

## Open Questions

- **Indexes**: Beyond PKs and the unique constraint, do we need indexes on `notes.user_id` or `note_tags.tag_id` now, or wait until we have query patterns?

## Decision Log

- **Content stored as jsonb** — Tiptap/ProseMirror native format. Avoids lossy conversion, queryable in Postgres. — 2026-03-13
- **Synthesis stored as markdown text** — Rendered client-side with react-markdown. — 2026-03-13
- **Tags are user-scoped** — Each user has their own taxonomy. Supports future LLM auto-tagging and manual tagging. — 2026-03-13
- **LLM auto-tagging deferred** — Schema supports it, but the behavior (LLM suggests tags → app code persists) is a separate spec. — 2026-03-13
- **pgvector/embeddings deferred** — Additive later (just a new column). Not needed for initial schema. — 2026-03-13
- **Kysely built-in migrations** — No CLI needed, TypeScript migration files, simple runner script. — 2026-03-13
- **ON DELETE CASCADE on all FKs** — MVP simplicity, revisit for soft delete later. — 2026-03-13
- **Title column on notes** — Nullable, derived from content initially but user-editable. Stored in DB for sidebar display and querying. — 2026-03-13
- **updated_at set by application** — No database triggers. Set explicitly in Kysely UPDATE queries. — 2026-03-13

## Future Considerations

These are not in scope for this spec but will likely affect the data model later. Captured here so they're visible when we revisit the schema.

### Vector embeddings + RAG across notes
Add a `vector` column to notes (via pgvector) to enable semantic search — find similar notes, surface related content during synthesis, inform tag suggestions. Requires research into: pgvector setup with Kysely, embedding model choice, when/how to generate embeddings (on save? async job?), and how to structure RAG queries effectively.

### User context for LLM calls
A persistent per-user context that gets baked into LLM prompts — similar to how ChatGPT/Claude remembers things about you. Likely a `text` column on the users table (or a separate `user_context` table if it grows). The LLM reads this context to make better guesses about what you're writing about, suggest more relevant tags, and produce more personalized synthesis. Research needed: how Anthropic/OpenAI handle memory (probably a plain-text summary updated over time), what gets stored, and how to keep it concise enough to fit in prompts.

### LLM auto-tagging behavior
The schema supports tags, but the LLM auto-tagging flow needs its own spec. Key questions: What approval UX should exist before tags are created? Should the LLM suggest tags inline with synthesis, or as a separate step? How does RAG over past notes help the LLM pick or create tags more intelligently? Should there be a cap on tag creation rate to prevent runaway taxonomy bloat?

### RAG-informed synthesis
Beyond tagging, RAG across note history could improve synthesis itself — the LLM could reference your past notes for context, identify recurring themes, and produce summaries that connect to your broader body of work rather than treating each note in isolation.

## References

- [Spec 001: Kysely Setup](./001-kysely-setup.md)
- [Spec 002: UI Prototype](./002-ui-prototype.md)
- [PostgreSQL Don't Do This](https://wiki.postgresql.org/wiki/Don't_Do_This)
- [GitHub Issue #5: Define initial data model](https://github.com/kpgre/auto-note/issues/5)
- Theme IDs defined in `src/lib/themes.ts`
