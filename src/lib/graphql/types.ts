import { and, eq } from 'drizzle-orm'
import {
  formSubmissionTeams,
  teamMembers,
  teams,
  type FormSubmission,
  type Team,
  type TeamMember,
  type User,
  type UserFieldPreference,
  type UserSettings,
} from '../../../db/schema'
import { builder } from './builder'

// ── Object types ──────────────────────────────────────────────────────────────
export interface UserTeamMembership {
  teamId: string
  teamName: string
  role: string
}

export const UserTeamMembershipRef =
  builder.objectRef<UserTeamMembership>('UserTeamMembership')
UserTeamMembershipRef.implement({
  fields: (t) => ({
    teamId: t.exposeID('teamId'),
    teamName: t.exposeString('teamName'),
    role: t.exposeString('role'),
  }),
})

export interface AdminUserData extends User {
  teamMemberships: UserTeamMembership[]
  formCount: number
}

export const AdminUserRef = builder.objectRef<AdminUserData>('AdminUser')
AdminUserRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    image: t.exposeString('image', { nullable: true }),
    isAdmin: t.exposeBoolean('isAdmin'),
    teamMemberships: t.field({
      type: [UserTeamMembershipRef],
      resolve: (r) => r.teamMemberships,
    }),
    formCount: t.exposeInt('formCount'),
  }),
})

export const UserRef = builder.objectRef<User>('User')
UserRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name', { nullable: true }),
    email: t.exposeString('email', { nullable: true }),
    image: t.exposeString('image', { nullable: true }),
    isAdmin: t.exposeBoolean('isAdmin'),
  }),
})

// TeamMember row joined with user data
export interface TeamMemberWithUser extends TeamMember {
  user: User
}

export const TeamMemberRef = builder.objectRef<TeamMemberWithUser>('TeamMember')
TeamMemberRef.implement({
  fields: (t) => ({
    userId: t.exposeID('userId'),
    role: t.exposeString('role'),
    joinedAt: t.field({ type: 'String', resolve: (r) => r.joinedAt.toISOString() }),
    user: t.field({ type: UserRef, resolve: (r) => r.user }),
  }),
})

// Team row with members loaded
export interface TeamWithMembers extends Team {
  members: TeamMemberWithUser[]
}

export const TeamRef = builder.objectRef<TeamWithMembers>('Team')
TeamRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    name: t.exposeString('name'),
    createdAt: t.field({ type: 'String', resolve: (r) => r.createdAt.toISOString() }),
    members: t.field({ type: [TeamMemberRef], resolve: (r) => r.members }),
  }),
})

export const FormSubmissionRef = builder.objectRef<FormSubmission>('FormSubmission')
FormSubmissionRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    fileName: t.exposeString('fileName'),
    processedAt: t.field({
      type: 'String',
      resolve: (r) => r.processedAt.toISOString(),
    }),
    formType: t.exposeString('formType', { nullable: true }),
    displayName: t.exposeString('displayName', { nullable: true }),
    pdfStorageKey: t.exposeString('pdfStorageKey', { nullable: true }),
    data: t.expose('data', { type: 'JSON' }),
    // Teams this submission has been shared with (that user is a member of)
    teams: t.field({
      type: [TeamRef],
      resolve: async (submission, _args, ctx) => {
        if (!ctx.userId) return []
        const rows = await ctx.db
          .select({
            id: teams.id,
            name: teams.name,
            createdBy: teams.createdBy,
            createdAt: teams.createdAt,
          })
          .from(teams)
          .innerJoin(formSubmissionTeams, eq(formSubmissionTeams.teamId, teams.id))
          .innerJoin(
            teamMembers,
            and(eq(teamMembers.teamId, teams.id), eq(teamMembers.userId, ctx.userId)),
          )
          .where(eq(formSubmissionTeams.formSubmissionId, submission.id))
        // return as TeamWithMembers (members loaded lazily)
        return rows.map((r) => ({ ...r, members: [] }))
      },
    }),
  }),
})

export const UserFieldPreferenceRef =
  builder.objectRef<UserFieldPreference>('UserFieldPreference')
UserFieldPreferenceRef.implement({
  fields: (t) => ({
    id: t.exposeID('id'),
    formType: t.exposeString('formType', { nullable: true }),
    fieldKey: t.exposeString('fieldKey'),
    displayLabel: t.exposeString('displayLabel'),
    visualization: t.exposeString('visualization'),
    position: t.exposeInt('position'),
    enabled: t.exposeBoolean('enabled'),
  }),
})

export const UserSettingsRef = builder.objectRef<UserSettings>('UserSettings')
UserSettingsRef.implement({
  fields: (t) => ({
    featureFlags: t.expose('featureFlags', { type: 'JSON' }),
    preferences: t.expose('preferences', { type: 'JSON' }),
    updatedAt: t.field({ type: 'String', resolve: (r) => r.updatedAt.toISOString() }),
  }),
})
