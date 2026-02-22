import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

// ── Users ─────────────────────────────────────────────────────────────────────
export const users = pgTable('users', {
  id:            uuid('id').primaryKey().defaultRandom(),
  createdAt:     timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  // NextAuth Drizzle adapter required fields
  name:          text('name'),
  email:         text('email').unique(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image:         text('image'),
})

// ── NextAuth accounts ──────────────────────────────────────────────────────────
export const accounts = pgTable(
  'accounts',
  {
    userId:            uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    type:              text('type').notNull(),
    provider:          text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token:     text('refresh_token'),
    access_token:      text('access_token'),
    expires_at:        integer('expires_at'),
    token_type:        text('token_type'),
    scope:             text('scope'),
    id_token:          text('id_token'),
    session_state:     text('session_state'),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index('accounts_user_id_idx').on(t.userId),
  ]
)

// ── NextAuth sessions ──────────────────────────────────────────────────────────
export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires:      timestamp('expires', { mode: 'date' }).notNull(),
})

// ── NextAuth verification tokens ───────────────────────────────────────────────
export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token:      text('token').notNull(),
    expires:    timestamp('expires', { mode: 'date' }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })]
)

// ── Form submissions ───────────────────────────────────────────────────────────
export const formSubmissions = pgTable(
  'form_submissions',
  {
    id:          uuid('id').primaryKey().defaultRandom(),
    userId:      uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    fileName:    text('file_name').notNull(),
    processedAt: timestamp('processed_at', { withTimezone: true }).notNull().defaultNow(),
    formType:    text('form_type'),
    displayName: text('display_name'),
    data:        jsonb('data').notNull(),
  },
  (t) => [
    index('form_submissions_user_id_processed_at_idx').on(t.userId, t.processedAt),
    index('form_submissions_user_id_form_type_idx').on(t.userId, t.formType),
    // GIN index on data is created manually in migration — Drizzle doesn't generate it
  ]
)

// ── User field preferences ─────────────────────────────────────────────────────
export const userFieldPreferences = pgTable(
  'user_field_preferences',
  {
    id:           uuid('id').primaryKey().defaultRandom(),
    userId:       uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    formType:     text('form_type'),       // null = applies to all form types
    fieldKey:     text('field_key').notNull(),
    displayLabel: text('display_label').notNull(),
    visualization: text('visualization').notNull().default('text'),
    position:     smallint('position').notNull().default(0),
    enabled:      boolean('enabled').notNull().default(true),
  },
  (t) => [
    index('user_field_preferences_user_id_form_type_position_idx').on(t.userId, t.formType, t.position),
    // The NULLS NOT DISTINCT unique index is created manually in migration
  ]
)

// ── User settings ──────────────────────────────────────────────────────────────
export const userSettings = pgTable('user_settings', {
  userId:       uuid('user_id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  featureFlags: jsonb('feature_flags').notNull().default({}),
  preferences:  jsonb('preferences').notNull().default({}),
  updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// ── Inferred row types (used throughout the app) ───────────────────────────────
export type User                 = typeof users.$inferSelect
export type Account              = typeof accounts.$inferSelect
export type Session              = typeof sessions.$inferSelect
export type FormSubmission       = typeof formSubmissions.$inferSelect
export type UserFieldPreference  = typeof userFieldPreferences.$inferSelect
export type UserSettings         = typeof userSettings.$inferSelect

export type NewFormSubmission      = typeof formSubmissions.$inferInsert
export type NewUserFieldPreference = typeof userFieldPreferences.$inferInsert
