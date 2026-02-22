import { desc, eq } from 'drizzle-orm'
import {
  formSubmissions,
  userFieldPreferences,
  userSettings,
  type FormSubmission,
  type UserFieldPreference,
  type UserSettings,
} from '../../../db/schema'
import { builder } from './builder'

// ── Object types ──────────────────────────────────────────────────────────────
// objectRef<T> ties Pothos fields to Drizzle's inferred row types.

const FormSubmissionRef = builder.objectRef<FormSubmission>('FormSubmission')
FormSubmissionRef.implement({
  fields: (t) => ({
    id:          t.exposeID('id'),
    fileName:    t.exposeString('fileName'),
    processedAt: t.field({ type: 'String', resolve: (r) => r.processedAt.toISOString() }),
    formType:    t.exposeString('formType',    { nullable: true }),
    displayName: t.exposeString('displayName', { nullable: true }),
    data:        t.expose('data', { type: 'JSON' }),
  }),
})

const UserFieldPreferenceRef = builder.objectRef<UserFieldPreference>('UserFieldPreference')
UserFieldPreferenceRef.implement({
  fields: (t) => ({
    id:           t.exposeID('id'),
    formType:     t.exposeString('formType',    { nullable: true }),
    fieldKey:     t.exposeString('fieldKey'),
    displayLabel: t.exposeString('displayLabel'),
    visualization: t.exposeString('visualization'),
    position:     t.exposeInt('position'),
    enabled:      t.exposeBoolean('enabled'),
  }),
})

const UserSettingsRef = builder.objectRef<UserSettings>('UserSettings')
UserSettingsRef.implement({
  fields: (t) => ({
    featureFlags: t.expose('featureFlags', { type: 'JSON' }),
    preferences:  t.expose('preferences',  { type: 'JSON' }),
    updatedAt:    t.field({ type: 'String', resolve: (r) => r.updatedAt.toISOString() }),
  }),
})

// ── Queries ───────────────────────────────────────────────────────────────────

builder.queryType({
  fields: (t) => ({

    // List of submissions for the current user, newest first
    submissions: t.field({
      type:     [FormSubmissionRef],
      nullable: false,
      args: {
        formType: t.arg.string(),
        limit:    t.arg.int(),
      },
      resolve: async (_, args, ctx) => {
        if (!ctx.userId) return []
        const query = ctx.db
          .select()
          .from(formSubmissions)
          .where(
            args.formType
              ? eq(formSubmissions.userId, ctx.userId)   // TODO: AND formType when needed
              : eq(formSubmissions.userId, ctx.userId)
          )
          .orderBy(desc(formSubmissions.processedAt))
          .limit(args.limit ?? 50)
        return query
      },
    }),

    // Single submission by id
    submission: t.field({
      type:     FormSubmissionRef,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_, args, ctx) => {
        if (!ctx.userId) return null
        const rows = await ctx.db
          .select()
          .from(formSubmissions)
          // userId constraint ensures a user can only fetch their own submissions
          .where(eq(formSubmissions.id, String(args.id)))
          .limit(1)
        const row = rows[0] ?? null
        if (row && row.userId !== ctx.userId) return null
        return row
      },
    }),

    // Field visualization preferences for current user
    fieldPreferences: t.field({
      type:     [UserFieldPreferenceRef],
      nullable: false,
      args: {
        formType: t.arg.string(),
      },
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId) return []
        return ctx.db
          .select()
          .from(userFieldPreferences)
          .where(eq(userFieldPreferences.userId, ctx.userId))
          .orderBy(userFieldPreferences.position)
      },
    }),

    // Current user's settings
    settings: t.field({
      type:     UserSettingsRef,
      nullable: true,
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId) return null
        const rows = await ctx.db
          .select()
          .from(userSettings)
          .where(eq(userSettings.userId, ctx.userId))
          .limit(1)
        return rows[0] ?? null
      },
    }),

  }),
})

// ── Mutations ─────────────────────────────────────────────────────────────────

const CreateSubmissionInput = builder.inputType('CreateSubmissionInput', {
  fields: (t) => ({
    fileName:    t.string({ required: true }),
    formType:    t.string(),
    displayName: t.string(),
    data:        t.field({ type: 'JSON', required: true }),
  }),
})

const UpsertFieldPreferenceInput = builder.inputType('UpsertFieldPreferenceInput', {
  fields: (t) => ({
    formType:     t.string(),
    fieldKey:     t.string({ required: true }),
    displayLabel: t.string({ required: true }),
    visualization: t.string({ required: true }),
    position:     t.int({ required: true }),
    enabled:      t.boolean({ required: true }),
  }),
})

const UpdateSettingsInput = builder.inputType('UpdateSettingsInput', {
  fields: (t) => ({
    featureFlags: t.field({ type: 'JSON' }),
    preferences:  t.field({ type: 'JSON' }),
  }),
})

builder.mutationType({
  fields: (t) => ({

    // Save a processed form submission (called after extraction)
    createSubmission: t.field({
      type:     FormSubmissionRef,
      args:     { input: t.arg({ type: CreateSubmissionInput, required: true }) },
      resolve: async (_, { input }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const rows = await ctx.db
          .insert(formSubmissions)
          .values({
            userId:      ctx.userId,
            fileName:    input.fileName,
            formType:    input.formType ?? null,
            displayName: input.displayName ?? null,
            data:        input.data as Record<string, unknown>,
          })
          .returning()
        return rows[0]
      },
    }),

    // Save or update a field visualization preference
    upsertFieldPreference: t.field({
      type:     UserFieldPreferenceRef,
      args:     { input: t.arg({ type: UpsertFieldPreferenceInput, required: true }) },
      resolve: async (_, { input }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const rows = await ctx.db
          .insert(userFieldPreferences)
          .values({
            userId:       ctx.userId,
            formType:     input.formType ?? null,
            fieldKey:     input.fieldKey,
            displayLabel: input.displayLabel,
            visualization: input.visualization,
            position:     input.position,
            enabled:      input.enabled,
          })
          .onConflictDoUpdate({
            target: [userFieldPreferences.userId, userFieldPreferences.fieldKey],
            set: {
              displayLabel:  input.displayLabel,
              visualization: input.visualization,
              position:      input.position,
              enabled:       input.enabled,
            },
          })
          .returning()
        return rows[0]
      },
    }),

    // Merge-update user settings (only provided keys are overwritten)
    updateSettings: t.field({
      type:     UserSettingsRef,
      args:     { input: t.arg({ type: UpdateSettingsInput, required: true }) },
      resolve: async (_, { input }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const rows = await ctx.db
          .insert(userSettings)
          .values({
            userId:       ctx.userId,
            featureFlags: (input.featureFlags ?? {}) as Record<string, unknown>,
            preferences:  (input.preferences  ?? {}) as Record<string, unknown>,
          })
          .onConflictDoUpdate({
            target: [userSettings.userId],
            set: {
              ...(input.featureFlags != null && { featureFlags: input.featureFlags as Record<string, unknown> }),
              ...(input.preferences  != null && { preferences:  input.preferences  as Record<string, unknown> }),
              updatedAt: new Date(),
            },
          })
          .returning()
        return rows[0]
      },
    }),

  }),
})

// ── Export ────────────────────────────────────────────────────────────────────
export const schema = builder.toSchema()
