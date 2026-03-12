# ADR-002: Kysely as Query Layer

## Status

Accepted

## Context

The application uses Postgres as its database and needs a query layer for type-safe database access from Next.js API routes. Prisma is the most common choice in the TypeScript ecosystem. However, there is already existing experience with Prisma, and this project is a portfolio piece where demonstrating breadth of skills matters.

## Decision

Use Kysely as the query layer instead of Prisma.

Kysely is a type-safe SQL query builder. It provides full TypeScript type safety while requiring you to write real SQL rather than abstracting it behind ORM conventions. There is no schema DSL, no migration magic, and no generated client — just SQL with types.

## Consequences

**Positive:**
- Type-safe SQL without ORM abstraction — closer to the metal
- No ORM conventions to fight against
- Demonstrates willingness to learn new tools rather than repeating known ones
- Stronger portfolio signal than using Prisma again (diminishing returns on existing experience)

**Negative:**
- Less ecosystem support and fewer tutorials compared to Prisma
- More manual work for migrations and schema management
- Steeper learning curve for a tool not previously used
