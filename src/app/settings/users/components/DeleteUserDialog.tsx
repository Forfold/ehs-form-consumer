'use client'

import Button from '@mui/material/Button'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import { AdminUser } from './graphql'

interface DeleteUserDialogProps {
  user: AdminUser | null
  onClose: () => void
  onDelete: () => void
  busyUserIds: Set<string>
}

export function DeleteUserDialog({
  user,
  onClose,
  onDelete,
  busyUserIds,
}: DeleteUserDialogProps) {
  if (!user) return null

  return (
    <Dialog open={true} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete User</DialogTitle>
      <DialogContent>
        <Typography variant="body2">
          Are you sure you want to delete{' '}
          <strong>{user.name ?? user.email ?? 'this user'}</strong>? This will
          permanently remove their account and all associated data.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          color="error"
          variant="contained"
          onClick={onDelete}
          disabled={busyUserIds.has(user.id)}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  )
}
