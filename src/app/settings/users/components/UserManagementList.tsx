'use client'

import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import InputAdornment from '@mui/material/InputAdornment'
import SearchIcon from '@mui/icons-material/Search'
import { gqlFetch } from '@/lib/graphql/client'
import {
  AdminUser,
  SlimTeam,
  ME_QUERY,
  ADMIN_USER_LIST_QUERY,
  ADMIN_ALL_TEAMS_QUERY,
  SET_USER_ROLE_MUTATION,
  DELETE_USER_MUTATION,
  ADD_USER_TO_TEAM_MUTATION,
  REMOVE_USER_FROM_TEAM_MUTATION,
} from './graphql'
import { UserRow } from './UserRow'
import { AddUserToTeamDialog } from './AddUserToTeamDialog'
import { DeleteUserDialog } from './DeleteUserDialog'

export default function UserManagementList() {
  const [authorized, setAuthorized] = useState<boolean | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [allTeams, setAllTeams] = useState<SlimTeam[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  // Dialog states
  const [addTeamUserId, setAddTeamUserId] = useState<string | null>(null)
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null)

  // Per-item loading states
  const [busyUserIds, setBusyUserIds] = useState<Set<string>>(new Set())
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

  async function handleToggleAdmin(user: AdminUser) {
    setBusyUserIds((prev) => new Set(prev).add(user.id))
    try {
      const { adminSetUserRole } = await gqlFetch<{
        adminSetUserRole: { id: string; isAdmin: boolean }
      }>(SET_USER_ROLE_MUTATION, { userId: user.id, isAdmin: !user.isAdmin })
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id ? { ...u, isAdmin: adminSetUserRole.isAdmin } : u,
        ),
      )
    } catch {
      // silently ignore — state remains accurate from server
    } finally {
      setBusyUserIds((prev) => {
        const s = new Set(prev)
        s.delete(user.id)
        return s
      })
    }
  }

  async function handleAddToTeam(userId: string, teamId: string, role: string) {
    if (!userId || !teamId) return
    setBusyUserIds((prev) => new Set(prev).add(userId))
    try {
      await gqlFetch(ADD_USER_TO_TEAM_MUTATION, { userId, teamId, role })
      const team = allTeams.find((t) => t.id === teamId)
      if (team) {
        setUsers((prev) =>
          prev.map((u) => {
            if (u.id !== userId) return u
            const existing = u.teamMemberships.find((m) => m.teamId === teamId)
            if (existing) {
              return {
                ...u,
                teamMemberships: u.teamMemberships.map((m) =>
                  m.teamId === teamId ? { ...m, role: role } : m,
                ),
              }
            }
            return {
              ...u,
              teamMemberships: [
                ...u.teamMemberships,
                { teamId: team.id, teamName: team.name, role },
              ],
            }
          }),
        )
      }
      setAddTeamUserId(null)
    } catch {
      // silently ignore
    } finally {
      setBusyUserIds((prev) => {
        const s = new Set(prev)
        s.delete(userId)
        return s
      })
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
            ? {
                ...u,
                teamMemberships: u.teamMemberships.filter((m) => m.teamId !== teamId),
              }
            : u,
        ),
      )
    } catch {
      // silently ignore
    } finally {
      setBusyMemberships((prev) => {
        const s = new Set(prev)
        s.delete(key)
        return s
      })
    }
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
      setBusyUserIds((prev) => {
        const s = new Set(prev)
        s.delete(userId)
        return s
      })
    }
  }

  if (loading || authorized === null) {
    return (
      <Container
        maxWidth="md"
        sx={{ py: 4, display: 'flex', justifyContent: 'center' }}
      >
        <CircularProgress />
      </Container>
    )
  }

  if (!authorized) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography color="text.secondary">
          You don&apos;t have permission to view this page.
        </Typography>
      </Container>
    )
  }

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

  const deleteUser = users.find((u) => u.id === deleteUserId)
  const addUserToTeamUser = users.find((u) => u.id === addTeamUserId)

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          mb: 2.5,
        }}
      >
        <Typography variant="h6" fontWeight={600}>
          Users
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {users.length} total
        </Typography>
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
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ textAlign: 'center', py: 4 }}
        >
          {search ? 'No users match your search.' : 'No users found.'}
        </Typography>
      )}

      {/* User rows */}
      {filtered.map((user) => (
        <UserRow
          key={user.id}
          user={user}
          currentUserId={currentUserId}
          allTeams={allTeams}
          busyUserIds={busyUserIds}
          busyMemberships={busyMemberships}
          onToggleAdmin={handleToggleAdmin}
          onAddTeam={() => setAddTeamUserId(user.id)}
          onRemoveFromTeam={handleRemoveFromTeam}
          onDelete={() => setDeleteUserId(user.id)}
        />
      ))}

      {addUserToTeamUser && (
        <AddUserToTeamDialog
          user={addUserToTeamUser}
          teams={allTeams}
          onClose={() => setAddTeamUserId(null)}
          onAdd={handleAddToTeam}
          busyUserIds={busyUserIds}
        />
      )}
      {deleteUser && (
        <DeleteUserDialog
          user={deleteUser}
          onClose={() => setDeleteUserId(null)}
          onDelete={handleDeleteUser}
          busyUserIds={busyUserIds}
        />
      )}
    </Container>
  )
}
