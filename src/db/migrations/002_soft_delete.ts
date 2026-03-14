import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('notes')
    .addColumn('deleted_at', sql`timestamptz`)
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable('notes')
    .dropColumn('deleted_at')
    .execute()
}
