---
name: vercel-docs
description: Fetch Vercel documentation for platform, deployment, and infrastructure reference
user-invocable: true
---

Fetch the Vercel LLM documentation from https://vercel.com/docs/llms-full.txt

Use this documentation to answer questions about:
- Deployments, previews, and production workflows
- Serverless and Edge Functions
- Environment variables and project configuration
- Domains, DNS, and routing
- Build settings and framework presets
- Vercel CLI usage
- Observability, logs, and analytics
- Storage (Postgres, KV, Blob, Edge Config)
- Security, firewalls, and access control

## Targeted page lookup

Any Vercel docs page is also available as Markdown by appending `.md` to the URL.
For example: `https://vercel.com/docs/deployments.md`

When the user asks about a specific topic and you know the docs path, fetch the
targeted `.md` page directly instead of the full `llms-full.txt`. This is faster
and gives more focused context. Use `llms-full.txt` for broad or exploratory questions.

When responding:
1. Cite specific patterns or examples from the docs
2. Prefer documented approaches over assumptions
3. Note if something isn't covered in the docs
