import Anthropic from '@anthropic-ai/sdk'
import { AI_CONFIG } from './config'
import { SYSTEM_PROMPT, buildSynthesisMessages, SYNTHESIS_TOOL } from './prompts'
import type { TiptapDocument, TiptapNode, SynthesisResponse, QuestionState } from './types'

const anthropic = new Anthropic()

// --- Pure utilities ---

export function extractPlainText(doc: TiptapDocument): string {
  if (!doc.content) return ''
  return extractFromNodes(doc.content).trim()
}

function extractFromNodes(nodes: TiptapNode[]): string {
  const parts: string[] = []

  for (const node of nodes) {
    if (node.text) {
      parts.push(node.text)
    } else if (node.content) {
      parts.push(extractFromNodes(node.content))
    }

    // Add whitespace between block-level nodes
    if (isBlockNode(node.type)) {
      parts.push('\n')
    }
  }

  return parts.join('')
}

function isBlockNode(type: string): boolean {
  return ['paragraph', 'heading', 'blockquote', 'codeBlock', 'bulletList', 'orderedList', 'listItem', 'horizontalRule', 'hardBreak'].includes(type)
}

export function normalizeTag(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, AI_CONFIG.tagMaxLength)
}

// --- Core synthesis ---

export async function synthesize(params: {
  plainText: string
  existingTitle: string | null
  existingTags: string[]
  userProfile: string | null
  questionContext: QuestionState | null
}): Promise<SynthesisResponse> {
  const userMessage = buildSynthesisMessages(params)

  const response = await anthropic.messages.create({
    model: AI_CONFIG.model,
    max_tokens: AI_CONFIG.maxOutputTokens,
    system: SYSTEM_PROMPT,
    tools: [SYNTHESIS_TOOL],
    tool_choice: { type: 'tool', name: SYNTHESIS_TOOL.name },
    messages: [{ role: 'user', content: userMessage }],
  })

  // Extract the tool_use block
  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  )

  if (!toolBlock) {
    throw new Error('No tool_use block in synthesis response')
  }

  const result = toolBlock.input as SynthesisResponse

  // Normalize tags
  result.tags = (result.tags ?? [])
    .map(normalizeTag)
    .filter(Boolean)
    .slice(0, AI_CONFIG.tagMaxCount)

  // Ensure "Other" is last option in question
  if (result.question?.options) {
    const opts = result.question.options.filter(o => o !== 'Other')
    opts.push('Other')
    result.question.options = opts
  }

  return result
}

// --- User profile rebuild ---

export async function rebuildUserProfile(
  noteSummaries: { title: string | null; synthesis: string | null }[]
): Promise<string> {
  const noteList = noteSummaries
    .map((n, i) => {
      const parts = [`Note ${i + 1}:`]
      if (n.title) parts.push(`Title: ${n.title}`)
      if (n.synthesis) parts.push(`Summary: ${n.synthesis.slice(0, 200)}`)
      return parts.join(' ')
    })
    .join('\n')

  const response = await anthropic.messages.create({
    model: AI_CONFIG.model,
    max_tokens: 256,
    messages: [{
      role: 'user',
      content: `Based on these recent notes, write a 2-3 sentence summary of this user's note-taking patterns and common topics. Be specific and factual.\n\n${noteList}`,
    }],
  })

  const textBlock = response.content.find(
    (block): block is Anthropic.TextBlock => block.type === 'text'
  )

  return textBlock?.text ?? ''
}
