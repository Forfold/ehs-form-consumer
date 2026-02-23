import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from '../../db/schema'

function getDb() {
  const url = process.env.POSTGRES_URL
  if (!url)
    throw new Error(
      'POSTGRES_URL is not set. Add it to .env.local (see Vercel Storage dashboard).',
    )
  return drizzle(neon(url), { schema })
}

// Singleton — reused across hot-reloads in dev
const globalForDb = globalThis as unknown as { db?: ReturnType<typeof getDb> }
export const db = globalForDb.db ?? (globalForDb.db = getDb())

export type Db = typeof db
