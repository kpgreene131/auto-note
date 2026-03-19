# Spec: AI Synthesis

## Status

proposed

## Context

The entire point of auto-note is that users type messy, unstructured notes and the app synthesizes them into clean, organized summaries via Claude. The infrastructure is complete — the `synthesis` and `synthesized_at` columns exist in the database, the PUT endpoint accepts synthesis updates, and ADR-004 mandates server-side-only Claude API calls. This spec defines the synthesis loop, auto-titling, clarifying questions, and the user context profile.

## Goals

- Synthesize raw note content into clean markdown as the user types, triggered by meaningful content changes
- Auto-generate note titles when enough content exists to do so confidently
- Surface clarifying questions inline when Claude is uncertain, without interrupting flow
- Build a lightweight user context profile from note history to improve synthesis quality over time
- Keep all AI calls server-side (ADR-004) with cost-conscious trigger logic

## Non-Goals

- RAG on past notes / cross-note awareness via embeddings (phase 2+, requires pgvector)
- Tree/index view for organizing notes (deferred — tag filtering covers 80%)
- Retroactive re-tagging of old notes
- Cross-note synthesis ("what do these notes have in common")
- Client-side AI calls of any kind
- Streaming responses — synthesis replaces the full panel content each time, so progressive token rendering adds little value. If synthesis latency becomes noticeable in the future, streaming could help, but it also complicates the structured output (title, question, tags alongside markdown). Revisit if/when a chat-style feature is added, where streaming is a natural fit.

## Design

### 1. Synthesis Trigger

Synthesis does **not** use a simple time-based debounce. Instead, it uses a **character-delta trigger**:

- **While typing:** Track the character count of the note's plain text at the time of the last synthesis call. When the delta between the current character count and the last-synthesized count exceeds a **scaling threshold**, trigger a new synthesis. The threshold scales with note length: `max(100, noteLength * 0.1)` — so a short note re-synthesizes every ~100 new characters, while a 5,000-character note waits for ~500 new characters. This naturally reduces API calls as notes grow longer.
- **On page leave:** When the user navigates away from a note (route change, tab close, browser unload), trigger a final save + synthesis. This acts as an explicit "I'm done for now" signal and ensures the synthesis is always up to date when the user returns.
- **Minimum content gate:** Do not trigger synthesis at all until the note has at least ~50 characters of plain text. Very short notes ("grocery list", "call mom") don't benefit from synthesis.

The scaling formula and minimum threshold are config constants (`src/lib/ai/config.ts`), not hardcoded, so they can be tuned.

### 2. Synthesis API Route

**`POST /api/notes/[id]/synthesize`**

Server-side route that:
1. Fetches the note (verifies ownership)
2. Extracts plain text from the Tiptap JSON content
3. Builds the prompt (see §5)
4. Calls the Claude API
5. Parses the structured response
6. Updates the note's `synthesis`, `synthesized_at`, and optionally `title` columns
7. Returns the structured response to the client

**Request body:**
```typescript
{
  content: TiptapDocument  // current editor JSON (for freshness — avoid race with auto-save)
}
```

**Response body:**
```typescript
{
  synthesis: string | null         // markdown summary, null if skipped
  title: string | null             // proposed title, null if not confident enough
  question: {                      // clarifying question, null if none
    text: string
    options: string[]              // includes "Other" as last option
  } | null
}
```

All three fields can coexist in a single response — a synthesis attempt, a title proposal, and a clarifying question can all come back together.

### 3. Structured Output Schema

Claude returns a single JSON object with up to three parts:

```typescript
interface SynthesisResponse {
  // Always present when note has enough content
  synthesis: {
    markdown: string               // clean, organized markdown summary
    confidence: "high" | "medium" | "low"
  } | null

  // Present only when Claude is confident enough to title
  title: {
    suggested: string              // proposed title
    action: "propose" | "clean"    // propose = no title exists; clean = refine existing
  } | null

  // Present only when Claude is genuinely uncertain (max 1 per response)
  question: {
    text: string                   // the question
    options: string[]              // 2-4 choices + "Other" always last
  } | null
}
```

**Title behavior:**
- If the note has no title and Claude has high/medium confidence about the topic, propose one.
- If the note has a title, Claude may lightly clean it (fix typos, improve clarity) but should not change the meaning.
- If Claude doesn't have enough content or confidence to title meaningfully, return `null`. Don't guess.

**Clarifying question behavior:**
- Claude should always attempt a best-guess synthesis first, even when uncertain.
- Questions surface only when confidence is low and the ambiguity materially affects the output.
- Maximum 1 question per synthesis call.
- Questions are optional for the user to answer — the system should work fine if ignored.

### 4. Clarifying Question UX

Clarifying questions appear **inline in the synthesis panel**, below the synthesis output:

- Rendered as a subtle card/callout — noticeable but not disruptive.
- Multiple-choice options displayed as clickable chips/buttons.
- "Other" option expands a small text input.
- When the user answers (or dismisses), the answer is included in the next synthesis call as additional context.
- If the user ignores the question and keeps typing, the **unanswered question is passed back** to Claude in the next synthesis call (e.g., `"Previously asked (unanswered): ..."`) so Claude can decide whether to drop it (context now answers it), re-ask it (still ambiguous), or ask a different question (context shifted). Without this, Claude would have no memory of what it already asked and might repeat the same question every cycle.

**State management:** The current question (if any) is stored in component state, not the database. Questions are ephemeral — they exist only to improve the next synthesis cycle. The state tracks both the question text and whether it was answered, so the prompt builder knows what to pass back.

### 5. Prompt Design

The synthesis prompt includes these sections in order:

1. **System prompt:** Role definition — you are a note synthesis assistant. Output clean, organized markdown. Be concise. Preserve the user's meaning and intent.
2. **User context profile** (if available): A short summary of the user's note-taking patterns and topics (see §7).
3. **Existing title** (if any): So Claude knows whether to propose or clean.
4. **Note content:** The plain text extracted from Tiptap JSON.
5. **Previous question context** (if any): Either the question + user's answer, or the question marked as unanswered. This lets Claude avoid repeating itself and decide whether the question is still relevant given new content.
6. **Output format instructions:** Return the structured JSON schema above. Use `tool_use` / structured output to enforce the schema.

**Prompt constants** are stored in a dedicated file (`src/lib/ai/prompts.ts`), not inline in the route handler. All model names and parameters are config constants (`src/lib/ai/config.ts`).

### 6. Auto-Title Generation

Auto-titling is part of the synthesis call (same API request, same prompt), not a separate endpoint.

**Rules:**
- **No title exists + enough content:** Claude proposes a title. "Enough content" is subjective to Claude — the prompt instructs it to title only when it can do so meaningfully (not "Untitled Note" or "Various Topics").
- **Title exists:** Claude may lightly clean (fix typos, capitalize properly) but never changes meaning. Returns `action: "clean"` so the client can distinguish.
- **Not enough content:** Returns `title: null`. The UI shows nothing.

**Client behavior:**
- `action: "propose"` → set the title (user can always manually override later).
- `action: "clean"` → update only if the cleaned version differs from current.
- `null` → no change.

### 7. User Context Profile

A short, evolving text summary of the user derived from their note history. Fed into every synthesis call to help Claude make better guesses.

**Example:** _"This user frequently writes about software engineering, cooking recipes, and personal finance. Notes tend to be bullet-point style with action items."_

**Implementation (phase 1 — simple):**
- Stored as a text column on the `users` table: `context_profile TEXT NULL`.
- Rebuilt periodically: after every Nth synthesis call (e.g., every 10), a background step asks Claude to summarize the user's note patterns based on their last ~20 note titles + synthesis summaries.
- Not rebuilt on every call — that's wasteful and the profile changes slowly.
- For new users with no notes: omitted entirely from the prompt. No profile is better than a wrong profile.

**Guardrails:**
- The profile is context, not instruction. The prompt makes clear that Claude should use it as a soft signal, not a hard constraint.
- One cooking note should not make Claude assume all future notes are about cooking. The prompt explicitly says: "Use the profile to inform your synthesis when the content aligns, but always prioritize what the user actually wrote in this note."

### 8. Tags

Tags are generated as part of synthesis and stored in the existing `tags` and `note_tags` tables.

**Tag grammar (enforced in prompt + server-side normalization):**
- **Lowercase, hyphenated:** `personal-finance`, not `Personal Finance` or `personal_finance`
- **Singular:** `recipe` not `recipes`, `meeting` not `meetings`
- **Noun/topic form:** Tags describe topics, not actions. Gerunds are fine since they function as nouns (`cooking`, `writing`, `planning`). Never past tense (`cooked`), never infinitive (`to cook`), never plural.
- **Max 30 characters, max 2 words** (after hyphenation)
- Examples: `cooking`, `personal-finance`, `work`, `health`, `writing`, `side-project`

**Server-side normalization** runs as a safety net before DB insert: lowercase, trim whitespace, replace spaces with hyphens, strip non-alphanumeric characters (except hyphens). This catches anything the prompt doesn't.

**Tag lifecycle:**
- Claude suggests 1-3 tags per note as part of the synthesis response (extend the schema with a `tags: string[]` field).
- Tags are created-or-reused: if a normalized tag name matches an existing tag, link it; otherwise create it.
- The user's full existing tag list is sent as a vocabulary in the prompt. The prompt instructs Claude to **prefer reusing an existing tag** over creating a new one, even if the fit is approximate (e.g., use existing `cooking` rather than minting `recipe`).
- Tags are not user-editable in phase 1 (auto-generated only). Manual tag editing is a future enhancement.

**Updated response schema:**
```typescript
interface SynthesisResponse {
  synthesis: { markdown: string; confidence: "high" | "medium" | "low" } | null
  title: { suggested: string; action: "propose" | "clean" } | null
  question: { text: string; options: string[] } | null
  tags: string[]  // 0-3 suggested tags
}
```

## File Inventory

New files:

| File | Purpose |
|------|---------|
| `src/lib/ai/config.ts` | Model name, token limits, character-delta threshold, other AI constants |
| `src/lib/ai/prompts.ts` | System prompt, prompt builder functions |
| `src/lib/ai/synthesis.ts` | Core synthesis logic — calls Claude, parses response |
| `src/app/api/notes/[id]/synthesize/route.ts` | POST endpoint for triggering synthesis |

Modified files:

| File | Change |
|------|--------|
| `src/components/NoteEditor.tsx` | Add character-delta tracking, trigger synthesis on threshold + page leave |
| `src/components/SynthesisPanel.tsx` | Render clarifying questions inline, loading state, handle question answers |
| `src/app/(app)/notes/[id]/page.tsx` | Wire synthesis state between editor and panel |
| `src/lib/api.ts` | Add `synthesizeNote()` client function |
| `src/db/types.ts` | Add `context_profile` to UsersTable (if profile migration is in scope) |
| `package.json` | Add `@anthropic-ai/sdk` dependency |
| `.env.example` | Add `ANTHROPIC_API_KEY` |

New migration:

| File | Purpose |
|------|---------|
| `src/db/migrations/004_user_context_profile.ts` | Add `context_profile TEXT NULL` to users table |

## Acceptance Criteria

- [ ] Synthesis triggers based on scaling character-delta (`max(100, noteLength * 0.1)`), not time-based
- [ ] Navigating away from a note triggers save + final synthesis
- [ ] Synthesis does not trigger on notes shorter than ~50 characters
- [ ] Synthesis result renders as markdown in the synthesis panel
- [ ] Auto-title proposes a title only when confident (not on near-empty notes)
- [ ] Auto-title cleans existing titles without changing meaning
- [ ] Clarifying questions appear inline below synthesis, not as modals or blocking UI
- [ ] Clarifying questions include multiple-choice options with an "Other" freeform option
- [ ] Ignoring a clarifying question does not break the synthesis loop
- [ ] Answering a clarifying question feeds the answer into the next synthesis call
- [ ] All Claude API calls are server-side only (no API key in browser)
- [ ] Model name and synthesis parameters are config constants, not hardcoded
- [ ] Prompts are in a dedicated file, not inline in route handlers
- [ ] Tags are generated and stored in the DB via existing tags/note_tags tables
- [ ] User context profile is stored on the users table and included in prompts when available
- [ ] New users with no profile get synthesis without profile context (no errors, no empty string)
- [ ] `ANTHROPIC_API_KEY` is documented in `.env.example` and configured in Vercel

## Open Questions

- **Scaling threshold tuning:** The `max(100, noteLength * 0.1)` formula is a starting point. The 10% ratio may need adjustment based on real usage — too low burns API credits, too high makes synthesis feel stale. Should this be user-configurable eventually?
- **Profile rebuild frequency:** Every 10 synthesis calls is arbitrary. Could also trigger on "new tag created" or "note count milestone". Keep it simple for phase 1.
- **Token budget:** What's the max input/output token limit per synthesis call? Needs a decision before implementation — directly affects cost. Long notes could send a lot of tokens.
- **Tiptap JSON → plain text extraction:** Need a reliable server-side method. Tiptap has `generateText()` but it requires a full editor instance. May need a lightweight extraction utility or use `prosemirror-model` directly.

## Decision Log

- **Character-delta trigger over time-based debounce:** Time-based debounce fires on every pause, even for trivial edits (fixing a typo). Character-delta only fires when meaningful content is added, directly reducing unnecessary API calls.
- **Title confidence gating:** Auto-title holds off until Claude is confident rather than guessing early. Prevents unhelpful titles like "Untitled" or "Various Notes" that the user would immediately override.
- **Clarifying questions alongside synthesis, not replacing it:** Claude always attempts a best-guess synthesis. Questions are supplementary, not blocking. Users can ignore them and keep typing — the growing context often resolves the ambiguity.
- **User context profile as soft signal:** The profile informs but doesn't constrain. Explicit prompt guardrails prevent one-note-topic bias.
- **Scaling character-delta threshold:** Fixed thresholds either over-trigger on long notes or under-trigger on short ones. `max(100, noteLength * 0.1)` scales naturally with note size.
- **No streaming for phase 1:** Vercel Hobby plan supports 300s function duration (with fluid compute), so timeout is a non-issue. Synthesis replaces the full panel content each time — progressive token rendering adds little value. Streaming is a better fit for a future chat-style feature where output builds up incrementally.

## References

- [ADR-004: Claude API Server-Side Only](../ADR/004-claude-api-server-only.md)
- [Session Notes: 2026-03-14](../temp/session-notes-2026-03-14.md) — original design discussion
- [Anthropic Claude API Docs](https://docs.anthropic.com/en/docs)
- GitHub Issue #14 — AI Synthesis
