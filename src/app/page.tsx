import { redirect } from "next/navigation"
import { db } from "@/db"
import { getCurrentUser } from "@/db/queries"

export default async function Home() {
  const user = await getCurrentUser()

  const firstNote = await db.selectFrom('notes')
    .select('id')
    .where('user_id', '=', user.id)
    .orderBy('updated_at', 'desc')
    .limit(1)
    .executeTakeFirst()

  if (firstNote) {
    redirect(`/notes/${firstNote.id}`)
  }

  return (
    <div className="flex items-center justify-center h-full text-muted-foreground">
      <p>No notes yet. Create one to get started.</p>
    </div>
  )
}
