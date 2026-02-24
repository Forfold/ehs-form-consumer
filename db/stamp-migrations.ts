/**
 * One-time script: marks the four migrations that were applied manually before
 * db:migrate was ever run. Run this once, then use `npm run db:migrate` normally.
 *
 *   ts-node --project tsconfig.scripts.json db/stamp-migrations.ts
 */
import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { Pool } from 'pg'

// Load .env.local for local development
try {
  for (const line of fs.readFileSync('.env.local', 'utf-8').split('\n')) {
    const idx = line.indexOf('=')
    if (idx === -1 || line.trimStart().startsWith('#')) continue
    const key = line.slice(0, idx).trim()
    const val = line.slice(idx + 1).trim()
    if (key && !process.env[key]) process.env[key] = val
  }
} catch { /* no .env.local — rely on actual environment */ }

const MIGRATIONS_FOLDER = path.join(__dirname, 'migrations')

// Tags from _journal.json that are already applied in the DB (everything except 0006).
const ALREADY_APPLIED = [
  { tag: '0000_classy_zaladane', when: 1771726297151 },
  { tag: '0001_parched_texas_twister', when: 1771745532624 },
  { tag: '0005_pdf_storage', when: 1740182400000 },
  { tag: '0003_demonic_goliath', when: 1771807996084 },
]

async function main() {
  const pool = new Pool({ connectionString: process.env.POSTGRES_URL })

  try {
    // Drizzle stores migrations in the "drizzle" schema
    await pool.query(`CREATE SCHEMA IF NOT EXISTS drizzle`)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id         SERIAL PRIMARY KEY,
        hash       text   NOT NULL,
        created_at BIGINT
      )
    `)

    // Remove any rows mistakenly inserted into public.__drizzle_migrations
    await pool.query(`DROP TABLE IF EXISTS public.__drizzle_migrations`)

    for (const { tag, when } of ALREADY_APPLIED) {
      const filePath = path.join(MIGRATIONS_FOLDER, `${tag}.sql`)
      const content = fs.readFileSync(filePath, 'utf-8')
      const hash = crypto.createHash('sha256').update(content).digest('hex')

      // Idempotent — skip if already stamped
      const existing = await pool.query(
        `SELECT id FROM drizzle.__drizzle_migrations WHERE hash = $1`,
        [hash],
      )
      if (existing.rows.length > 0) {
        console.log(`  already stamped: ${tag}`)
        continue
      }

      await pool.query(
        `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
        [hash, when],
      )
      console.log(`  stamped: ${tag}`)
    }

    console.log('Done. Run `npm run db:migrate` to apply 0006_submission_key_fields.')
  } finally {
    await pool.end()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
