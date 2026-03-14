import { Kysely } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .addColumn('clerk_id', 'text')
    .execute()

  await db.schema
    .alterTable('users')
    .addUniqueConstraint('users_clerk_id_unique', ['clerk_id'])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('users')
    .dropConstraint('users_clerk_id_unique')
    .execute()

  await db.schema
    .alterTable('users')
    .dropColumn('clerk_id')
    .execute()
}
