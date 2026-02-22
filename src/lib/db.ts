import { neon } from '@neondatabase/serverless'

function getDb() {
  const url = process.env.POSTGRES_URL
  if (!url) throw new Error('POSTGRES_URL is not set. Add it to .env.local (see Vercel Storage dashboard).')
  return neon(url)
}

export async function ensureHistoryTable() {
  const sql = getDb()
  await sql`
    CREATE TABLE IF NOT EXISTS form_history (
      id            BIGSERIAL PRIMARY KEY,
      facility_name TEXT,
      file_name     TEXT NOT NULL,
      processed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `
}

export async function getHistory() {
  const sql = getDb()
  await ensureHistoryTable()
  return sql`
    SELECT id, facility_name, file_name, processed_at
    FROM form_history
    ORDER BY processed_at DESC
    LIMIT 100
  `
}

export async function insertHistory(facilityName: string | null, fileName: string) {
  const sql = getDb()
  await ensureHistoryTable()
  const rows = await sql`
    INSERT INTO form_history (facility_name, file_name)
    VALUES (${facilityName}, ${fileName})
    RETURNING id, facility_name, file_name, processed_at
  `
  return rows[0]
}
