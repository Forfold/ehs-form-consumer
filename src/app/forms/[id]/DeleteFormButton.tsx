'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Typography from '@mui/material/Typography'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { gqlFetch } from '@/lib/graphql/client'

const DELETE_MUTATION = `
  mutation DeleteSubmission($id: ID!) {
    deleteSubmission(id: $id)
  }
`

interface DeleteFormButtonProps {
  submissionId: string
  displayName: string | null
}

export default function DeleteFormButton({
  submissionId,
  displayName,
}: DeleteFormButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleDelete() {
    setDeleting(true)
    try {
      await gqlFetch(DELETE_MUTATION, { id: submissionId })
      router.push('/')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <Button
        variant="outlined"
        color="error"
        size="small"
        startIcon={<DeleteOutlineIcon />}
        onClick={() => setOpen(true)}
      >
        Delete Form
      </Button>

      <Dialog
        open={open}
        onClose={() => !deleting && setOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Delete Form</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Are you sure you want to permanently delete{' '}
            <strong>{displayName ?? 'this form'}</strong>? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deleting}
            startIcon={
              deleting ? <CircularProgress size={14} color="inherit" /> : null
            }
          >
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
