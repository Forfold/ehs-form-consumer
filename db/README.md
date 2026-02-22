# Database

Neon (PostgreSQL) via `@neondatabase/serverless`.

## Migrations

Files in `migrations/` are numbered sequentially: `0001_`, `0002_`, etc.
They are plain SQL and are run manually in the Neon SQL Editor (or via `psql`).
Each file is applied once — they are **not idempotent** unless explicitly written that way.

### Applied

| File | Date | Description |
|------|------|-------------|
| `0001_initial_schema.sql` | 2026-02-21 | Users, form submissions, field preferences, user settings |

### Adding a migration

1. Create `db/migrations/NNNN_description.sql`
2. Run it in the Neon console
3. Add a row to the table above

## Upgrading to Drizzle (recommended before GraphQL)

When ready, Drizzle replaces this manual workflow and generates TypeScript types
that Pothos can consume directly for type-safe GraphQL resolvers.

```bash
npm install drizzle-orm drizzle-kit
```

Define the schema in `db/schema.ts`, then `npx drizzle-kit generate` produces
migration SQL files automatically.
