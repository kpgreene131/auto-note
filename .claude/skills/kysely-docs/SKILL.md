---
name: kysely-docs
description: Fetch Kysely documentation for accurate query builder reference
user-invocable: true
---

Fetch the Kysely LLM documentation from https://kysely.dev/llms-full.txt

Use this documentation to answer questions about:
- Query building (SELECT, INSERT, UPDATE, DELETE)
- Type-safe patterns and Database interface definitions
- Joins, CTEs, transactions, subqueries
- Migration tooling
- Dialects and driver configuration

When responding:
1. Cite specific patterns or examples from the docs
2. Prefer documented approaches over general TypeScript patterns
3. Note if something isn't covered in the docs
