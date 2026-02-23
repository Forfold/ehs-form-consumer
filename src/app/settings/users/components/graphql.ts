// ── GraphQL ───────────────────────────────────────────────────────────────────

export const ME_QUERY = `query { me { id isAdmin } }`;

export const ADMIN_USER_LIST_QUERY = `
  query {
    adminUserList {
      id name email image isAdmin formCount
      teamMemberships { teamId teamName role }
    }
  }
`;

export const ADMIN_ALL_TEAMS_QUERY = `
  query {
    adminAllTeams { id name }
  }
`;

export const SET_USER_ROLE_MUTATION = `
  mutation AdminSetUserRole($userId: ID!, $isAdmin: Boolean!) {
    adminSetUserRole(userId: $userId, isAdmin: $isAdmin) { id isAdmin }
  }
`;

export const DELETE_USER_MUTATION = `
  mutation AdminDeleteUser($userId: ID!) {
    adminDeleteUser(userId: $userId)
  }
`;

export const ADD_USER_TO_TEAM_MUTATION = `
  mutation AdminAddUserToTeam($userId: ID!, $teamId: ID!, $role: String) {
    adminAddUserToTeam(userId: $userId, teamId: $teamId, role: $role) { userId role }
  }
`;

export const REMOVE_USER_FROM_TEAM_MUTATION = `
  mutation AdminRemoveUserFromTeam($userId: ID!, $teamId: ID!) {
    adminRemoveUserFromTeam(userId: $userId, teamId: $teamId)
  }
`;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UserTeamMembership {
  teamId: string;
  teamName: string;
  role: string;
}

export interface AdminUser {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  isAdmin: boolean;
  teamMemberships: UserTeamMembership[];
  formCount: number;
}

export interface SlimTeam {
  id: string;
  name: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function userInitials(user: AdminUser): string {
  if (user.name)
    return user.name
      .split(" ")
      .map((s) => s[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  if (user.email) return user.email[0].toUpperCase();
  return "?";
}

export const ROLE_LABELS: Record<string, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
};
