'use client'

import { useEffect, useRef, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Divider from '@mui/material/Divider'
import InputAdornment from '@mui/material/InputAdornment'
import List from '@mui/material/List'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Paper from '@mui/material/Paper'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import CheckIcon from '@mui/icons-material/Check'
import SearchIcon from '@mui/icons-material/Search'
import { gqlFetch } from '@/lib/graphql/client'
import TeamManager from '@/app/settings/components/TeamManager'

// ── GraphQL ───────────────────────────────────────────────────────────────────

const ME_QUERY = `query { me { id isAdmin } }`

const ALL_USERS_QUERY = `
  query {
    allUsers { id name email image }
  }
`

const TEAMS_QUERY = `
  query {
    teams {
      id name
      members { userId role }
    }
  }
`

const ADD_MEMBER_MUTATION = `
  mutation AddTeamMember($teamId: ID!, $userId: ID!, $role: String) {
    addTeamMember(teamId: $teamId, userId: $userId, role: $role) {
      userId role
    }
  }
`

// ── Types ─────────────────────────────────────────────────────────────────────

interface GqlUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

interface SlimTeam {
  id: string
  name: string
  members: Array<{ userId: string; role: string }>
}

// ── User sidebar ──────────────────────────────────────────────────────────────

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

interface UserSidebarProps {
  users: GqlUser[]
  teams: SlimTeam[]
  selectedTeamId: string | null
  onSelectTeam: (id: string) => void
  onAddUser: (userId: string) => Promise<void>
  addingUserId: string | null
}

function UserSidebar({
  users,
  teams,
  selectedTeamId,
  onSelectTeam,
  onAddUser,
  addingUserId,
}: UserSidebarProps) {
  const [search, setSearch] = useState('')

  const selectedTeam = teams.find((t) => t.id === selectedTeamId)
  const memberIds = new Set(selectedTeam?.members.map((m) => m.userId) ?? [])

  const filtered = users.filter((u) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    )
  })

  return (
    <Paper
      variant="outlined"
      sx={{
        width: 280,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        borderRadius: 2,
        alignSelf: 'flex-start',
      }}
    >
      {/* Team selector */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ mb: 0.5, display: 'block' }}>
          Add to team
        </Typography>
        <Select
          size="small"
          fullWidth
          displayEmpty
          value={selectedTeamId ?? ''}
          onChange={(e) => onSelectTeam(e.target.value)}
        >
          <MenuItem value="" disabled>Select a team…</MenuItem>
          {teams.map((t) => (
            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Search */}
      <Box sx={{ p: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
        <TextField
          size="small"
          fullWidth
          placeholder="Filter users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
      </Box>

      {/* User list */}
      <List disablePadding dense sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
        {filtered.length === 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', py: 3 }}>
            No users found
          </Typography>
        )}
        {filtered.map((user, idx) => {
          const isMember = memberIds.has(user.id)
          const isAdding = addingUserId === user.id
          const disabled = !selectedTeamId || isMember || isAdding

          return (
            <Box key={user.id}>
              {idx > 0 && <Divider component="li" />}
              <Tooltip
                title={!selectedTeamId ? 'Select a team first' : isMember ? 'Already a member' : 'Click to add'}
                placement="right"
                disableInteractive
              >
                <span>
                  <ListItemButton
                    disabled={disabled}
                    onClick={() => onAddUser(user.id)}
                    sx={{ py: 1 }}
                  >
                    <ListItemAvatar sx={{ minWidth: 40 }}>
                      <UserAvatar user={user} size={30} />
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          {user.name ?? user.email}
                        </Typography>
                      }
                      secondary={
                        user.name
                          ? <Typography variant="caption" color="text.secondary" noWrap>{user.email}</Typography>
                          : undefined
                      }
                    />
                    {isAdding && <CircularProgress size={16} sx={{ ml: 1, flexShrink: 0 }} />}
                    {isMember && !isAdding && (
                      <CheckIcon fontSize="small" color="success" sx={{ ml: 1, flexShrink: 0 }} />
                    )}
                  </ListItemButton>
                </span>
              </Tooltip>
            </Box>
          )
        })}
      </List>
    </Paper>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TeamsWithUsers() {
  const [isAdmin, setIsAdmin] = useState(false)
  const [allUsers, setAllUsers] = useState<GqlUser[]>([])
  const [teams, setTeams] = useState<SlimTeam[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null)
  const [addingUserId, setAddingUserId] = useState<string | null>(null)
  const fetchedRef = useRef(false)

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    gqlFetch<{ me: { id: string; isAdmin: boolean } | null }>(ME_QUERY)
      .then(({ me }) => {
        if (!me?.isAdmin) return
        setIsAdmin(true)
        return Promise.all([
          gqlFetch<{ allUsers: GqlUser[] }>(ALL_USERS_QUERY),
          gqlFetch<{ teams: SlimTeam[] }>(TEAMS_QUERY),
        ]).then(([{ allUsers }, { teams }]) => {
          setAllUsers(allUsers)
          setTeams(teams)
        })
      })
      .catch(() => {})
  }, [])

  async function handleAddUser(userId: string) {
    if (!selectedTeamId) return
    setAddingUserId(userId)
    try {
      await gqlFetch(ADD_MEMBER_MUTATION, { teamId: selectedTeamId, userId, role: 'member' })
      // Update local teams state to reflect new member
      setTeams((prev) =>
        prev.map((t) =>
          t.id === selectedTeamId && !t.members.find((m) => m.userId === userId)
            ? { ...t, members: [...t.members, { userId, role: 'member' }] }
            : t
        )
      )
    } catch {
      // silently ignore — TeamManager will show accurate state
    } finally {
      setAddingUserId(null)
    }
  }

  if (!isAdmin) {
    // Non-admins: full-width team management only
    return <TeamManager />
  }

  return (
    <Box sx={{ display: 'flex', gap: 3, p: 3, alignItems: 'flex-start' }}>
      <UserSidebar
        users={allUsers}
        teams={teams}
        selectedTeamId={selectedTeamId}
        onSelectTeam={setSelectedTeamId}
        onAddUser={handleAddUser}
        addingUserId={addingUserId}
      />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <TeamManager />
      </Box>
    </Box>
  )
}
