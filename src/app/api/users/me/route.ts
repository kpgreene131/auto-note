import { NextResponse } from 'next/server'
import { db } from '@/db'
import { getCurrentUser } from '@/db/queries'
import { themes } from '@/lib/themes'

const validThemeIds = new Set(themes.map((t) => t.id))

/** Return the current user's profile and preferences. */
export async function GET() {
  try {
    const user = await getCurrentUser()
    return NextResponse.json(user)
  } catch (error) {
    console.error('GET /api/users/me failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/** Update display name or color theme. Validates theme against known theme IDs. */
export async function PATCH(request: Request) {
  try {
    const user = await getCurrentUser()
    const body = await request.json().catch(() => ({}))

    if (body.color_theme !== undefined && !validThemeIds.has(body.color_theme)) {
      return NextResponse.json(
        { error: `Invalid theme. Valid themes: ${[...validThemeIds].join(', ')}` },
        { status: 400 }
      )
    }

    const fields: Record<string, unknown> = { updated_at: new Date() }
    if (body.display_name !== undefined) fields.display_name = body.display_name
    if (body.color_theme !== undefined) fields.color_theme = body.color_theme

    if (Object.keys(fields).length === 1) {
      // Only updated_at, no actual changes requested
      return NextResponse.json(user)
    }

    const updated = await db.updateTable('users')
      .set(fields)
      .where('id', '=', user.id)
      .returningAll()
      .executeTakeFirstOrThrow()

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/users/me failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
