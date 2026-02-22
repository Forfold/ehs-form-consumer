'use client'

import { useEffect, useRef, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import LogoutIcon from '@mui/icons-material/Logout'
import { signOut } from 'next-auth/react'
import { gqlFetch } from '@/lib/graphql/client'
import { useThemeMode } from '@/app/Providers'
import type { ThemeMode } from '@/app/theme'

interface GqlUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
}

const ME_QUERY = `query { me { id name email image } }`

export default function UserMenu() {
  const [user, setUser] = useState<GqlUser | null>(null)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const fetchedRef = useRef(false)
  const { mode, setMode } = useThemeMode()

  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true
    gqlFetch<{ me: GqlUser | null }>(ME_QUERY)
      .then(({ me }) => setUser(me))
      .catch(() => {})
  }, [])

  const initial = (user?.name ?? user?.email ?? '?')[0].toUpperCase()

  return (
    <>
      <IconButton
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="account menu"
      >
        <Avatar
          src={user?.image ?? undefined}
          alt={user?.name ?? user?.email ?? '?'}
          sx={{ width: 36, height: 36, fontSize: '1rem' }}
        >
          {initial}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { minWidth: 200, mt: 0.5 } } }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {user && (
          <MenuItem disabled sx={{ flexDirection: 'column', alignItems: 'flex-start', opacity: '1 !important' }}>
            <Typography variant="body2" fontWeight={600} noWrap>
              {user.name ?? user.email}
            </Typography>
            {user.name && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {user.email}
              </Typography>
            )}
          </MenuItem>
        )}

        {user && <Divider />}

        <MenuItem disableRipple sx={{ justifyContent: 'space-between', gap: 1, cursor: 'default', '&:hover': { bgcolor: 'transparent' } }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Theme
          </Typography>
          <Box onClick={(e) => e.stopPropagation()}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              size="small"
              onChange={(_, v: ThemeMode | null) => { if (v) setMode(v) }}
              aria-label="theme mode"
              sx={{ '& .MuiToggleButton-root': { px: 1.25, py: 0.25, fontSize: '0.7rem', fontWeight: 600, textTransform: 'none', lineHeight: 1.6 } }}
            >
              <ToggleButton value="light" aria-label="light">Light</ToggleButton>
              <ToggleButton value="system" aria-label="system">System</ToggleButton>
              <ToggleButton value="dark" aria-label="dark">Dark</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </MenuItem>

        <Divider />
        <MenuItem onClick={() => signOut()}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Sign Out
        </MenuItem>
      </Menu>
    </>
  )
}
