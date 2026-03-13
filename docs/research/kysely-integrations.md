# Research: Kysely Integrations

Research on Kysely integrations relevant to the project.

## Postgres Hosting

**Kysely connects to all Postgres providers identically.** Standard `pg` driver, standard connection string:

```typescript
import { Kysely, PostgresDialect } from 'kysely'
import { Pool } from 'pg'

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL })
  })
})
```

This works the same for Supabase, Neon, Railway, Vercel Postgres, or any other provider.

### Hosting Decision Factors

Since Kysely integration is identical across providers, the hosting decision should be based on operational factors:

| Factor | Why It Matters |
|--------|---------------|
| **Connection pooling** | Critical for Vercel serverless (cold starts, connection limits) |
| **Free tier** | Useful for development and portfolio projects |
| **Migration tooling** | Some providers include CLI tools |
| **Vercel integration** | Streamlined environment variable setup |

A formal ADR should compare providers (Supabase, Neon, Railway, Vercel Postgres) on these factors.

---

## Note on `kysely-supabase`

Kysely's docs mention a `kysely-supabase` package. This is **not required** to use Kysely with Supabase.

It exists for a niche scenario: if you're using Supabase's JS client elsewhere in your app and want to reuse Supabase's auto-generated types with Kysely (instead of defining types twice).

**For this project**, we're using Kysely as the sole query layer, so we'll define our own types. No `kysely-supabase` needed.

---

## LLM-Friendly Documentation

Kysely provides AI-optimized documentation:

- `https://kysely.dev/llms.txt` — summary and index
- `https://kysely.dev/llms-full.txt` — complete docs in one file

Follows the [llms.txt standard](https://llmstxt.org/).

### Using with AI Tools

| Tool | Method |
|------|--------|
| **Cursor** | `@Docs` with the llms-full.txt URL |
| **Windsurf** | Reference URL with `@` or add to `.windsurfrules` |
| **Claude Code** | Reference URL in prompts |

Useful for getting accurate Kysely code suggestions during development.

---

## References

- [Kysely Getting Started](https://kysely.dev/docs/getting-started)
- [Kysely Supabase Integration](https://kysely.dev/docs/integrations/supabase)
- [Kysely LLM Documentation](https://kysely.dev/docs/integrations/llms)
- [llms.txt Standard](https://llmstxt.org/)
