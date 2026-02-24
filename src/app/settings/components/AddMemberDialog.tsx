'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import FormControl from '@mui/material/FormControl'
import InputAdornment from '@mui/material/InputAdornment'
import InputLabel from '@mui/material/InputLabel'
import List from '@mui/material/List'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemButton from '@mui/material/ListItemButton'
import ListItemText from '@mui/material/ListItemText'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import SearchIcon from '@mui/icons-material/Search'
import { gqlFetch } from '@/lib/graphql/client'
import { GqlTeamMember, GqlUser, UserAvatar } from './TeamCard'

const SEARCH_USERS_QUERY = `
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      id name email image
    }
  }
`

const ADD_MEMBER_MUTATION = `
  mutation AddTeamMember($teamId: ID!, $userId: ID!, $role: String) {
    addTeamMember(teamId: $teamId, userId: $userId, role: $role) {
      userId role joinedAt user { id name email image }
    }
  }
`

interface AddMemberDialogProps {
  teamId: string
  open: boolean
  onClose: () => void
  onAdded: (member: GqlTeamMember) => void
}

export function AddMemberDialog({
  teamId,
  open,
  onClose,
  onAdded,
}: AddMemberDialogProps) {
  const [allUsers, setAllUsers] = useState<GqlUser[]>([])
  const [filter, setFilter] = useState('')
  const [selectedUser, setSelectedUser] = useState<GqlUser | null>(null)
  const [role, setRole] = useState('member')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  useEffect(() => {
    if (!open) {
      setFilter('')
      setSelectedUser(null)
      setRole('member')
      return
    }
    setFetching(true)
    gqlFetch<{ searchUsers: GqlUser[] }>(SEARCH_USERS_QUERY, { query: '' })
      .then(({ searchUsers }) => setAllUsers(searchUsers))
      .catch(() => {})
      .finally(() => setFetching(false))
  }, [open])

  const filtered = allUsers.filter((u) => {
    if (!filter) return true
    const q = filter.toLowerCase()
    return u.name?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q)
  })

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
      <DialogContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
          pt: '12px !important',
        }}
      >
        {/* Filter input */}
        <TextField
          size="small"
          fullWidth
          placeholder="Filter users…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
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

        {/* Scrollable user list */}
        <Box
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            maxHeight: 400,
            overflowY: 'auto',
          }}
        >
          {fetching ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress size={24} />
            </Box>
          ) : filtered.length === 0 ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', textAlign: 'center', py: 3 }}
            >
              {filter ? 'No users match your filter.' : 'No users found.'}
            </Typography>
          ) : (
            <List disablePadding dense>
              {filtered.map((user, idx) => (
                <Box key={user.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItemButton
                    selected={selectedUser?.id === user.id}
                    onClick={() => setSelectedUser(user)}
                    sx={{ py: 0.75 }}
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
                        user.name ? (
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {user.email}
                          </Typography>
                        ) : undefined
                      }
                    />
                  </ListItemButton>
                </Box>
              ))}
            </List>
          )}
        </Box>

        {/* Role selector */}
        <FormControl size="small">
          <InputLabel>Role</InputLabel>
          <Select value={role} onChange={(e) => setRole(e.target.value)} label="Role">
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="owner">Owner</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
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
