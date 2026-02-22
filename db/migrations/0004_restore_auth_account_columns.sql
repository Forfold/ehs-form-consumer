-- Migration: 0004_restore_auth_account_columns
-- Description: Restore refresh_token and session_state columns to the accounts table.
--
-- These columns were dropped in migration 0001_parched_texas_twister.sql under the
-- assumption that they were unused. However, @auth/drizzle-adapter's
-- DefaultPostgresAccountsTable type requires them to be present in the schema —
-- omitting either column causes a TypeScript compile error. The columns remain
-- nullable: Google OAuth does not populate refresh_token (unless offline access is
-- requested) and does not use session_state (an OpenID Connect-only field).

ALTER TABLE accounts ADD COLUMN IF NOT EXISTS refresh_token  TEXT;
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS session_state  TEXT;
