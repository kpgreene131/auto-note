"use client"

import { useEffect } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"

interface NoteEditorProps {
  content: string
}

export function NoteEditor({ content }: NoteEditorProps) {
  const editor = useEditor({
    extensions: [StarterKit],
    content,
    immediatelyRender: false,
  })

  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content)
    }
  }, [editor, content])

  return (
    <EditorContent editor={editor} className="h-full prose dark:prose-invert max-w-none [&_*:first-child]:mt-0 [&>.tiptap]:min-h-full" />
  )
}
