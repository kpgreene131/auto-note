import { redirect } from "next/navigation"
import { mockNotes } from "@/mock/notes"

export default function Home() {
  if (mockNotes.length > 0) {
    redirect(`/notes/${mockNotes[0].id}`)
  }

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p>No notes yet. Create one to get started.</p>
    </div>
  )
}
