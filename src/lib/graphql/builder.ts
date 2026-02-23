import SchemaBuilder from '@pothos/core'
import { eq } from 'drizzle-orm'
import { auth } from '@/auth'
import { db, type Db } from '@/lib/db'
import { users } from '../../../db/schema'

// ── Context ──────────────────────────────────────────────────────────────────
// Built once per request in the Yoga context factory
// userId comes from the NextAuth session; null if unauthenticated
export interface Context {
  db: Db
  userId: string | null
  isAdmin: boolean
}

export async function buildContext(): Promise<Context> {
  const session = await auth()
  const userId = session?.user?.id ?? null

  let isAdmin = false
  if (userId) {
    const rows = await db
      .select({ isAdmin: users.isAdmin })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)
    isAdmin = rows[0]?.isAdmin ?? false
  }

  return { db, userId, isAdmin }
}

// ── Builder ───────────────────────────────────────────────────────────────────
// Single shared instance — all schema files import from here
export const builder = new SchemaBuilder<{
  Context: Context
  Scalars: {
    JSON: { Input: unknown; Output: unknown }
  }
}>({})

// JSON scalar — passes JSONB values through as-is
builder.scalarType('JSON', {
  serialize: (v) => v,
  parseValue: (v) => v,
  parseLiteral: (ast) => {
    if (ast.kind === 'StringValue') return JSON.parse(ast.value)
    return null
  },
})
