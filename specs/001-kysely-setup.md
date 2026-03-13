# Spec: Kysely Setup

## Status

proposed

## Context

ADR-002 established Kysely as the query layer for this project. This spec defines how to set up Kysely with Postgres, establish the database schema types, and integrate with the chosen hosting provider.

The application needs type-safe database access from Next.js API routes. Kysely provides this through typed SQL queries without ORM abstraction.

## Goals

- Install and configure Kysely with PostgresDialect
- Establish the Database interface pattern for type safety
- Set up connection pooling appropriate for serverless (Vercel)
- Enable type generation workflow (manual or from schema)

## Non-Goals

- Defining specific table schemas (covered in separate data model spec)
- Migration tooling selection (separate ADR needed)
- Vector/embedding support (open question, not confirmed)

## Technical Requirements

### TypeScript Configuration

Kysely requires TypeScript 4.6 minimum. Version 5.4+ recommended for better type safety.

**Required in `tsconfig.json`:**
```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### Dependencies

```bash
npm install kysely pg
npm install -D @types/pg
```

### Database Interface Pattern

Define a `Database` interface describing all tables. Use Kysely's utility types:

- `Generated<T>` — auto-increment or default columns
- `Selectable<T>` — row type for SELECT results
- `Insertable<T>` — row type for INSERT (Generated fields optional)
- `Updateable<T>` — row type for UPDATE (all fields optional)

```typescript
// src/db/types.ts
import { Generated, Selectable, Insertable, Updateable } from 'kysely'

export interface NotesTable {
  id: Generated<number>
  content: string
  synthesis: string | null
  created_at: Generated<Date>
  updated_at: Date
}

export interface Database {
  notes: NotesTable
}

// Export utility types for each table
export type Note = Selectable<NotesTable>
export type NewNote = Insertable<NotesTable>
export type NoteUpdate = Updateable<NotesTable>
```

### Kysely Instance

Maintain a single Kysely instance per database. For serverless (Vercel), connection pooling must handle cold starts gracefully.

```typescript
// src/db/index.ts
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'
import { Database } from './types'

const dialect = new PostgresDialect({
  pool: new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10, // Adjust for serverless — lower is often better
  })
})

export const db = new Kysely<Database>({ dialect })
```

### Environment Variables

```
DATABASE_URL=postgres://user:password@host:5432/dbname
```

Never hardcode connection strings. Use `.env.local` for development, Vercel environment variables for production.

## Acceptance Criteria

- [ ] Kysely and pg installed as dependencies
- [ ] `tsconfig.json` has `strict: true`
- [ ] Database interface defined in `src/db/types.ts`
- [ ] Kysely instance exported from `src/db/index.ts`
- [ ] DATABASE_URL configured in `.env.local`
- [ ] Basic query executes successfully (e.g., `SELECT 1`)

## Open Questions

- **Migration tooling:** Kysely supports migrations but has no CLI. Options: raw SQL files, kysely-ctl, or Supabase migrations if using Supabase hosting. Needs ADR.
- **Connection pooling for serverless:** May need external pooler (PgBouncer, Supabase's built-in pooler) for high-traffic serverless. Depends on hosting choice.

## Decision Log

_(Decisions made during implementation will be logged here)_

## References

- [ADR-002: Kysely as Query Layer](../ADR/002-kysely.md)
- [Kysely Integrations Research](../docs/research/kysely-integrations.md)
- [Kysely Getting Started](https://kysely.dev/docs/getting-started)
- [Kysely Supabase Integration](https://kysely.dev/docs/integrations/supabase)
- [Kysely LLM Documentation](https://kysely.dev/docs/integrations/llms)
