'use client'

import { useEffect, useRef, useState } from 'react'
import AppBar from '@mui/material/AppBar'
import Autocomplete from '@mui/material/Autocomplete'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
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
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Toolbar from '@mui/material/Toolbar'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import AddIcon from '@mui/icons-material/Add'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import GroupAddIcon from '@mui/icons-material/GroupAdd'
import PersonRemoveIcon from '@mui/icons-material/PersonRemove'
import Link from 'next/link'
import { gqlFetch } from '@/lib/graphql/client'

// ── GraphQL fragments ─────────────────────────────────────────────────────────

const TEAMS_QUERY = `
  query {
    teams {
      id
      name
      members {
        userId
        role
        joinedAt
        user { id name email image }
      }
    }
  }
`

const SEARCH_USERS_QUERY = `
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      id name email image
    }
  }
`

const CREATE_TEAM_MUTATION = `
  mutation CreateTeam($name: String!) {
    createTeam(name: $name) {
      id name
      members { userId role joinedAt user { id name email image } }
    }
  }
`

const DELETE_TEAM_MUTATION = `
  mutation DeleteTeam($id: ID!) {
    deleteTeam(id: $id)
  }
`

const ADD_MEMBER_MUTATION = `
  mutation AddTeamMember($teamId: ID!, $userId: ID!, $role: String) {
    addTeamMember(teamId: $teamId, userId: $userId, role: $role) {
      userId role joinedAt user { id name email image }
    }
  }
`

const REMOVE_MEMBER_MUTATION = `
  mutation RemoveTeamMember($teamId: ID!, $userId: ID!) {
    removeTeamMember(teamId: $teamId, userId: $userId)
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

interface GqlUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

interface GqlTeamMember {
  userId: string
  role: string
  joinedAt: string
  user: GqlUser
}

interface GqlTeam {
  id: string
  name: string
  members: GqlTeamMember[]
}

// ── Sub-components ────────────────────────────────────────────────────────────

function UserAvatar({ user, size = 32 }: { user: GqlUser; size?: number }) {
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
  return <Chip label={role} size="small" color={color as 'error' | 'warning' | 'default'} variant="outlined" />
}

// ── Add member dialog ─────────────────────────────────────────────────────────

interface AddMemberDialogProps {
  teamId: string
  open: boolean
  onClose: () => void
  onAdded: (member: GqlTeamMember) => void
}

function AddMemberDialog({ teamId, open, onClose, onAdded }: AddMemberDialogProps) {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<GqlUser[]>([])
  const [selectedUser, setSelectedUser] = useState<GqlUser | null>(null)
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!open) {
      setInputValue('')
      setOptions([])
      setSelectedUser(null)
      setRole('member')
    }
  }, [open])

  function handleInputChange(_: React.SyntheticEvent, value: string) {
    setInputValue(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (value.length < 2) { setOptions([]); return }
    debounceRef.current = setTimeout(async () => {
      setSearching(true)
      try {
        const { searchUsers } = await gqlFetch<{ searchUsers: GqlUser[] }>(
          SEARCH_USERS_QUERY, { query: value }
        )
        setOptions(searchUsers)
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  async function handleAdd() {
    if (!selectedUser) return
    setLoading(true)
    try {
      const { addTeamMember } = await gqlFetch<{ addTeamMember: GqlTeamMember }>(
        ADD_MEMBER_MUTATION,
        { teamId, userId: selectedUser.id, role },
      )
      onAdded(addTeamMember)
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add team member</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '16px !important' }}>
        <Autocomplete
          options={options}
          loading={searching}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          value={selectedUser}
          onChange={(_, v) => setSelectedUser(v)}
          getOptionLabel={(o) => o.email ?? o.name ?? o.id}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Search by name or email"
              size="small"
              slotProps={{
                input: {
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {searching && <CircularProgress size={16} />}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                },
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props} sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <UserAvatar user={option} size={28} />
              <Box>
                <Typography variant="body2">{option.name ?? option.email}</Typography>
                {option.name && <Typography variant="caption" color="text.secondary">{option.email}</Typography>}
              </Box>
            </Box>
          )}
        />
        <Select
          size="small"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          label="Role"
        >
          <MenuItem value="member">Member</MenuItem>
          <MenuItem value="admin">Admin</MenuItem>
          <MenuItem value="owner">Owner</MenuItem>
        </Select>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!selectedUser || loading}
          onClick={handleAdd}
        >
          {loading ? <CircularProgress size={18} /> : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}

// ── Team card ─────────────────────────────────────────────────────────────────

interface TeamCardProps {
  team: GqlTeam
  currentUserId: string | null
  onDeleted: (id: string) => void
  onMemberAdded: (teamId: string, member: GqlTeamMember) => void
  onMemberRemoved: (teamId: string, userId: string) => void
}

function TeamCard({ team, currentUserId, onDeleted, onMemberAdded, onMemberRemoved }: TeamCardProps) {
  const [addOpen, setAddOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

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
    setRemovingId(userId)
    try {
      await gqlFetch(REMOVE_MEMBER_MUTATION, { teamId: team.id, userId })
      onMemberRemoved(team.id, userId)
    } finally {
      setRemovingId(null)
    }
  }

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
                <Tooltip title="Remove member">
                  <span>
                    <IconButton
                      size="small"
                      edge="end"
                      onClick={() => handleRemoveMember(member.userId)}
                      disabled={removingId === member.userId}
                    >
                      {removingId === member.userId
                        ? <CircularProgress size={16} />
                        : <PersonRemoveIcon fontSize="small" />}
                    </IconButton>
                  </span>
                </Tooltip>
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

// ── Main component ────────────────────────────────────────────────────────────

export default function TeamManager() {
  const [teams, setTeams] = useState<GqlTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [createName, setCreateName] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    Promise.all([
      gqlFetch<{ teams: GqlTeam[] }>(TEAMS_QUERY),
      gqlFetch<{ me: { id: string } | null }>('query { me { id } }'),
    ])
      .then(([{ teams }, { me }]) => {
        setTeams(teams)
        setCurrentUserId(me?.id ?? null)
      })
      .catch(() => {/* db not configured */})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault()
    if (!createName.trim()) return
    setCreating(true)
    try {
      const { createTeam } = await gqlFetch<{ createTeam: GqlTeam }>(
        CREATE_TEAM_MUTATION, { name: createName.trim() }
      )
      setTeams((prev) => [createTeam, ...prev])
      setCreateName('')
    } finally {
      setCreating(false)
    }
  }

  function handleTeamDeleted(id: string) {
    setTeams((prev) => prev.filter((t) => t.id !== id))
  }

  function handleMemberAdded(teamId: string, member: GqlTeamMember) {
    setTeams((prev) => prev.map((t) =>
      t.id === teamId
        ? { ...t, members: [...t.members.filter((m) => m.userId !== member.userId), member] }
        : t
    ))
  }

  function handleMemberRemoved(teamId: string, userId: string) {
    setTeams((prev) => prev.map((t) =>
      t.id === teamId
        ? { ...t, members: t.members.filter((m) => m.userId !== userId) }
        : t
    ))
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            size="small"
            edge="start"
            component={Link}
            href="/"
            sx={{ color: 'text.secondary', mr: 0.5 }}
            aria-label="back"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <AssignmentOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: 'text.primary', flex: 1 }}>
            Settings
          </Typography>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ py: 4, flex: 1 }}>
        <Typography variant="h6" gutterBottom>Teams</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Create teams to share form submissions with colleagues. Any team member can share
          their own submissions; owners and admins manage membership.
        </Typography>

        {/* Create team form */}
        <Box
          component="form"
          onSubmit={handleCreateTeam}
          sx={{ display: 'flex', gap: 1, mb: 3 }}
        >
          <TextField
            size="small"
            placeholder="New team name…"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            sx={{ flex: 1 }}
          />
          <Button
            type="submit"
            variant="contained"
            startIcon={creating ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
            disabled={!createName.trim() || creating}
          >
            Create
          </Button>
        </Box>

        {/* Team list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
            <CircularProgress />
          </Box>
        ) : teams.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
            No teams yet. Create one above.
          </Typography>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {teams.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                currentUserId={currentUserId}
                onDeleted={handleTeamDeleted}
                onMemberAdded={handleMemberAdded}
                onMemberRemoved={handleMemberRemoved}
              />
            ))}
          </Box>
        )}
      </Container>
    </Box>
  )
}
