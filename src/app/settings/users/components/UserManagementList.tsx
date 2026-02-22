'use client'

import { useEffect, useRef, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import IconButton from '@mui/material/IconButton'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import MoreVertIcon from '@mui/icons-material/MoreVert'
import SearchIcon from '@mui/icons-material/Search'
import { gqlFetch } from '@/lib/graphql/client'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const ME_QUERY = `query { me { id isAdmin } }`

const ADMIN_USER_LIST_QUERY = `
  query {
    adminUserList {
      id name email image isAdmin formCount
      teamMemberships { teamId teamName role }
    }
  }
`

const ADMIN_ALL_TEAMS_QUERY = `
  query {
    adminAllTeams { id name }
  }
`

const SET_USER_ROLE_MUTATION = `
  mutation AdminSetUserRole($userId: ID!, $isAdmin: Boolean!) {
    adminSetUserRole(userId: $userId, isAdmin: $isAdmin) { id isAdmin }
  }
`

const DELETE_USER_MUTATION = `
  mutation AdminDeleteUser($userId: ID!) {
    adminDeleteUser(userId: $userId)
  }
`

const ADD_USER_TO_TEAM_MUTATION = `
  mutation AdminAddUserToTeam($userId: ID!, $teamId: ID!, $role: String) {
    adminAddUserToTeam(userId: $userId, teamId: $teamId, role: $role) { userId role }
  }
`

const REMOVE_USER_FROM_TEAM_MUTATION = `
  mutation AdminRemoveUserFromTeam($userId: ID!, $teamId: ID!) {
    adminRemoveUserFromTeam(userId: $userId, teamId: $teamId)
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserTeamMembership {
  teamId:   string
  teamName: string
  role:     string
}

interface AdminUser {
  id:              string
  name:            string | null
  email:           string | null
  image:           string | null
  isAdmin:         boolean
  teamMemberships: UserTeamMembership[]
  formCount:       number
}

interface SlimTeam {
  id:   string
  name: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function userInitials(user: AdminUser): string {
  if (user.name) return user.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()
  if (user.email) return user.email[0].toUpperCase()
  return '?'
}

const ROLE_LABELS: Record<string, string> = { owner: 'Owner', admin: 'Admin', member: 'Member' }

// ── Component ─────────────────────────────────────────────────────────────────

export default function UserManagementList() {
  const [authorized, setAuthorized]     = useState<boolean | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [users, setUsers]               = useState<AdminUser[]>([])
  const [allTeams, setAllTeams]         = useState<SlimTeam[]>([])
  const [loading, setLoading]           = useState(true)
  const [search, setSearch]             = useState('')

  // Menu
  const [menuAnchor, setMenuAnchor]   = useState<HTMLElement | null>(null)
  const [menuUserId, setMenuUserId]   = useState<string | null>(null)

  // Add-to-team dialog
  const [addTeamUserId, setAddTeamUserId] = useState<string | null>(null)
  const [addTeamTeamId, setAddTeamTeamId] = useState('')
  const [addTeamRole, setAddTeamRole]     = useState('member')

  // Delete confirmation dialog
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  // Per-item loading states
  const [busyUserIds, setBusyUserIds]         = useState<Set<string>>(new Set())
  const [busyMemberships, setBusyMemberships] = useState<Set<string>>(new Set())

  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    gqlFetch<{ me: { id: string; isAdmin: boolean } | null }>(ME_QUERY)
      .then(({ me }) => {
        if (!me?.isAdmin) {
          setAuthorized(false)
          setLoading(false)
          return
        }
        setAuthorized(true)
        setCurrentUserId(me.id)
        return Promise.all([
          gqlFetch<{ adminUserList: AdminUser[] }>(ADMIN_USER_LIST_QUERY),
          gqlFetch<{ adminAllTeams: SlimTeam[] }>(ADMIN_ALL_TEAMS_QUERY),
        ]).then(([{ adminUserList }, { adminAllTeams }]) => {
          setUsers(adminUserList)
          setAllTeams(adminAllTeams)
          setLoading(false)
        })
      })
      .catch(() => {
        setAuthorized(false)
        setLoading(false)
      })
  }, [])

  // ── Menu helpers ──────────────────────────────────────────────────────────

  const menuUser = users.find((u) => u.id === menuUserId) ?? null

  function openMenu(e: React.MouseEvent<HTMLElement>, userId: string) {
    setMenuAnchor(e.currentTarget)
    setMenuUserId(userId)
  }

  function closeMenu() {
    setMenuAnchor(null)
    setMenuUserId(null)
  }

  // ── Actions ───────────────────────────────────────────────────────────────

  async function handleToggleAdmin(user: AdminUser) {
    closeMenu()
    setBusyUserIds((prev) => new Set(prev).add(user.id))
    try {
      const { adminSetUserRole } = await gqlFetch<{ adminSetUserRole: { id: string; isAdmin: boolean } }>(
        SET_USER_ROLE_MUTATION,
        { userId: user.id, isAdmin: !user.isAdmin },
      )
      setUsers((prev) =>
        prev.map((u) => u.id === user.id ? { ...u, isAdmin: adminSetUserRole.isAdmin } : u)
      )
    } catch {
      // silently ignore — state remains accurate from server
    } finally {
      setBusyUserIds((prev) => { const s = new Set(prev); s.delete(user.id); return s })
    }
  }

  function openAddTeamDialog(userId: string) {
    closeMenu()
    setAddTeamUserId(userId)
    setAddTeamTeamId(allTeams[0]?.id ?? '')
    setAddTeamRole('member')
  }

  async function handleAddToTeam() {
    if (!addTeamUserId || !addTeamTeamId) return
    const userId = addTeamUserId
    setBusyUserIds((prev) => new Set(prev).add(userId))
    try {
      await gqlFetch(ADD_USER_TO_TEAM_MUTATION, { userId, teamId: addTeamTeamId, role: addTeamRole })
      const team = allTeams.find((t) => t.id === addTeamTeamId)
      if (team) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== userId) return u
            const existing = u.teamMemberships.find((m) => m.teamId === addTeamTeamId)
            if (existing) {
              return {
                ...u,
                teamMemberships: u.teamMemberships.map((m) =>
                  m.teamId === addTeamTeamId ? { ...m, role: addTeamRole } : m
                ),
              }
            }
            return {
              ...u,
              teamMemberships: [...u.teamMemberships, { teamId: team.id, teamName: team.name, role: addTeamRole }],
            }
          })
        )
      }
      setAddTeamUserId(null)
    } catch {
      // silently ignore
    } finally {
      setBusyUserIds((prev) => { const s = new Set(prev); s.delete(userId); return s })
    }
  }

  async function handleRemoveFromTeam(userId: string, teamId: string) {
    const key = `${userId}:${teamId}`
    setBusyMemberships((prev) => new Set(prev).add(key))
    try {
      await gqlFetch(REMOVE_USER_FROM_TEAM_MUTATION, { userId, teamId })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, teamMemberships: u.teamMemberships.filter((m) => m.teamId !== teamId) }
            : u
        )
      )
    } catch {
      // silently ignore
    } finally {
      setBusyMemberships((prev) => { const s = new Set(prev); s.delete(key); return s })
    }
  }

  function openDeleteDialog(userId: string) {
    closeMenu()
    setDeleteUserId(userId)
  }

  async function handleDeleteUser() {
    if (!deleteUserId) return
    const userId = deleteUserId
    setBusyUserIds((prev) => new Set(prev).add(userId))
    try {
      await gqlFetch(DELETE_USER_MUTATION, { userId })
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setDeleteUserId(null)
    } catch {
      // silently ignore
    } finally {
      setBusyUserIds((prev) => { const s = new Set(prev); s.delete(userId); return s })
    }
  }

  // ── Render guards ─────────────────────────────────────────────────────────

  if (loading || authorized === null) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!authorized) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography color="text.secondary">You don&apos;t have permission to view this page.</Typography>
      </Container>
    )
  }

  // ── Filtered list ─────────────────────────────────────────────────────────

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  const deleteUser = users.find((u) => u.id === deleteUserId)

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 2.5 }}>
        <Typography variant="h6" fontWeight={600}>Users</Typography>
        <Typography variant="body2" color="text.secondary">{users.length} total</Typography>
      </Box>

      {/* Search */}
      <TextField
        size="small"
        fullWidth
        placeholder="Search by name or email…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {/* Empty state */}
      {filtered.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          {search ? 'No users match your search.' : 'No users found.'}
        </Typography>
      )}

      {/* User rows */}
      {filtered.map((user) => {
        const isBusy = busyUserIds.has(user.id)
        const isSelf = user.id === currentUserId

        return (
          <Paper key={user.id} variant="outlined" sx={{ mb: 1.5, p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>

              {/* Avatar */}
              <Avatar
                src={user.image ?? undefined}
                alt={user.name ?? user.email ?? '?'}
                sx={{ width: 44, height: 44, flexShrink: 0, mt: 0.25 }}
              >
                {userInitials(user)}
              </Avatar>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Name + badges */}
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 0.75, mb: 0.25 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    {user.name ?? user.email}
                  </Typography>
                  {isSelf && (
                    <Typography component="span" variant="caption" color="text.disabled">(you)</Typography>
                  )}
                  {user.isAdmin && (
                    <Chip
                      label="Site Admin"
                      size="small"
                      color="primary"
                      sx={{ height: 20, fontSize: '0.6875rem', fontWeight: 600 }}
                    />
                  )}
                  {user.formCount > 0 && (
                    <Chip
                      label={`${user.formCount} form${user.formCount !== 1 ? 's' : ''}`}
                      size="small"
                      variant="outlined"
                      sx={{ height: 20, fontSize: '0.6875rem' }}
                    />
                  )}
                </Box>

                {/* Email (only if name was shown above) */}
                {user.name && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                    {user.email}
                  </Typography>
                )}

                {/* Team membership chips */}
                {user.teamMemberships.length > 0 ? (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: user.name ? 0 : 0.5 }}>
                    {user.teamMemberships.map((m) => {
                      const memberKey = `${user.id}:${m.teamId}`
                      const isRemoving = busyMemberships.has(memberKey)
                      return (
                        <Chip
                          key={m.teamId}
                          label={`${m.teamName} · ${ROLE_LABELS[m.role] ?? m.role}`}
                          size="small"
                          variant="outlined"
                          disabled={isRemoving}
                          onDelete={isSelf ? undefined : () => handleRemoveFromTeam(user.id, m.teamId)}
                          deleteIcon={
                            isRemoving
                              ? <CircularProgress size={10} />
                              : <CloseIcon sx={{ fontSize: '12px !important' }} />
                          }
                          sx={{ fontSize: '0.6875rem' }}
                        />
                      )
                    })}
                  </Box>
                ) : (
                  <Typography variant="caption" color="text.disabled" sx={{ mt: user.name ? 0 : 0.5, display: 'block' }}>
                    No teams
                  </Typography>
                )}
              </Box>

              {/* Three-dot menu button */}
              <IconButton
                size="small"
                onClick={(e) => openMenu(e, user.id)}
                disabled={isBusy}
                sx={{ flexShrink: 0, mt: 0.25 }}
              >
                {isBusy ? <CircularProgress size={16} /> : <MoreVertIcon fontSize="small" />}
              </IconButton>
            </Box>
          </Paper>
        )
      })}

      {/* ── Actions menu ── */}
      <Menu anchorEl={menuAnchor} open={!!menuAnchor} onClose={closeMenu}>
        {menuUser && [
          <MenuItem
            key="toggle-admin"
            onClick={() => handleToggleAdmin(menuUser)}
            disabled={menuUser.id === currentUserId}
          >
            {menuUser.isAdmin ? 'Remove Site Admin' : 'Make Site Admin'}
          </MenuItem>,
          <MenuItem
            key="add-team"
            onClick={() => openAddTeamDialog(menuUser.id)}
            disabled={allTeams.length === 0}
          >
            Add to Team
          </MenuItem>,
          <Divider key="divider" />,
          <MenuItem
            key="delete"
            onClick={() => openDeleteDialog(menuUser.id)}
            disabled={menuUser.id === currentUserId}
            sx={{ color: 'error.main' }}
          >
            Delete User
          </MenuItem>,
        ]}
      </Menu>

      {/* ── Add to Team dialog ── */}
      <Dialog open={!!addTeamUserId} onClose={() => setAddTeamUserId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Add to Team</DialogTitle>
        <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Team</InputLabel>
            <Select
              value={addTeamTeamId}
              label="Team"
              onChange={(e) => setAddTeamTeamId(e.target.value)}
            >
              {allTeams.map((t) => (
                <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small" fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={addTeamRole}
              label="Role"
              onChange={(e) => setAddTeamRole(e.target.value)}
            >
              <MenuItem value="member">Member</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="owner">Owner</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddTeamUserId(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddToTeam}
            disabled={!addTeamTeamId || (addTeamUserId ? busyUserIds.has(addTeamUserId) : false)}
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete confirmation dialog ── */}
      <Dialog open={!!deleteUserId} onClose={() => setDeleteUserId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to delete{' '}
            <strong>{deleteUser?.name ?? deleteUser?.email ?? 'this user'}</strong>?
            {' '}This will permanently remove their account and all associated data.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteUserId(null)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteUser}
            disabled={deleteUserId ? busyUserIds.has(deleteUserId) : false}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
