---
name: neon-docs
description: Fetch Neon Postgres documentation for database, pgvector, and serverless driver reference
user-invocable: true
---

Fetch the Neon LLM documentation from https://neon.com/docs/llms-full.txt

Use this documentation to answer questions about:
- Neon Postgres setup, configuration, and connection
- pgvector extension (embeddings, similarity search, indexing)
- Serverless driver (@neondatabase/serverless)
- Branching, autoscaling, and scale-to-zero
- Plans, billing, and free tier limits
- Integrations (Vercel, frameworks, ORMs)
- Migrations and schema management

## Targeted page lookup

Any Neon docs page is also available as Markdown by appending `.md` to the URL.
For example: `https://neon.com/docs/extensions/pgvector.md`

When the user asks about a specific topic and you know the docs path, fetch the
targeted `.md` page directly instead of the full `llms-full.txt`. This is faster
and gives more focused context. Use `llms-full.txt` for broad or exploratory questions.

When responding:
1. Cite specific patterns or examples from the docs
2. Prefer documented approaches over assumptions
3. Note if something isn't covered in the docs
