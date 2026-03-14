import { Kysely, sql } from 'kysely'

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .createTable('users')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('display_name', 'text')
    .addColumn('color_theme', 'text', (col) =>
      col.notNull().defaultTo('theme-dark')
    )
    .addColumn('created_at', sql`timestamptz`, (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', sql`timestamptz`, (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .execute()

  await db.schema
    .createTable('notes')
    .addColumn('id', 'uuid', (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('title', 'text')
    .addColumn('content', 'jsonb', (col) => col.notNull())
    .addColumn('synthesis', 'text')
    .addColumn('created_at', sql`timestamptz`, (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('updated_at', sql`timestamptz`, (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn('synthesized_at', sql`timestamptz`)
    .execute()

  await db.schema
    .createTable('tags')
    .addColumn('id', 'integer', (col) =>
      col.primaryKey().generatedAlwaysAsIdentity()
    )
    .addColumn('user_id', 'uuid', (col) =>
      col.notNull().references('users.id').onDelete('cascade')
    )
    .addColumn('name', 'text', (col) => col.notNull())
    .addColumn('created_at', sql`timestamptz`, (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addUniqueConstraint('tags_user_id_name_unique', ['user_id', 'name'])
    .execute()

  await db.schema
    .createTable('note_tags')
    .addColumn('note_id', 'uuid', (col) =>
      col.notNull().references('notes.id').onDelete('cascade')
    )
    .addColumn('tag_id', 'integer', (col) =>
      col.notNull().references('tags.id').onDelete('cascade')
    )
    .addPrimaryKeyConstraint('note_tags_pk', ['note_id', 'tag_id'])
    .execute()
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema.dropTable('note_tags').execute()
  await db.schema.dropTable('tags').execute()
  await db.schema.dropTable('notes').execute()
  await db.schema.dropTable('users').execute()
}
