export interface MockNote {
  id: string
  title: string
  content: string
  synthesis: string
  updatedAt: string
}

export const mockNotes: MockNote[] = [
  {
    id: "1",
    title: "Meeting Notes — Project Kickoff",
    content:
      "discussed timeline, Q3 launch target, need to finalize tech stack by end of week. DB choice between postgres and sqlite — leaning postgres for prod. Frontend: Next.js is locked in. Auth TBD. Need to set up CI/CD pipeline soon. Also talked about testing strategy — want integration tests from day one.",
    synthesis: `## Project Kickoff Summary

- **Timeline:** targeting Q3 launch
- **Tech stack:** Next.js (frontend), Postgres (database, pending ADR)
- **Open decisions:** auth provider, CI/CD pipeline
- **Next steps:** finalize tech stack by EOW
- **Testing:** integration tests from day one

### Action Items
1. Write ADR for database choice
2. Evaluate auth options (NextAuth vs Clerk)
3. Set up GitHub Actions for CI`,
    updatedAt: "2026-03-13T10:30:00Z",
  },
  {
    id: "2",
    title: "Research: Auth Options",
    content:
      "looked at nextauth vs clerk vs custom. clerk is simpler but vendor lock-in concerns. nextauth is more flexible, bigger community, but more setup. custom JWT is too much work for MVP. lucia is interesting but newer. need to consider: social login, magic links, session management. clerk has nice prebuilt components. nextauth v5 has edge runtime support.",
    synthesis: `## Auth Research

### Options Compared
| Option | Pros | Cons |
|--------|------|------|
| NextAuth v5 | OSS, flexible, edge runtime | More setup, learning curve |
| Clerk | Simple, prebuilt UI, fast | Vendor lock-in, cost at scale |
| Lucia | Modern, lightweight | Newer, smaller community |

### Requirements
- Social login (Google, GitHub)
- Magic link support
- Session management

**Recommendation:** defer decision until MVP scope is clearer. Prototype with mock auth.`,
    updatedAt: "2026-03-12T16:00:00Z",
  },
  {
    id: "3",
    title: "AI Synthesis Prompt Ideas",
    content:
      "the synthesis should feel like a smart assistant summarized your messy notes. not just bullet points — actual structure. headings, grouped topics, action items pulled out. maybe a TL;DR at the top. should handle stream-of-consciousness input gracefully. need to test with real messy input like voice transcripts. cost matters — can we use haiku for first pass and sonnet for final?",
    synthesis: `## AI Synthesis Design Notes

### Goals
- Transform messy/unstructured input into organized summaries
- Extract action items automatically
- Group related topics under headings
- Include TL;DR section

### Prompt Strategy
- **Two-pass approach:** fast model (Haiku) for initial structure, capable model (Sonnet) for polish
- Handle voice transcript artifacts (filler words, repetition)
- Preserve user's intent without over-editing

### Open Questions
- Cost per synthesis (token budget?)
- Real-time streaming vs batch?
- User feedback loop on synthesis quality?`,
    updatedAt: "2026-03-11T09:15:00Z",
  },
]
