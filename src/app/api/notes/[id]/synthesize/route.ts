import { NextResponse } from 'next/server'
import { db } from '@/db'
import { getCurrentUser } from '@/db/queries'
import { extractPlainText, synthesize, normalizeTag, rebuildUserProfile } from '@/lib/ai/synthesis'
import { AI_CONFIG } from '@/lib/ai/config'
import type { TiptapDocument, SynthesisRequest } from '@/lib/ai/types'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    const { id } = await params
    const body: SynthesisRequest = await request.json()

    // Verify note ownership
    const note = await db.selectFrom('notes')
      .selectAll()
      .where('id', '=', id)
      .where('user_id', '=', user.id)
      .where('deleted_at', 'is', null)
      .executeTakeFirst()

    if (!note) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    }

    // Extract plain text from the provided content
    const plainText = extractPlainText(body.content as TiptapDocument)
    if (plainText.length < AI_CONFIG.synthesisMinChars) {
      return NextResponse.json({ error: 'Note too short for synthesis' }, { status: 422 })
    }

    // Fetch user's existing tag vocabulary
    const existingTags = await db.selectFrom('tags')
      .select('name')
      .where('user_id', '=', user.id)
      .execute()

    // Build question context from request
    const questionContext = body.questionContext
      ? { text: body.questionContext.text, options: [], answer: body.questionContext.answer, unanswered: !body.questionContext.answer }
      : null

    // Call Claude
    const result = await synthesize({
      plainText,
      existingTitle: note.title,
      existingTags: existingTags.map(t => t.name),
      userProfile: user.context_profile,
      questionContext,
    })

    // Update note: synthesis + synthesized_at
    const noteUpdates: Record<string, unknown> = {
      synthesis: result.synthesis?.markdown ?? null,
      synthesized_at: new Date(),
      updated_at: new Date(),
    }

    // Handle title
    if (result.title) {
      if (result.title.action === 'propose' && !note.title) {
        noteUpdates.title = result.title.suggested
      } else if (result.title.action === 'clean' && note.title && result.title.suggested !== note.title) {
        noteUpdates.title = result.title.suggested
      }
    }

    await db.updateTable('notes')
      .set(noteUpdates)
      .where('id', '=', id)
      .execute()

    // Handle tags: delete existing note_tags, upsert tags, re-link
    if (result.tags.length > 0) {
      await db.deleteFrom('note_tags')
        .where('note_id', '=', id)
        .execute()

      for (const tagName of result.tags) {
        const normalized = normalizeTag(tagName)
        if (!normalized) continue

        // Upsert tag
        let tag = await db.selectFrom('tags')
          .selectAll()
          .where('user_id', '=', user.id)
          .where('name', '=', normalized)
          .executeTakeFirst()

        if (!tag) {
          tag = await db.insertInto('tags')
            .values({ user_id: user.id, name: normalized })
            .returningAll()
            .executeTakeFirstOrThrow()
        }

        // Link note to tag
        await db.insertInto('note_tags')
          .values({ note_id: id, tag_id: tag.id })
          .execute()
      }
    }

    // Check if profile rebuild is due
    const recentSynthesisCount = await db.selectFrom('notes')
      .select(db.fn.countAll().as('count'))
      .where('user_id', '=', user.id)
      .where('synthesized_at', 'is not', null)
      .executeTakeFirstOrThrow()

    const count = Number(recentSynthesisCount.count)
    if (count > 0 && count % AI_CONFIG.profileRebuildInterval === 0) {
      // Rebuild profile in the background (don't block response)
      rebuildProfileAsync(user.id).catch(err =>
        console.error('Profile rebuild failed:', err)
      )
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('POST /api/notes/[id]/synthesize failed:', error)
    return NextResponse.json({ error: 'Synthesis failed' }, { status: 500 })
  }
}

async function rebuildProfileAsync(userId: string) {
  const recentNotes = await db.selectFrom('notes')
    .select(['title', 'synthesis'])
    .where('user_id', '=', userId)
    .where('deleted_at', 'is', null)
    .where('synthesized_at', 'is not', null)
    .orderBy('synthesized_at', 'desc')
    .limit(20)
    .execute()

  if (recentNotes.length < 3) return // Too few notes for meaningful profile

  const profile = await rebuildUserProfile(recentNotes)
  if (profile) {
    await db.updateTable('users')
      .set({ context_profile: profile, updated_at: new Date() })
      .where('id', '=', userId)
      .execute()
  }
}
