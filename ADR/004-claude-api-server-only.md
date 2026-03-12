# ADR-004: Claude API Server-Side Only

## Status

Accepted

## Context

The application uses the Claude API to synthesize unstructured notes into organized summaries. API calls require an API key and incur per-token costs. A decision was needed about where in the stack these calls are made.

## Decision

All Claude API calls are made exclusively from Next.js API routes on the server. The API key and all AI interactions never reach the browser. No client-side code calls the Claude API directly.

## Consequences

**Positive:**
- API keys are never exposed to the browser — no risk of client-side key leakage
- All AI API usage is controlled and observable on the server
- Server-side calls allow request validation, rate limiting, and cost controls before any API call is made
- Consistent with the Next.js full-stack architecture (ADR-001)

**Negative:**
- Every AI interaction requires a round trip through the Next.js API route, adding latency compared to a direct client-side call
