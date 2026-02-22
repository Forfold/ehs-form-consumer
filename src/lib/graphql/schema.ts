import { and, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import {
  formSubmissions,
  formSubmissionTeams,
  teamMembers,
  teams,
  userFieldPreferences,
  userSettings,
  users,
  type FormSubmission,
  type Team,
  type TeamMember,
  type User,
  type UserFieldPreference,
  type UserSettings,
} from '../../../db/schema'
import { builder, type Context } from './builder'

// ── Helpers ───────────────────────────────────────────────────────────────────
const ROLE_ORDER = { owner: 3, admin: 2, member: 1 } as const
type Role = keyof typeof ROLE_ORDER

/** Throws if the user's role in the team is below minRole. */
async function assertTeamRole(
  db: Context['db'],
  teamId: string,
  userId: string,
  minRole: Role,
) {
  const rows = await db
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, userId)))
    .limit(1)
  const member = rows[0]
  if (!member || ROLE_ORDER[member.role as Role] < ROLE_ORDER[minRole]) {
    throw new Error('Forbidden')
  }
  return member
}

// ── Object types ──────────────────────────────────────────────────────────────
interface UserTeamMembership {
  teamId:   string
  teamName: string
  role:     string
}

const UserTeamMembershipRef = builder.objectRef<UserTeamMembership>('UserTeamMembership')
UserTeamMembershipRef.implement({
  fields: (t) => ({
    teamId:   t.exposeID('teamId'),
    teamName: t.exposeString('teamName'),
    role:     t.exposeString('role'),
  }),
})

interface AdminUserData extends User {
  teamMemberships: UserTeamMembership[]
  formCount:       number
}

const AdminUserRef = builder.objectRef<AdminUserData>('AdminUser')
AdminUserRef.implement({
  fields: (t) => ({
    id:              t.exposeID('id'),
    name:            t.exposeString('name',  { nullable: true }),
    email:           t.exposeString('email', { nullable: true }),
    image:           t.exposeString('image', { nullable: true }),
    isAdmin:         t.exposeBoolean('isAdmin'),
    teamMemberships: t.field({ type: [UserTeamMembershipRef], resolve: (r) => r.teamMemberships }),
    formCount:       t.exposeInt('formCount'),
  }),
})

const UserRef = builder.objectRef<User>('User')
UserRef.implement({
  fields: (t) => ({
    id:      t.exposeID('id'),
    name:    t.exposeString('name',    { nullable: true }),
    email:   t.exposeString('email',   { nullable: true }),
    image:   t.exposeString('image',   { nullable: true }),
    isAdmin: t.exposeBoolean('isAdmin'),
  }),
})

// TeamMember row joined with user data
interface TeamMemberWithUser extends TeamMember {
  user: User
}

const TeamMemberRef = builder.objectRef<TeamMemberWithUser>('TeamMember')
TeamMemberRef.implement({
  fields: (t) => ({
    userId:   t.exposeID('userId'),
    role:     t.exposeString('role'),
    joinedAt: t.field({ type: 'String', resolve: (r) => r.joinedAt.toISOString() }),
    user:     t.field({ type: UserRef, resolve: (r) => r.user }),
  }),
})

// Team row with members loaded
interface TeamWithMembers extends Team {
  members: TeamMemberWithUser[]
}

const TeamRef = builder.objectRef<TeamWithMembers>('Team')
TeamRef.implement({
  fields: (t) => ({
    id:        t.exposeID('id'),
    name:      t.exposeString('name'),
    createdAt: t.field({ type: 'String', resolve: (r) => r.createdAt.toISOString() }),
    members:   t.field({ type: [TeamMemberRef], resolve: (r) => r.members }),
  }),
})

const FormSubmissionRef = builder.objectRef<FormSubmission>('FormSubmission')
FormSubmissionRef.implement({
  fields: (t) => ({
    id:             t.exposeID('id'),
    fileName:       t.exposeString('fileName'),
    processedAt:    t.field({ type: 'String', resolve: (r) => r.processedAt.toISOString() }),
    formType:       t.exposeString('formType',       { nullable: true }),
    displayName:    t.exposeString('displayName',    { nullable: true }),
    pdfStorageKey:  t.exposeString('pdfStorageKey',  { nullable: true }),
    data:           t.expose('data', { type: 'JSON' }),
    // Teams this submission has been shared with (that user is a member of)
    teams: t.field({
      type: [TeamRef],
      resolve: async (submission, _args, ctx) => {
        if (!ctx.userId) return []
        const rows = await ctx.db
          .select({
            id:        teams.id,
            name:      teams.name,
            createdBy: teams.createdBy,
            createdAt: teams.createdAt,
          })
          .from(teams)
          .innerJoin(formSubmissionTeams, eq(formSubmissionTeams.teamId, teams.id))
          .innerJoin(teamMembers, and(
            eq(teamMembers.teamId, teams.id),
            eq(teamMembers.userId, ctx.userId),
          ))
          .where(eq(formSubmissionTeams.formSubmissionId, submission.id))
        // return as TeamWithMembers (members loaded lazily)
        return rows.map((r) => ({ ...r, members: [] }))
      },
    }),
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

    // Current authenticated user
    me: t.field({
      type:     UserRef,
      nullable: true,
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId) return null
        const rows = await ctx.db.select().from(users).where(eq(users.id, ctx.userId)).limit(1)
        return rows[0] ?? null
      },
    }),

    // User's own submissions + submissions shared via any team the user belongs to
    submissions: t.field({
      type:     [FormSubmissionRef],
      nullable: false,
      args: {
        formType: t.arg.string(),
        limit:    t.arg.int(),
      },
      resolve: async (_, args, ctx) => {
        if (!ctx.userId) return []
        const userIdVal = ctx.userId
        return ctx.db
          .select()
          .from(formSubmissions)
          .where(
            and(
              args.formType ? eq(formSubmissions.formType, args.formType) : undefined,
              or(
                eq(formSubmissions.userId, userIdVal),
                sql`EXISTS (
                  SELECT 1 FROM form_submission_teams fst
                  INNER JOIN team_members tm ON tm.team_id = fst.team_id
                  WHERE fst.form_submission_id = ${formSubmissions.id}
                    AND tm.user_id = ${userIdVal}
                )`
              )
            )
          )
          .orderBy(desc(formSubmissions.processedAt))
          .limit(args.limit ?? 50)
      },
    }),

    // Single submission by id — user must own it or be in a team it's shared with
    submission: t.field({
      type:     FormSubmissionRef,
      nullable: true,
      args: {
        id: t.arg.id({ required: true }),
      },
      resolve: async (_, args, ctx) => {
        if (!ctx.userId) return null
        const userIdVal = ctx.userId
        const rows = await ctx.db
          .select()
          .from(formSubmissions)
          .where(
            and(
              eq(formSubmissions.id, String(args.id)),
              or(
                eq(formSubmissions.userId, userIdVal),
                sql`EXISTS (
                  SELECT 1 FROM form_submission_teams fst
                  INNER JOIN team_members tm ON tm.team_id = fst.team_id
                  WHERE fst.form_submission_id = ${formSubmissions.id}
                    AND tm.user_id = ${userIdVal}
                )`
              )
            )
          )
          .limit(1)
        return rows[0] ?? null
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

    // Teams the current user is a member of (with full member lists)
    teams: t.field({
      type:     [TeamRef],
      nullable: false,
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId) return []
        // Fetch teams where user is a member
        const teamRows = await ctx.db
          .select({ id: teams.id, name: teams.name, createdBy: teams.createdBy, createdAt: teams.createdAt })
          .from(teams)
          .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
          .where(eq(teamMembers.userId, ctx.userId))

        if (teamRows.length === 0) return []

        // Load members for all teams in one query
        const teamIds = teamRows.map((t) => t.id)
        const memberRows = await ctx.db
          .select({
            teamId:   teamMembers.teamId,
            userId:   teamMembers.userId,
            role:     teamMembers.role,
            joinedAt: teamMembers.joinedAt,
            userName:  users.name,
            userEmail: users.email,
            userImage: users.image,
          })
          .from(teamMembers)
          .innerJoin(users, eq(users.id, teamMembers.userId))
          .where(inArray(teamMembers.teamId, teamIds))

        return teamRows.map((team) => ({
          ...team,
          members: memberRows
            .filter((m) => m.teamId === team.id)
            .map((m) => ({
              teamId:   m.teamId,
              userId:   m.userId,
              role:     m.role,
              joinedAt: m.joinedAt,
              user: {
                id:            m.userId,
                name:          m.userName,
                email:         m.userEmail,
                image:         m.userImage,
                isAdmin:       false,
                createdAt:     new Date(),
                emailVerified: null,
              } satisfies User,
            })),
        }))
      },
    }),

    // All users — site admins only
    allUsers: t.field({
      type:     [UserRef],
      nullable: false,
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) return []
        return ctx.db.select().from(users).orderBy(users.name).limit(500)
      },
    }),

    // All users with team memberships and form counts — site admins only
    adminUserList: t.field({
      type:     [AdminUserRef],
      nullable: false,
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) throw new Error('Forbidden')
        const userRows = await ctx.db.select().from(users).orderBy(users.name).limit(500)
        if (userRows.length === 0) return []
        const userIds = userRows.map((u) => u.id)
        const [membershipRows, countRows] = await Promise.all([
          ctx.db
            .select({
              userId:   teamMembers.userId,
              teamId:   teamMembers.teamId,
              teamName: teams.name,
              role:     teamMembers.role,
            })
            .from(teamMembers)
            .innerJoin(teams, eq(teams.id, teamMembers.teamId))
            .where(inArray(teamMembers.userId, userIds)),
          ctx.db
            .select({
              userId: formSubmissions.userId,
              n:      count(formSubmissions.id),
            })
            .from(formSubmissions)
            .where(inArray(formSubmissions.userId, userIds))
            .groupBy(formSubmissions.userId),
        ])
        const countMap = new Map(countRows.map((r) => [r.userId, r.n]))
        const memberMap = new Map<string, typeof membershipRows>()
        for (const m of membershipRows) {
          if (!memberMap.has(m.userId)) memberMap.set(m.userId, [])
          memberMap.get(m.userId)!.push(m)
        }
        return userRows.map((u) => ({
          ...u,
          teamMemberships: memberMap.get(u.id) ?? [],
          formCount:       countMap.get(u.id)  ?? 0,
        }))
      },
    }),

    // All teams in system — site admins only (for add-to-team UI)
    adminAllTeams: t.field({
      type:     [TeamRef],
      nullable: false,
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) throw new Error('Forbidden')
        const teamRows = await ctx.db
          .select({ id: teams.id, name: teams.name, createdBy: teams.createdBy, createdAt: teams.createdAt })
          .from(teams)
          .orderBy(teams.name)
        return teamRows.map((t) => ({ ...t, members: [] }))
      },
    }),

    // Search users by name or email — empty query returns all users (up to 500)
    searchUsers: t.field({
      type:     [UserRef],
      nullable: false,
      args: {
        query: t.arg.string({ required: true }),
      },
      resolve: async (_, args, ctx) => {
        if (!ctx.userId) return []
        const q = `%${args.query}%`
        return ctx.db
          .select()
          .from(users)
          .where(or(ilike(users.email, q), ilike(users.name, q)))
          .orderBy(users.name)
          .limit(500)
      },
    }),

  }),
})

// ── Mutations ─────────────────────────────────────────────────────────────────
const CreateSubmissionInput = builder.inputType('CreateSubmissionInput', {
  fields: (t) => ({
    fileName:      t.string({ required: true }),
    formType:      t.string(),
    displayName:   t.string(),
    pdfStorageKey: t.string(),
    data:          t.field({ type: 'JSON', required: true }),
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
            userId:        ctx.userId,
            fileName:      input.fileName,
            formType:      input.formType ?? null,
            displayName:   input.displayName ?? null,
            pdfStorageKey: input.pdfStorageKey ?? null,
            data:          input.data as Record<string, unknown>,
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

    // Create a new team; creator becomes owner
    createTeam: t.field({
      type:     TeamRef,
      args:     { name: t.arg.string({ required: true }) },
      resolve: async (_, { name }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const [team] = await ctx.db
          .insert(teams)
          .values({ name: name.trim(), createdBy: ctx.userId })
          .returning()
        const [member] = await ctx.db
          .insert(teamMembers)
          .values({ teamId: team.id, userId: ctx.userId, role: 'owner' })
          .returning()
        const userRows = await ctx.db.select().from(users).where(eq(users.id, ctx.userId)).limit(1)
        return {
          ...team,
          members: [{
            ...member,
            user: userRows[0],
          }],
        }
      },
    }),

    // Delete a team (owner only)
    deleteTeam: t.field({
      type:     'Boolean',
      args:     { id: t.arg.id({ required: true }) },
      resolve: async (_, { id }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        await assertTeamRole(ctx.db, String(id), ctx.userId, 'owner')
        await ctx.db.delete(teams).where(eq(teams.id, String(id)))
        return true
      },
    }),

    // Add a user to a team (owner or admin)
    addTeamMember: t.field({
      type:     TeamMemberRef,
      args: {
        teamId: t.arg.id({ required: true }),
        userId: t.arg.id({ required: true }),
        role:   t.arg.string(),
      },
      resolve: async (_, { teamId, userId, role }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        await assertTeamRole(ctx.db, String(teamId), ctx.userId, 'admin')
        const assignedRole = (role ?? 'member') as string
        const [row] = await ctx.db
          .insert(teamMembers)
          .values({ teamId: String(teamId), userId: String(userId), role: assignedRole })
          .onConflictDoUpdate({
            target: [teamMembers.teamId, teamMembers.userId],
            set: { role: assignedRole },
          })
          .returning()
        const userRows = await ctx.db.select().from(users).where(eq(users.id, String(userId))).limit(1)
        return { ...row, user: userRows[0] }
      },
    }),

    // Remove a user from a team (owner or admin; can't remove the last owner)
    removeTeamMember: t.field({
      type:     'Boolean',
      args: {
        teamId: t.arg.id({ required: true }),
        userId: t.arg.id({ required: true }),
      },
      resolve: async (_, { teamId, userId }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        await assertTeamRole(ctx.db, String(teamId), ctx.userId, 'admin')
        // Prevent removing the last owner
        const owners = await ctx.db
          .select()
          .from(teamMembers)
          .where(and(eq(teamMembers.teamId, String(teamId)), eq(teamMembers.role, 'owner')))
        if (owners.length === 1 && owners[0].userId === String(userId)) {
          throw new Error('Cannot remove the last owner of a team')
        }
        await ctx.db
          .delete(teamMembers)
          .where(and(eq(teamMembers.teamId, String(teamId)), eq(teamMembers.userId, String(userId))))
        return true
      },
    }),

    // Share a submission with a team (must own submission AND be a team member)
    addSubmissionToTeam: t.field({
      type:     'Boolean',
      args: {
        submissionId: t.arg.id({ required: true }),
        teamId:       t.arg.id({ required: true }),
      },
      resolve: async (_, { submissionId, teamId }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        // Verify submission ownership
        const subRows = await ctx.db
          .select()
          .from(formSubmissions)
          .where(and(eq(formSubmissions.id, String(submissionId)), eq(formSubmissions.userId, ctx.userId)))
          .limit(1)
        if (!subRows[0]) throw new Error('Submission not found or not owned by you')
        // Verify team membership (any role is fine)
        await assertTeamRole(ctx.db, String(teamId), ctx.userId, 'member')
        await ctx.db
          .insert(formSubmissionTeams)
          .values({ formSubmissionId: String(submissionId), teamId: String(teamId), addedBy: ctx.userId })
          .onConflictDoNothing()
        return true
      },
    }),

    // Set or unset site-admin flag — site admins only, cannot change own status
    adminSetUserRole: t.field({
      type: UserRef,
      args: {
        userId:  t.arg.id({ required: true }),
        isAdmin: t.arg.boolean({ required: true }),
      },
      resolve: async (_, { userId, isAdmin: newIsAdmin }, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) throw new Error('Forbidden')
        if (String(userId) === ctx.userId) throw new Error('Cannot change your own admin status')
        const rows = await ctx.db
          .update(users)
          .set({ isAdmin: newIsAdmin })
          .where(eq(users.id, String(userId)))
          .returning()
        if (!rows[0]) throw new Error('User not found')
        return rows[0]
      },
    }),

    // Delete any user — site admins only, cannot delete self
    adminDeleteUser: t.field({
      type:     'Boolean',
      args:     { userId: t.arg.id({ required: true }) },
      resolve: async (_, { userId }, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) throw new Error('Forbidden')
        if (String(userId) === ctx.userId) throw new Error('Cannot delete yourself')
        await ctx.db.delete(users).where(eq(users.id, String(userId)))
        return true
      },
    }),

    // Add any user to any team with any role — site admins only
    adminAddUserToTeam: t.field({
      type: TeamMemberRef,
      args: {
        userId: t.arg.id({ required: true }),
        teamId: t.arg.id({ required: true }),
        role:   t.arg.string(),
      },
      resolve: async (_, { userId, teamId, role }, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) throw new Error('Forbidden')
        const assignedRole = (role ?? 'member') as string
        const [row] = await ctx.db
          .insert(teamMembers)
          .values({ teamId: String(teamId), userId: String(userId), role: assignedRole })
          .onConflictDoUpdate({
            target: [teamMembers.teamId, teamMembers.userId],
            set: { role: assignedRole },
          })
          .returning()
        const userRows = await ctx.db.select().from(users).where(eq(users.id, String(userId))).limit(1)
        return { ...row, user: userRows[0] }
      },
    }),

    // Change a team member's role (owner or admin; owners only can assign owner role; can't demote last owner)
    changeTeamMemberRole: t.field({
      type: TeamMemberRef,
      args: {
        teamId: t.arg.id({ required: true }),
        userId: t.arg.id({ required: true }),
        role:   t.arg.string({ required: true }),
      },
      resolve: async (_, { teamId, userId, role }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const callerMember = await assertTeamRole(ctx.db, String(teamId), ctx.userId, 'admin')
        // Only owners can assign the owner role
        if (String(role) === 'owner' && callerMember.role !== 'owner') {
          throw new Error('Only owners can assign the owner role')
        }
        // Prevent demoting the last owner
        const owners = await ctx.db
          .select()
          .from(teamMembers)
          .where(and(eq(teamMembers.teamId, String(teamId)), eq(teamMembers.role, 'owner')))
        if (owners.length === 1 && owners[0].userId === String(userId) && String(role) !== 'owner') {
          throw new Error('Cannot demote the last owner of a team')
        }
        const [row] = await ctx.db
          .update(teamMembers)
          .set({ role: String(role) })
          .where(and(eq(teamMembers.teamId, String(teamId)), eq(teamMembers.userId, String(userId))))
          .returning()
        if (!row) throw new Error('Member not found')
        const userRows = await ctx.db.select().from(users).where(eq(users.id, String(userId))).limit(1)
        return { ...row, user: userRows[0] }
      },
    }),

    // Remove any user from any team — site admins only
    adminRemoveUserFromTeam: t.field({
      type: 'Boolean',
      args: {
        userId: t.arg.id({ required: true }),
        teamId: t.arg.id({ required: true }),
      },
      resolve: async (_, { userId, teamId }, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) throw new Error('Forbidden')
        await ctx.db
          .delete(teamMembers)
          .where(and(eq(teamMembers.teamId, String(teamId)), eq(teamMembers.userId, String(userId))))
        return true
      },
    }),

    // Attach (or replace) a PDF storage URL on an existing submission the user owns
    attachPdfToSubmission: t.field({
      type:     FormSubmissionRef,
      args: {
        id:            t.arg.id({ required: true }),
        pdfStorageKey: t.arg.string({ required: true }),
      },
      resolve: async (_, { id, pdfStorageKey }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const rows = await ctx.db
          .update(formSubmissions)
          .set({ pdfStorageKey: String(pdfStorageKey) })
          .where(and(eq(formSubmissions.id, String(id)), eq(formSubmissions.userId, ctx.userId)))
          .returning()
        if (!rows[0]) throw new Error('Submission not found or access denied')
        return rows[0]
      },
    }),

    // Remove a submission from a team (must own submission OR be owner/admin)
    removeSubmissionFromTeam: t.field({
      type:     'Boolean',
      args: {
        submissionId: t.arg.id({ required: true }),
        teamId:       t.arg.id({ required: true }),
      },
      resolve: async (_, { submissionId, teamId }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        // Allow if user owns the submission
        const subRows = await ctx.db
          .select()
          .from(formSubmissions)
          .where(and(eq(formSubmissions.id, String(submissionId)), eq(formSubmissions.userId, ctx.userId)))
          .limit(1)
        if (!subRows[0]) {
          // Otherwise require admin/owner of team
          await assertTeamRole(ctx.db, String(teamId), ctx.userId, 'admin')
        }
        await ctx.db
          .delete(formSubmissionTeams)
          .where(and(
            eq(formSubmissionTeams.formSubmissionId, String(submissionId)),
            eq(formSubmissionTeams.teamId, String(teamId)),
          ))
        return true
      },
    }),

  }),
})

// ── Export ────────────────────────────────────────────────────────────────────
export const schema = builder.toSchema()
