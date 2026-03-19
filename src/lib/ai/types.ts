// --- Tiptap document types ---

export interface TiptapMark {
  type: string
  attrs?: Record<string, unknown>
}

export interface TiptapNode {
  type: string
  content?: TiptapNode[]
  text?: string
  marks?: TiptapMark[]
  attrs?: Record<string, unknown>
}

export interface TiptapDocument {
  type: "doc"
  content?: TiptapNode[]
}

// --- Synthesis API types ---

export interface SynthesisResponse {
  synthesis: {
    markdown: string
    confidence: "high" | "medium" | "low"
  } | null
  title: {
    suggested: string
    action: "propose" | "clean"
  } | null
  question: {
    text: string
    options: string[]
  } | null
  tags: string[]
}

export interface SynthesisRequest {
  content: TiptapDocument
  questionContext?: {
    text: string
    answer?: string
  }
}

// --- Client-side question state ---

export interface QuestionState {
  text: string
  options: string[]
  answer?: string
  unanswered?: boolean
}
