# ADR-005: Clerk as Authentication Provider

## Status

Accepted

## Context

The app currently runs as a single hardcoded user with no authentication. Before deploying to production, we need real auth — both to protect the app and to allow invite-only access for portfolio demos (e.g., sharing with recruiters or hiring managers).

Requirements:
- Magic link or passwordless sign-in (low friction for invited users)
- Invite-only access control (not open registration)
- Free tier sufficient for a handful of users
- Minimal implementation effort — auth is not the portfolio headline feature

Options considered:

**NextAuth (Auth.js) + Resend:** Self-hosted auth with magic link emails via Resend. Full control, no vendor lock-in. But requires building session management, email verification, an allowlist mechanism, and invite flow from scratch. Better long-term if we need cross-app SSO across multiple portfolio projects, but that's not a current need.

**Clerk:** Managed auth with prebuilt UI components, magic links, and a dashboard for user management. Invite flow is handled through the dashboard — no custom admin UI needed. Free tier covers 10,000 MAUs, far beyond our needs.

**Custom JWT:** Too much work for an MVP with no unique auth requirements.

## Decision

Use Clerk as the authentication provider.

## Consequences

**Positive:**
- Fastest path to working auth — prebuilt sign-in components, no email infrastructure to configure
- User management dashboard handles invites without building admin UI
- Magic links supported out of the box
- Free tier (10k MAUs) is more than sufficient
- Well-documented Next.js integration with middleware-based route protection

**Negative:**
- Vendor lock-in — Clerk owns the session format, user data, and login UI
- If we later want cross-app SSO across multiple portfolio projects, Clerk's multi-app support is on paid plans. Would need to migrate to NextAuth or share a single Clerk app.
- Less portfolio signal than building auth from scratch (but AI synthesis is the real showcase)

**Accepted tradeoffs:**
- Vendor lock-in is acceptable for a portfolio project. Migration to NextAuth is straightforward if needed later.
- Cross-app SSO is not a current requirement. If it becomes one, we'll revisit.
- The time saved on auth goes directly into the AI synthesis feature, which is the app's core value proposition.
