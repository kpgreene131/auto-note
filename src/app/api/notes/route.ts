import { NextResponse } from 'next/server'
import { db } from '@/db'
import { getCurrentUser } from '@/db/queries'

/** List all notes for the current user, ordered by most recently updated. */
export async function GET() {
  try {
    const user = await getCurrentUser()

    const notes = await db.selectFrom('notes')
      .selectAll()
      .where('user_id', '=', user.id)
      .orderBy('updated_at', 'desc')
      .execute()

    return NextResponse.json({ notes })
  } catch (error) {
    console.error('GET /api/notes failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Create a new note with optional title and content. Returns 201. */
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    const body = await request.json().catch(() => ({}))

    const note = await db.insertInto('notes')
      .values({
        user_id: user.id,
        title: body.title ?? null,
        content: body.content ?? JSON.stringify({ type: 'doc', content: [] }),
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return NextResponse.json(note, { status: 201 })
  } catch (error) {
    console.error('POST /api/notes failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
