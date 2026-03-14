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

/** Update color theme. Clerk owns display_name. */
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

    if (body.color_theme === undefined) {
      return NextResponse.json(user)
    }

    const updated = await db.updateTable('users')
      .set({ color_theme: body.color_theme, updated_at: new Date() })
      .where('id', '=', user.id)
      .returningAll()
      .executeTakeFirstOrThrow()

    return NextResponse.json(updated)
  } catch (error) {
    console.error('PATCH /api/users/me failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
