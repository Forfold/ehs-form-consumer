import SchemaBuilder from '@pothos/core'
import { db, type Db } from '@/lib/db'

// ── Context ──────────────────────────────────────────────────────────────────
// Built once per request in the Yoga context factory.
// userId comes from the `ehs-user-id` cookie; null until a session is created.

export interface Context {
  db: Db
  userId: string | null
}

function parseCookies(header: string): Record<string, string> {
  return Object.fromEntries(
    header.split(';').flatMap(pair => {
      const [k, ...v] = pair.trim().split('=')
      return k ? [[k.trim(), v.join('=').trim()]] : []
    })
  )
}

export function buildContext(request: Request): Context {
  const cookies = parseCookies(request.headers.get('cookie') ?? '')
  return {
    db,
    userId: cookies['ehs-user-id'] ?? null,
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
