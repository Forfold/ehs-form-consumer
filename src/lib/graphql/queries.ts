import { and, count, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm'
import {
  formSubmissions,
  teamMembers,
  teams,
  userFieldPreferences,
  userSettings,
  users,
  type User,
} from '../../../db/schema'
import { builder } from './builder'
import {
  AdminUserRef,
  FormSubmissionRef,
  TeamRef,
  UserFieldPreferenceRef,
  UserRef,
  UserSettingsRef,
} from './types'

builder.queryType({
  fields: (t) => ({
    // Current authenticated user
    me: t.field({
      type: UserRef,
      nullable: true,
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId) return null
        const rows = await ctx.db
          .select()
          .from(users)
          .where(eq(users.id, ctx.userId))
          .limit(1)
        return rows[0] ?? null
      },
    }),

    // User's own submissions + submissions shared via any team the user belongs to
    submissions: t.field({
      type: [FormSubmissionRef],
      nullable: false,
      args: {
        formType: t.arg.string(),
        limit: t.arg.int(),
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
                )`,
              ),
            ),
          )
          .orderBy(desc(formSubmissions.processedAt))
          .limit(args.limit ?? 50)
      },
    }),

    // Single submission by id — user must own it or be in a team it's shared with
    submission: t.field({
      type: FormSubmissionRef,
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
                )`,
              ),
            ),
          )
          .limit(1)
        return rows[0] ?? null
      },
    }),

    // Field visualization preferences for current user
    fieldPreferences: t.field({
      type: [UserFieldPreferenceRef],
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
      type: UserSettingsRef,
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
      type: [TeamRef],
      nullable: false,
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId) return []
        // Fetch teams where user is a member
        const teamRows = await ctx.db
          .select({
            id: teams.id,
            name: teams.name,
            createdBy: teams.createdBy,
            createdAt: teams.createdAt,
          })
          .from(teams)
          .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
          .where(eq(teamMembers.userId, ctx.userId))

        if (teamRows.length === 0) return []

        // Load members for all teams in one query
        const teamIds = teamRows.map((t) => t.id)
        const memberRows = await ctx.db
          .select({
            teamId: teamMembers.teamId,
            userId: teamMembers.userId,
            role: teamMembers.role,
            joinedAt: teamMembers.joinedAt,
            userName: users.name,
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
              teamId: m.teamId,
              userId: m.userId,
              role: m.role,
              joinedAt: m.joinedAt,
              user: {
                id: m.userId,
                name: m.userName,
                email: m.userEmail,
                image: m.userImage,
                isAdmin: false,
                createdAt: new Date(),
                emailVerified: null,
              } satisfies User,
            })),
        }))
      },
    }),

    // All users — site admins only
    allUsers: t.field({
      type: [UserRef],
      nullable: false,
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) return []
        return ctx.db.select().from(users).orderBy(users.name).limit(500)
      },
    }),

    // All users with team memberships and form counts — site admins only
    adminUserList: t.field({
      type: [AdminUserRef],
      nullable: false,
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) throw new Error('Forbidden')
        const userRows = await ctx.db
          .select()
          .from(users)
          .orderBy(users.name)
          .limit(500)
        if (userRows.length === 0) return []
        const userIds = userRows.map((u) => u.id)
        const [membershipRows, countRows] = await Promise.all([
          ctx.db
            .select({
              userId: teamMembers.userId,
              teamId: teamMembers.teamId,
              teamName: teams.name,
              role: teamMembers.role,
            })
            .from(teamMembers)
            .innerJoin(teams, eq(teams.id, teamMembers.teamId))
            .where(inArray(teamMembers.userId, userIds)),
          ctx.db
            .select({
              userId: formSubmissions.userId,
              n: count(formSubmissions.id),
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
          formCount: countMap.get(u.id) ?? 0,
        }))
      },
    }),

    // All teams in system — site admins only (for add-to-team UI)
    adminAllTeams: t.field({
      type: [TeamRef],
      nullable: false,
      resolve: async (_, _args, ctx) => {
        if (!ctx.userId || !ctx.isAdmin) throw new Error('Forbidden')
        const teamRows = await ctx.db
          .select({
            id: teams.id,
            name: teams.name,
            createdBy: teams.createdBy,
            createdAt: teams.createdAt,
          })
          .from(teams)
          .orderBy(teams.name)
        return teamRows.map((t) => ({ ...t, members: [] }))
      },
    }),

    // Search users by name or email — empty query returns all users (up to 500)
    searchUsers: t.field({
      type: [UserRef],
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
