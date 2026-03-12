# Architecture

## Overview

A note-taking application where users write or speak unstructured notes, and AI automatically synthesizes them into clean, organized summaries.

Core capabilities:
- Text input with AI synthesis via Claude API
- Auto-synthesize on inactivity (debounced — not every keystroke, smart triggers only)
- Speech-to-text via Web Speech API
- AI asks clarifying questions only when genuinely uncertain — always guesses first and shows its reasoning
- Persistent note storage
- Notes build on each other and synthesize over time

## System Components

**Frontend + Backend: Next.js (full-stack)**
- Server components for SSR — notes and synthesis results arrive fully rendered
- API routes / Route Handlers for all server-side logic
- API keys and Claude API calls live in API routes only, never reach the browser

**Query Layer: Kysely**
- Type-safe SQL query builder
- Write real SQL with full type safety, no ORM abstraction

**Database: Postgres**
- Hosting provider: TODO — to be decided in a future ADR

**AI: Claude API**
- Called exclusively from Next.js API routes on the server
- Never exposed to the browser

**Deployment: Vercel**

<!-- TODO: Add component interaction details — how the frontend, API routes, Kysely, Postgres, and Claude API connect. Consider a diagram once data flow is defined. -->

## Data Flow

<!-- TODO: Define how data moves through the system. Starting points to consider:
     - User input (text or speech) → API route → Claude API → synthesized output → database → rendered page
     - How notes accumulate and feed into synthesis over time
     - Where debounce/smart triggers fit in the flow -->

## Key Technical Decisions

- [ADR-001: Next.js as full-stack framework](ADR/001-nextjs-fullstack.md)
- [ADR-002: Kysely as query layer](ADR/002-kysely.md)
- [ADR-003: Vercel deployment](ADR/003-vercel-deployment.md)
- [ADR-004: Claude API server-side only](ADR/004-claude-api-server-only.md)

## Open Questions

- Postgres hosting provider — not yet decided
- Vector embeddings — under consideration, not confirmed
- Whisper audio upload — under consideration, not confirmed
- Weekly digest or Q&A over notes — under consideration, not confirmed
