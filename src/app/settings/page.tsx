'use client'

import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined'
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined'
import { useThemeMode } from '@/app/Providers'
import type { ThemeMode } from '@/app/theme'

export default function SettingsPage() {
  const { mode, setMode } = useThemeMode()

  return (
    <Container maxWidth="sm" sx={{ py: 4 }}>
      <Typography variant="h6" gutterBottom>Appearance</Typography>
      <Divider sx={{ mb: 3 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="body2" fontWeight={600}>Theme</Typography>
          <Typography variant="caption" color="text.secondary">
            Choose between light and dark mode
          </Typography>
        </Box>
        <ToggleButtonGroup
          value={mode}
          exclusive
          size="small"
          onChange={(_, v: ThemeMode | null) => { if (v) setMode(v) }}
          aria-label="theme mode"
        >
          <ToggleButton value="light" aria-label="light mode">
            <LightModeOutlinedIcon fontSize="small" sx={{ mr: 0.75 }} />
            Light
          </ToggleButton>
          <ToggleButton value="dark" aria-label="dark mode">
            <DarkModeOutlinedIcon fontSize="small" sx={{ mr: 0.75 }} />
            Dark
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Container>
  )
}
