import { db } from '.'

export async function getCurrentUser() {
  const user = await db.selectFrom('users')
    .selectAll()
    .limit(1)
    .executeTakeFirst()

  if (!user) throw new Error('No user found — run db:seed')

  return user
}
