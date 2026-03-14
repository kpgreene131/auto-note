import { NextResponse } from 'next/server'
import { db } from '@/db'
import { getCurrentUser } from '@/db/queries'

/** Permanently delete a trashed note. Only works on already soft-deleted notes. */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    const note = await db.deleteFrom('notes')
      .where('id', '=', id)
      .where('user_id', '=', user.id)
      .where('deleted_at', 'is not', null)
      .returningAll()
      .executeTakeFirst()

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error('DELETE /api/notes/[id]/permanent failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
