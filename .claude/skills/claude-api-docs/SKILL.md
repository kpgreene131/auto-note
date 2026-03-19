---
name: claude-api-docs
description: Fetch Anthropic Claude API documentation for model usage, tool_use, structured outputs, and SDK reference
user-invocable: true
---

Fetch targeted Anthropic documentation pages for Claude API reference.

There is no single `llms-full.txt` for Anthropic docs. Instead, fetch specific pages as Markdown by appending `.md` to the docs URL.

Base URL: `https://docs.anthropic.com/en/docs/`

## Key pages

- **Tool use (structured output):** `https://docs.anthropic.com/en/docs/build-with-claude/tool-use.md`
- **Structured outputs:** `https://docs.anthropic.com/en/docs/build-with-claude/structured-outputs.md`
- **Messages API:** `https://docs.anthropic.com/en/docs/build-with-claude/working-with-messages.md`
- **Models:** `https://docs.anthropic.com/en/docs/about-claude/models.md`
- **Initial setup / SDK:** `https://docs.anthropic.com/en/docs/initial-setup.md`
- **Prompt caching:** `https://docs.anthropic.com/en/docs/build-with-claude/prompt-caching.md`

## Usage

When the user asks about Claude API patterns, tool_use, structured output, or SDK usage:

1. Identify the most relevant page(s) from the list above
2. Fetch the `.md` URL directly
3. Use the fetched content to provide accurate, up-to-date answers
4. Cite specific examples or patterns from the docs

Note: Prefilling is deprecated on Claude Sonnet 4.5+. Use tool_use with `tool_choice` or structured outputs for guaranteed JSON schemas.
