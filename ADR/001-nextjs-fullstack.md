# ADR-001: Next.js as Full-Stack Framework

## Status

Accepted

## Context

This project is a note-taking application with AI integration. A full-stack framework was needed to handle both the frontend UI and server-side logic (API routes, Claude API calls, database access).

A separate Java Spring Boot backend was considered as an alternative. This would have introduced a two-service architecture with Next.js handling the frontend and Spring Boot handling the API layer.

## Decision

Use Next.js as the full-stack framework. All server-side logic lives in API routes / Route Handlers. Server components handle SSR so that notes and synthesis results arrive fully rendered. API keys and Claude API calls are confined to API routes and never reach the browser.

## Consequences

**Positive:**
- Single codebase and deployment unit — simpler to develop, test, and deploy
- Server components provide SSR without additional infrastructure
- API routes keep server-side concerns (AI calls, database access, secrets) cleanly separated from the browser
- Better suited to the project's scope than a split architecture
- Allows full focus on the AI integration and application complexity rather than inter-service concerns

**Negative:**
- No separation between frontend and backend technologies
- Tightly couples frontend and backend in one deployment

**Deferred:**
- Java Spring Boot will be revisited as a separate focused project later, where it can be the primary learning objective rather than splitting focus with this application's AI complexity
