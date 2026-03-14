import { NextResponse } from 'next/server'
import { db } from '@/db'
import { getCurrentUser } from '@/db/queries'

/** Fetch a single note by ID. Returns 404 if not found or not owned by user. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params

    const note = await db.selectFrom('notes')
      .selectAll()
      .where('id', '=', id)
      .where('user_id', '=', user.id)
      .executeTakeFirst()

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error(`GET /api/notes/[id] failed:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Update a note's title, content, or synthesis. Sets updated_at automatically. */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const body = await request.json().catch(() => ({}))

    const fields: Record<string, unknown> = { updated_at: new Date() }
    if (body.title !== undefined) fields.title = body.title
    if (body.content !== undefined) fields.content = body.content
    if (body.synthesis !== undefined) fields.synthesis = body.synthesis

    const note = await db.updateTable('notes')
      .set(fields)
      .where('id', '=', id)
      .where('user_id', '=', user.id)
      .returningAll()
      .executeTakeFirst()

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json(note)
  } catch (error) {
    console.error(`PUT /api/notes/[id] failed:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Delete a note by ID. Returns { deleted: true } on success. */
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
      .returningAll()
      .executeTakeFirst()

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    return NextResponse.json({ deleted: true })
  } catch (error) {
    console.error(`DELETE /api/notes/[id] failed:`, error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
