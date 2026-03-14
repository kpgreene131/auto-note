import path from 'node:path'
import { promises as fs } from 'node:fs'
import { Migrator, FileMigrationProvider } from 'kysely'
import { db } from './index'

async function migrate() {
  const migrator = new Migrator({
    db,
    provider: new FileMigrationProvider({
      fs,
      path,
      migrationFolder: path.join(__dirname, 'migrations'),
    }),
  })

  const { error, results } = await migrator.migrateToLatest()

  results?.forEach((result) => {
    if (result.status === 'Success') {
      console.log(`Migration "${result.migrationName}" executed successfully`)
    } else if (result.status === 'Error') {
      console.error(`Migration "${result.migrationName}" failed`)
    }
  })

  if (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }

  await db.destroy()
}

migrate()
