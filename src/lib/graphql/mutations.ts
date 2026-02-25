import { and, eq, inArray } from 'drizzle-orm'
import {
  formSubmissions,
  formSubmissionTeams,
  teamMembers,
  teams,
  userFieldPreferences,
  userSettings,
  users,
} from '../../../db/schema'
import { inspectionDataSchema } from '../types/inspection'
import { builder } from './builder'
import { assertTeamRole, ROLE_ORDER, type Role } from './helpers'
import {
  FormSubmissionRef,
  TeamMemberRef,
  TeamRef,
  UserFieldPreferenceRef,
  UserRef,
  UserSettingsRef,
} from './types'

const CreateSubmissionInput = builder.inputType('CreateSubmissionInput', {
  fields: (t) => ({
    fileName: t.string({ required: true }),
    formType: t.string(),
    displayName: t.string(), // todo: delete this?
    pdfStorageKey: t.string(),
    data: t.field({ type: 'JSON', required: true }),

    facilityName: t.string({ required: true }),
    facilityAddress: t.string({ required: true }),
    permitNumber: t.string({ required: true }),
    inspectionDate: t.string({ required: true }),
    inspectorName: t.string({ required: true }),
  }),
})

const UpsertFieldPreferenceInput = builder.inputType('UpsertFieldPreferenceInput', {
  fields: (t) => ({
    formType: t.string(),
    fieldKey: t.string({ required: true }),
    displayLabel: t.string({ required: true }),
    visualization: t.string({ required: true }),
    position: t.int({ required: true }),
    enabled: t.boolean({ required: true }),
  }),
})

const UpdateSettingsInput = builder.inputType('UpdateSettingsInput', {
  fields: (t) => ({
    featureFlags: t.field({ type: 'JSON' }),
    preferences: t.field({ type: 'JSON' }),
  }),
})

builder.mutationType({
  fields: (t) => ({
    // Save a processed form submission (called after extraction)
    createSubmission: t.field({
      type: FormSubmissionRef,
      args: { input: t.arg({ type: CreateSubmissionInput, required: true }) },
      resolve: async (_, { input }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const parsed = inspectionDataSchema.parse(input.data)
        const rows = await ctx.db
          .insert(formSubmissions)
          .values({
            userId: ctx.userId,
            fileName: input.fileName,
            formType: input.formType ?? null,
            displayName: input.displayName ?? null,
            pdfStorageKey: input.pdfStorageKey ?? null,
            data: parsed,
            facilityName: parsed.facilityName,
            facilityAddress: parsed.facilityAddress,
            permitNumber: parsed.permitNumber,
            inspectionDate: parsed.inspectionDate,
            inspectorName: parsed.inspectorName,
          })
          .returning()
        return rows[0]
      },
    }),

    // Save or update a field visualization preference
    upsertFieldPreference: t.field({
      type: UserFieldPreferenceRef,
      args: { input: t.arg({ type: UpsertFieldPreferenceInput, required: true }) },
      resolve: async (_, { input }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const rows = await ctx.db
          .insert(userFieldPreferences)
          .values({
            userId: ctx.userId,
            formType: input.formType ?? null,
            fieldKey: input.fieldKey,
            displayLabel: input.displayLabel,
            visualization: input.visualization,
            position: input.position,
            enabled: input.enabled,
          })
          .onConflictDoUpdate({
            target: [userFieldPreferences.userId, userFieldPreferences.fieldKey],
            set: {
              displayLabel: input.displayLabel,
              visualization: input.visualization,
              position: input.position,
              enabled: input.enabled,
            },
          })
          .returning()
        return rows[0]
      },
    }),

    // Merge-update user settings (only provided keys are overwritten)
    updateSettings: t.field({
      type: UserSettingsRef,
      args: { input: t.arg({ type: UpdateSettingsInput, required: true }) },
      resolve: async (_, { input }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const rows = await ctx.db
          .insert(userSettings)
          .values({
            userId: ctx.userId,
            featureFlags: (input.featureFlags ?? {}) as Record<string, unknown>,
            preferences: (input.preferences ?? {}) as Record<string, unknown>,
          })
          .onConflictDoUpdate({
            target: [userSettings.userId],
            set: {
              ...(input.featureFlags != null && {
                featureFlags: input.featureFlags as Record<string, unknown>,
              }),
              ...(input.preferences != null && {
                preferences: input.preferences as Record<string, unknown>,
              }),
              updatedAt: new Date(),
            },
          })
          .returning()
        return rows[0]
      },
    }),

    // Create a new team; creator becomes owner
    createTeam: t.field({
      type: TeamRef,
      args: { name: t.arg.string({ required: true }) },
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
        const userRows = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, ctx.userId))
          .limit(1)
        return {
          ...team,
          members: [
            {
              ...member,
              user: userRows[0],
            },
          ],
        }
      },
    }),

    // Rename a team (owner only)
    renameTeam: t.field({
      type: TeamRef,
      args: {
        id: t.arg.id({ required: true }),
        name: t.arg.string({ required: true }),
      },
      resolve: async (_, { id, name }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        await assertTeamRole(ctx.db, String(id), ctx.userId, 'owner')
        const [team] = await ctx.db
          .update(teams)
          .set({ name: name.trim() })
          .where(eq(teams.id, String(id)))
          .returning()
        if (!team) throw new Error('Team not found')
        return { ...team, members: [] }
      },
    }),

    // Delete a team (owner only)
    deleteTeam: t.field({
      type: 'Boolean',
      args: { id: t.arg.id({ required: true }) },
      resolve: async (_, { id }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        await assertTeamRole(ctx.db, String(id), ctx.userId, 'owner')
        await ctx.db.delete(teams).where(eq(teams.id, String(id)))
        return true
      },
    }),

    // Add a user to a team (owner or admin)
    addTeamMember: t.field({
      type: TeamMemberRef,
      args: {
        teamId: t.arg.id({ required: true }),
        userId: t.arg.id({ required: true }),
        role: t.arg.string(),
      },
      resolve: async (_, { teamId, userId, role }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        await assertTeamRole(ctx.db, String(teamId), ctx.userId, 'admin')
        const assignedRole = (role ?? 'member') as string
        const [row] = await ctx.db
          .insert(teamMembers)
          .values({
            teamId: String(teamId),
            userId: String(userId),
            role: assignedRole,
          })
          .onConflictDoUpdate({
            target: [teamMembers.teamId, teamMembers.userId],
            set: { role: assignedRole },
          })
          .returning()
        const userRows = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, String(userId)))
          .limit(1)
        return { ...row, user: userRows[0] }
      },
    }),

    // Remove a user from a team (owner or admin; can't remove the last owner)
    removeTeamMember: t.field({
      type: 'Boolean',
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
          .where(
            and(
              eq(teamMembers.teamId, String(teamId)),
              eq(teamMembers.role, 'owner'),
            ),
          )
        if (owners.length === 1 && owners[0].userId === String(userId)) {
          throw new Error('Cannot remove the last owner of a team')
        }
        await ctx.db
          .delete(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, String(teamId)),
              eq(teamMembers.userId, String(userId)),
            ),
          )
        return true
      },
    }),

    // Share a submission with a team (must own submission AND be a team member)
    addSubmissionToTeam: t.field({
      type: 'Boolean',
      args: {
        submissionId: t.arg.id({ required: true }),
        teamId: t.arg.id({ required: true }),
      },
      resolve: async (_, { submissionId, teamId }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        // Verify submission ownership
        const subRows = await ctx.db
          .select()
          .from(formSubmissions)
          .where(
            and(
              eq(formSubmissions.id, String(submissionId)),
              eq(formSubmissions.userId, ctx.userId),
            ),
          )
          .limit(1)
        if (!subRows[0]) throw new Error('Submission not found or not owned by you')
        // Verify team membership (any role is fine)
        await assertTeamRole(ctx.db, String(teamId), ctx.userId, 'member')
        await ctx.db
          .insert(formSubmissionTeams)
          .values({
            formSubmissionId: String(submissionId),
            teamId: String(teamId),
            addedBy: ctx.userId,
          })
          .onConflictDoNothing()
        return true
      },
    }),

    // Set or unset site-admin flag — site admins only, cannot change own status
    adminSetUserRole: t.field({
      type: UserRef,
      args: {
        userId: t.arg.id({ required: true }),
        isAdmin: t.arg.boolean({ required: true }),
      },
      resolve: async (_, { userId, isAdmin: newIsAdmin }, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) throw new Error('Forbidden')
        if (String(userId) === ctx.userId)
          throw new Error('Cannot change your own admin status')
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
      type: 'Boolean',
      args: { userId: t.arg.id({ required: true }) },
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
        role: t.arg.string(),
      },
      resolve: async (_, { userId, teamId, role }, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) throw new Error('Forbidden')
        const assignedRole = (role ?? 'member') as string
        const [row] = await ctx.db
          .insert(teamMembers)
          .values({
            teamId: String(teamId),
            userId: String(userId),
            role: assignedRole,
          })
          .onConflictDoUpdate({
            target: [teamMembers.teamId, teamMembers.userId],
            set: { role: assignedRole },
          })
          .returning()
        const userRows = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, String(userId)))
          .limit(1)
        return { ...row, user: userRows[0] }
      },
    }),

    // Change a team member's role (owner or admin; owners only can assign owner role; can't demote last owner)
    changeTeamMemberRole: t.field({
      type: TeamMemberRef,
      args: {
        teamId: t.arg.id({ required: true }),
        userId: t.arg.id({ required: true }),
        role: t.arg.string({ required: true }),
      },
      resolve: async (_, { teamId, userId, role }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const callerMember = await assertTeamRole(
          ctx.db,
          String(teamId),
          ctx.userId,
          'admin',
        )
        // Only owners can assign the owner role
        if (String(role) === 'owner' && callerMember.role !== 'owner') {
          throw new Error('Only owners can assign the owner role')
        }
        // Prevent demoting the last owner
        const owners = await ctx.db
          .select()
          .from(teamMembers)
          .where(
            and(
              eq(teamMembers.teamId, String(teamId)),
              eq(teamMembers.role, 'owner'),
            ),
          )
        if (
          owners.length === 1 &&
          owners[0].userId === String(userId) &&
          String(role) !== 'owner'
        ) {
          throw new Error('Cannot demote the last owner of a team')
        }
        const [row] = await ctx.db
          .update(teamMembers)
          .set({ role: String(role) })
          .where(
            and(
              eq(teamMembers.teamId, String(teamId)),
              eq(teamMembers.userId, String(userId)),
            ),
          )
          .returning()
        if (!row) throw new Error('Member not found')
        const userRows = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, String(userId)))
          .limit(1)
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
          .where(
            and(
              eq(teamMembers.teamId, String(teamId)),
              eq(teamMembers.userId, String(userId)),
            ),
          )
        return true
      },
    }),

    // Update the extracted data for a submission the user owns
    updateSubmissionData: t.field({
      type: FormSubmissionRef,
      args: {
        id: t.arg.id({ required: true }),
        data: t.arg({ type: 'JSON', required: true }),
      },
      resolve: async (_, { id, data }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const parsed = inspectionDataSchema.parse(data)
        const rows = await ctx.db
          .update(formSubmissions)
          .set({
            data: parsed,
            facilityName: parsed.facilityName,
            facilityAddress: parsed.facilityAddress,
            permitNumber: parsed.permitNumber,
            inspectionDate: parsed.inspectionDate,
            inspectorName: parsed.inspectorName,
          })
          .where(
            and(
              eq(formSubmissions.id, String(id)),
              eq(formSubmissions.userId, ctx.userId),
            ),
          )
          .returning()
        if (!rows[0]) throw new Error('Submission not found or access denied')
        return rows[0]
      },
    }),

    // Attach (or replace) a PDF storage URL on an existing submission the user owns
    attachPdfToSubmission: t.field({
      type: FormSubmissionRef,
      args: {
        id: t.arg.id({ required: true }),
        pdfStorageKey: t.arg.string({ required: true }),
      },
      resolve: async (_, { id, pdfStorageKey }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const rows = await ctx.db
          .update(formSubmissions)
          .set({ pdfStorageKey: String(pdfStorageKey) })
          .where(
            and(
              eq(formSubmissions.id, String(id)),
              eq(formSubmissions.userId, ctx.userId),
            ),
          )
          .returning()
        if (!rows[0]) throw new Error('Submission not found or access denied')
        return rows[0]
      },
    }),

    // Remove a submission from a team (must own submission OR be owner/admin)
    removeSubmissionFromTeam: t.field({
      type: 'Boolean',
      args: {
        submissionId: t.arg.id({ required: true }),
        teamId: t.arg.id({ required: true }),
      },
      resolve: async (_, { submissionId, teamId }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        // Allow if user owns the submission
        const subRows = await ctx.db
          .select()
          .from(formSubmissions)
          .where(
            and(
              eq(formSubmissions.id, String(submissionId)),
              eq(formSubmissions.userId, ctx.userId),
            ),
          )
          .limit(1)
        if (!subRows[0]) {
          // Otherwise require admin/owner of team
          await assertTeamRole(ctx.db, String(teamId), ctx.userId, 'admin')
        }
        await ctx.db
          .delete(formSubmissionTeams)
          .where(
            and(
              eq(formSubmissionTeams.formSubmissionId, String(submissionId)),
              eq(formSubmissionTeams.teamId, String(teamId)),
            ),
          )
        return true
      },
    }),

    // Delete a submission (owner, or admin/owner of any team the submission belongs to)
    deleteSubmission: t.field({
      type: 'Boolean',
      args: { id: t.arg.id({ required: true }) },
      resolve: async (_, { id }, ctx) => {
        if (!ctx.userId) throw new Error('Not authenticated')
        const subId = String(id)

        // Check ownership first
        const owned = await ctx.db
          .select({ id: formSubmissions.id })
          .from(formSubmissions)
          .where(
            and(
              eq(formSubmissions.id, subId),
              eq(formSubmissions.userId, ctx.userId),
            ),
          )
          .limit(1)

        if (!owned[0]) {
          // Not the owner — check if user is admin/owner of any team this submission belongs to
          const teamRows = await ctx.db
            .select({ teamId: formSubmissionTeams.teamId })
            .from(formSubmissionTeams)
            .where(eq(formSubmissionTeams.formSubmissionId, subId))

          if (teamRows.length === 0)
            throw new Error('Submission not found or access denied')

          const memberRows = await ctx.db
            .select({ role: teamMembers.role })
            .from(teamMembers)
            .where(
              and(
                inArray(
                  teamMembers.teamId,
                  teamRows.map((r) => r.teamId),
                ),
                eq(teamMembers.userId, ctx.userId),
              ),
            )
            .limit(1)

          const member = memberRows[0]
          if (!member || ROLE_ORDER[member.role as Role] < ROLE_ORDER['admin']) {
            throw new Error('Forbidden')
          }
        }

        await ctx.db.delete(formSubmissions).where(eq(formSubmissions.id, subId))
        return true
      },
    }),
  }),
})
