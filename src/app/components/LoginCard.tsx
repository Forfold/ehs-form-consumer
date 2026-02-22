'use client'

import { signIn } from 'next-auth/react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'

export default function LoginCard() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 3,
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: '100%',
          maxWidth: 400,
          p: { xs: 3, sm: 4 },
          borderRadius: 3,
          textAlign: 'center',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
          <AssignmentOutlinedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
          <Typography variant="h6" fontWeight={600}>FormVis</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Sign in to access your inspection history and settings.
        </Typography>
        <Button
          variant="contained"
          fullWidth
          onClick={() => signIn('google')}
          sx={{ py: 1.25 }}
        >
          Sign in with Google
        </Button>
      </Paper>
    </Box>
  )
}
