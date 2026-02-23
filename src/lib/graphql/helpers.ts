import { and, eq } from 'drizzle-orm'
import { teamMembers } from '../../../db/schema'
import { type Context } from './builder'

export const ROLE_ORDER = { owner: 3, admin: 2, member: 1 } as const
export type Role = keyof typeof ROLE_ORDER

/** Throws if the user's role in the team is below minRole. */
export async function assertTeamRole(
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
