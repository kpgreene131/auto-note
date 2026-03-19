import type { QuestionState } from './types'

export const SYSTEM_PROMPT = `You are a note synthesis assistant. Your job is to take messy, unstructured notes and produce clean, organized markdown summaries.

Rules:
- Be concise. Preserve the user's meaning and intent without adding fluff.
- Use markdown formatting (headings, lists, bold) to organize content clearly.
- Always attempt a best-guess synthesis, even when uncertain.
- Only ask a clarifying question when your confidence is low AND the ambiguity materially affects the output quality. Maximum one question per response.
- For titles: only propose when you can do so meaningfully. Return null if the content is too short or vague to title confidently. Never suggest generic titles like "Untitled" or "Various Topics".
- For tags: prefer reusing tags from the provided vocabulary over creating new ones. Use lowercase-hyphenated, singular, noun/topic form. Max 3 tags.
- If a user context profile is provided, use it as a soft signal to inform your synthesis when the content aligns. Always prioritize what the user actually wrote in this note over profile assumptions.
- The note content may be incomplete or mid-thought. Synthesize what exists without commenting on incompleteness.`

export function buildSynthesisMessages(params: {
  plainText: string
  existingTitle: string | null
  existingTags: string[]
  userProfile: string | null
  questionContext: QuestionState | null
}): string {
  const parts: string[] = []

  if (params.userProfile) {
    parts.push(`<user-profile>\n${params.userProfile}\n</user-profile>`)
  }

  if (params.existingTitle) {
    parts.push(`<existing-title>${params.existingTitle}</existing-title>`)
  }

  parts.push(`<note-content>\n${params.plainText}\n</note-content>`)

  if (params.existingTags.length > 0) {
    parts.push(`<existing-tags>${params.existingTags.join(', ')}</existing-tags>`)
  }

  if (params.questionContext) {
    if (params.questionContext.answer) {
      parts.push(`<previous-question answered="${params.questionContext.answer}">${params.questionContext.text}</previous-question>`)
    } else if (params.questionContext.unanswered) {
      parts.push(`<previous-question unanswered="true">${params.questionContext.text}</previous-question>`)
    }
  }

  return parts.join('\n\n')
}

export const SYNTHESIS_TOOL = {
  name: "synthesis_response" as const,
  description: "Return the synthesis result with optional title, question, and tags.",
  input_schema: {
    type: "object" as const,
    properties: {
      synthesis: {
        type: ["object", "null"] as const,
        description: "The markdown synthesis of the note content. Null only if content is too short or meaningless to synthesize.",
        properties: {
          markdown: {
            type: "string" as const,
            description: "Clean, organized markdown summary of the note content.",
          },
          confidence: {
            type: "string" as const,
            enum: ["high", "medium", "low"],
            description: "How confident you are in the synthesis quality.",
          },
        },
        required: ["markdown", "confidence"],
      },
      title: {
        type: ["object", "null"] as const,
        description: "Proposed or cleaned title. Null if not confident enough to title.",
        properties: {
          suggested: {
            type: "string" as const,
            description: "The proposed or cleaned title.",
          },
          action: {
            type: "string" as const,
            enum: ["propose", "clean"],
            description: "propose = no title exists, suggesting new one. clean = refining existing title.",
          },
        },
        required: ["suggested", "action"],
      },
      question: {
        type: ["object", "null"] as const,
        description: "A clarifying question to ask the user. Only when confidence is low and ambiguity materially affects output.",
        properties: {
          text: {
            type: "string" as const,
            description: "The clarifying question.",
          },
          options: {
            type: "array" as const,
            items: { type: "string" as const },
            description: "2-4 choices. Always include 'Other' as the last option.",
          },
        },
        required: ["text", "options"],
      },
      tags: {
        type: "array" as const,
        items: { type: "string" as const },
        description: "1-3 tags describing the note's topics. Lowercase-hyphenated, singular, noun/topic form. Prefer reusing from existing-tags vocabulary.",
      },
    },
    required: ["synthesis", "title", "question", "tags"],
  },
}
