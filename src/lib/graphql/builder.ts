import SchemaBuilder from '@pothos/core'
import { auth } from '@/auth'
import { db, type Db } from '@/lib/db'

// ── Context ──────────────────────────────────────────────────────────────────
// Built once per request in the Yoga context factory.
// userId comes from the NextAuth session; null if unauthenticated.

export interface Context {
  db: Db
  userId: string | null
}

export async function buildContext(_request: Request): Promise<Context> {
  const session = await auth()
  return {
    db,
    userId: session?.user?.id ?? null,
  }
}

// ── Builder ───────────────────────────────────────────────────────────────────
// Single shared instance — all schema files import from here.

export const builder = new SchemaBuilder<{
  Context: Context
  Scalars: {
    JSON: { Input: unknown; Output: unknown }
  }
}>({})

// JSON scalar — passes JSONB values through as-is
builder.scalarType('JSON', {
  serialize:    (v) => v,
  parseValue:   (v) => v,
  parseLiteral: (ast) => {
    if (ast.kind === 'StringValue') return JSON.parse(ast.value)
    return null
  },
})
