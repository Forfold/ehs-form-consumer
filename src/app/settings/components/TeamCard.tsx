
'use client'

import { useRef, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'

import { gqlFetch } from '@/lib/graphql/client'
import { AddMemberDialog } from './AddMemberDialog'

// ── GraphQL fragments ─────────────────────────────────────────────────────────

const DELETE_TEAM_MUTATION = `
  mutation DeleteTeam($id: ID!) {
    deleteTeam(id: $id)
  }
`

const REMOVE_MEMBER_MUTATION = `
  mutation RemoveTeamMember($teamId: ID!, $userId: ID!) {
    removeTeamMember(teamId: $teamId, userId: $userId)
  }
`

const CHANGE_ROLE_MUTATION = `
  mutation ChangeTeamMemberRole($teamId: ID!, $userId: ID!, $role: String!) {
    changeTeamMemberRole(teamId: $teamId, userId: $userId, role: $role) {
      userId role joinedAt user { id name email image }
    }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GqlUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

export interface GqlTeamMember {
  userId: string
  role: string
  joinedAt: string
  user: GqlUser
}

export interface GqlTeam {
  id: string
  name: string
  members: GqlTeamMember[]
}

// ── Sub-components ────────────────────────────────────────────────────────────

export function UserAvatar({ user, size = 32 }: { user: GqlUser; size?: number }) {
  return (
    <Avatar
      src={user.image ?? undefined}
      alt={user.name ?? user.email ?? '?'}
      sx={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {(user.name ?? user.email ?? '?')[0].toUpperCase()}
    </Avatar>
  )
}

function RoleChip({ role }: { role: string }) {
  const color =
    role === 'owner' ? 'error' :
    role === 'admin' ? 'warning' :
    'default'
  return <Chip component="span" label={role} size="small" color={color as 'error' | 'warning' | 'default'} variant="outlined" />
}

// ── Team card ─────────────────────────────────────────────────────────────────

interface TeamCardProps {
  team: GqlTeam
  currentUserId: string | null
  onDeleted: (id: string) => void
  onMemberAdded: (teamId: string, member: GqlTeamMember) => void
  onMemberRemoved: (teamId: string, userId: string) => void
  onMemberRoleChanged: (teamId: string, member: GqlTeamMember) => void
}

export function TeamCard({ team, currentUserId, onDeleted, onMemberAdded, onMemberRemoved, onMemberRoleChanged }: TeamCardProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null)
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; userId: string } | null>(null)

  const myMember = team.members.find((m) => m.userId === currentUserId)
  const myRole = myMember?.role ?? 'member'
  const canManageMembers = myRole === 'owner' || myRole === 'admin'
  const isOwner = myRole === 'owner'

  async function handleDelete() {
    setDeleting(true)
    try {
      await gqlFetch(DELETE_TEAM_MUTATION, { id: team.id })
      onDeleted(team.id)
    } finally {
      setDeleting(false)
      setDeleteOpen(false)
    }
  }

  async function handleRemoveMember(userId: string) {
    setMenuAnchor(null)
    setRemovingId(userId)
    try {
      await gqlFetch(REMOVE_MEMBER_MUTATION, { teamId: team.id, userId })
      onMemberRemoved(team.id, userId)
    } finally {
      setRemovingId(null)
    }
  }

  async function handleChangeRole(userId: string, role: string) {
    setMenuAnchor(null)
    setChangingRoleId(userId)
    try {
      const { changeTeamMemberRole } = await gqlFetch<{ changeTeamMemberRole: GqlTeamMember }>(
        CHANGE_ROLE_MUTATION,
        { teamId: team.id, userId, role },
      )
      onMemberRoleChanged(team.id, changeTeamMemberRole)
    } finally {
      setChangingRoleId(null)
    }
  }

  // Keep last userId stable so menu content doesn't flicker during close animation
  const menuUserIdRef = useRef<string | null>(null)
  if (menuAnchor) menuUserIdRef.current = menuAnchor.userId

  const menuTargetMember = team.members.find((m) => m.userId === menuUserIdRef.current) ?? null
  const roleOptions = (['member', 'admin', ...(isOwner ? ['owner'] : [])] as string[])
    .filter((r) => r !== menuTargetMember?.role)

  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
          {team.name}
        </Typography>
        <RoleChip role={myRole} />
        {canManageMembers && (
          <Tooltip title="Add member">
            <IconButton size="small" onClick={() => setAddOpen(true)}>
              <GroupAddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {isOwner && (
          <Tooltip title="Delete team">
            <IconButton size="small" color="error" onClick={() => setDeleteOpen(true)}>
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider />

      {/* Members */}
      <List disablePadding dense>
        {team.members.map((member) => (
          <ListItem
            key={member.userId}
            secondaryAction={
              canManageMembers && member.userId !== currentUserId ? (
                <span>
                  <IconButton
                    size="small"
                    edge="end"
                    onClick={(e) => setMenuAnchor({ el: e.currentTarget, userId: member.userId })}
                    disabled={removingId === member.userId || changingRoleId === member.userId}
                  >
                    {removingId === member.userId || changingRoleId === member.userId
                      ? <CircularProgress size={16} />
                      : <MoreVertIcon fontSize="small" />}
                  </IconButton>
                </span>
              ) : undefined
            }
          >
            <ListItemAvatar sx={{ minWidth: 40 }}>
              <UserAvatar user={member.user} size={30} />
            </ListItemAvatar>
            <ListItemText
              primary={member.user.name ?? member.user.email ?? member.userId}
              secondary={
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <RoleChip role={member.role} />
                  {member.user.name && (
                    <Typography variant="caption" color="text.secondary">{member.user.email}</Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>

      {/* Member actions menu */}
      <Menu
        open={Boolean(menuAnchor)}
        anchorEl={menuAnchor?.el}
        onClose={() => setMenuAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {roleOptions.map((r) => (
          <MenuItem key={r} onClick={() => handleChangeRole(menuAnchor!.userId, r)}>
            Set as {r}
          </MenuItem>
        ))}
        <Divider />
        <MenuItem
          onClick={() => handleRemoveMember(menuAnchor!.userId)}
          sx={{ color: 'error.main' }}
        >
          <PersonRemoveIcon fontSize="small" sx={{ mr: 1 }} />
          Remove
        </MenuItem>
      </Menu>

      <AddMemberDialog
        teamId={team.id}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={(member) => onMemberAdded(team.id, member)}
      />

      {/* Delete confirmation */}
      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)} maxWidth="xs">
        <DialogTitle>Delete &ldquo;{team.name}&rdquo;?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will remove the team and all its members. Submissions shared with this team
            will no longer be visible to members through the team.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)} disabled={deleting}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}>
            {deleting ? <CircularProgress size={18} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  )
}
