import { auth } from '@clerk/nextjs/server'
import { db } from '.'

export async function getCurrentUser() {
  const { userId } = await auth()
  if (!userId) throw new Error('Not authenticated')

  let user = await db.selectFrom('users')
    .selectAll()
    .where('clerk_id', '=', userId)
    .executeTakeFirst()

  // Auto-provision on first sign-in
  if (!user) {
    user = await db.insertInto('users')
      .values({ clerk_id: userId })
      .returningAll()
      .executeTakeFirstOrThrow()
  }

  return user
}
