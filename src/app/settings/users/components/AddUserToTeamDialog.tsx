
'use client'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import FormControl from '@mui/material/FormControl'
import InputLabel from '@mui/material/InputLabel'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import { AdminUser, SlimTeam } from './graphql'

interface AddUserToTeamDialogProps {
  user: AdminUser | null
  teams: SlimTeam[]
  onClose: () => void
  onAdd: (userId: string, teamId: string, role: string) => void
  busyUserIds: Set<string>
}

export function AddUserToTeamDialog({
  user,
  teams,
  onClose,
  onAdd,
  busyUserIds,
}: AddUserToTeamDialogProps) {
  const [teamId, setTeamId] = useState(teams[0]?.id ?? '')
  const [role, setRole] = useState('member')

  if (!user) return null

  function handleAdd() {
    onAdd(user!.id, teamId, role)
  }

  return (
    <Dialog open={true} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Add to Team</DialogTitle>
      <DialogContent sx={{ pt: '12px !important', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <FormControl size="small" fullWidth>
          <InputLabel>Team</InputLabel>
          <Select
            value={teamId}
            label="Team"
            onChange={(e) => setTeamId(e.target.value)}
          >
            {teams.map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" fullWidth>
          <InputLabel>Role</InputLabel>
          <Select
            value={role}
            label="Role"
            onChange={(e) => setRole(e.target.value)}
          >
            <MenuItem value="member">Member</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="owner">Owner</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={!teamId || busyUserIds.has(user.id)}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  )
}
