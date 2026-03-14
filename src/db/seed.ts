import { db } from '.'

async function seed() {
  const existing = await db.selectFrom('users').selectAll().limit(1).executeTakeFirst()

  if (existing) {
    console.log(`User already exists: ${existing.display_name} (${existing.id})`)
  } else {
    const user = await db
      .insertInto('users')
      .values({
        display_name: 'Default User',
        color_theme: 'theme-dark',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    console.log(`Created default user: ${user.display_name} (${user.id})`)
  }

  await db.destroy()
}

seed()
