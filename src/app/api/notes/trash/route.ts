import { NextResponse } from 'next/server'
import { db } from '@/db'
import { getCurrentUser } from '@/db/queries'

/** List trashed notes. Purges notes older than 30 days before returning. */
export async function GET() {
  try {
    const user = await getCurrentUser()

    // Purge expired trash (older than 30 days)
    await db.deleteFrom('notes')
      .where('user_id', '=', user.id)
      .where('deleted_at', 'is not', null)
      .where('deleted_at', '<', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .execute()

    // Fetch remaining trash
    const notes = await db.selectFrom('notes')
      .selectAll()
      .where('user_id', '=', user.id)
      .where('deleted_at', 'is not', null)
      .orderBy('deleted_at', 'desc')
      .execute()

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('GET /api/notes/trash failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
