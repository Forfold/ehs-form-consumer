import fs from 'node:fs'
import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

// Load .env.local for local development (Next.js does this automatically for the app,
// but ts-node scripts run outside that context)
try {
  for (const line of fs.readFileSync('.env.local', 'utf-8').split('\n')) {
    const idx = line.indexOf('=')
    if (idx === -1 || line.trimStart().startsWith('#')) continue
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    if (key && !process.env[key]) process.env[key] = val
  }
} catch {
  /* no .env.local — rely on actual environment */
}

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
})

const db = drizzle(pool)

migrate(db, { migrationsFolder: './db/migrations' })
  .then(() => {
    console.log('Migrations applied successfully')
    return pool.end()
  })
  .catch((err: Error) => {
    console.error('Migration failed:', err)
    pool.end()
    process.exit(1)
  })
