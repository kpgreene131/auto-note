import { NextResponse } from 'next/server'
import { db } from '@/db'
import { getCurrentUser } from '@/db/queries'

/** Restore a soft-deleted note from trash. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    const note = await db.updateTable('notes')
      .set({ deleted_at: null, updated_at: new Date() })
      .where('id', '=', id)
      .where('user_id', '=', user.id)
      .where('deleted_at', 'is not', null)
      .returningAll()
      .executeTakeFirst()

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error('POST /api/notes/[id]/restore failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
