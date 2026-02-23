import { drizzle } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'

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
