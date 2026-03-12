# ADR-003: Vercel Deployment

## Status

Accepted

## Context

The application uses Next.js as its full-stack framework and needs a deployment platform.

## Decision

Deploy on Vercel.

## Consequences

**Positive:**
- Native deployment platform for Next.js — first-class support for all Next.js features (server components, API routes, SSR, ISR)
- Minimal deployment configuration required
- Built-in CI/CD from Git pushes

**Negative:**
- Vendor lock-in to Vercel's platform for deployment
- Serverless function constraints (execution time limits, cold starts) may affect API routes that call the Claude API
