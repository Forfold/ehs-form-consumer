'use client'

import { useEffect, useRef, useState } from 'react'
import Avatar from '@mui/material/Avatar'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import ListItemIcon from '@mui/material/ListItemIcon'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import Typography from '@mui/material/Typography'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import LogoutIcon from '@mui/icons-material/Logout'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { gqlFetch } from '@/lib/graphql/client'

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
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="account menu"
        sx={{ p: 0.25 }}
      >
        <Avatar
          src={user?.image ?? undefined}
          alt={user?.name ?? user?.email ?? '?'}
          sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
        >
          {initial}
        </Avatar>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        onClick={() => setAnchorEl(null)}
        slotProps={{ paper: { sx: { minWidth: 180, mt: 0.5 } } }}
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
        <MenuItem component={Link} href="/settings">
          <ListItemIcon><SettingsOutlinedIcon fontSize="small" /></ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => signOut()}>
          <ListItemIcon><LogoutIcon fontSize="small" /></ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  )
}
