'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import Link from 'next/link'
import UserMenu from '@/app/components/UserMenu'
import { gqlFetch } from '@/lib/graphql/client'

const BASE_TABS = [
  { label: 'General', href: '/settings' },
  { label: 'Teams',   href: '/settings/teams' },
]

const ADMIN_TAB = { label: 'Users', href: '/settings/users' }

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    try {
      const cached = localStorage.getItem('settings_isAdmin')
      if (cached === 'true') setIsAdmin(true)
    } catch {}

    gqlFetch<{ me: { isAdmin: boolean } | null }>('query { me { isAdmin } }')
      .then(({ me }) => {
        const admin = !!me?.isAdmin
        setIsAdmin(admin)
        try { localStorage.setItem('settings_isAdmin', String(admin)) } catch {}
      })
      .catch(() => {})
  }, [])

  const TABS = isAdmin ? [...BASE_TABS, ADMIN_TAB] : BASE_TABS
  const activeTab = TABS.findIndex((t) => t.href === pathname)

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            size="small"
            edge="start"
            component={Link}
            href="/"
            sx={{ color: 'text.secondary', mr: 0.5 }}
            aria-label="back"
          >
            <ArrowBackIcon fontSize="small" />
          </IconButton>
          <AssignmentOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography
            variant="subtitle1"
            sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: 'text.primary', flex: 1 }}
          >
            Settings
          </Typography>
          <UserMenu />
        </Toolbar>
        <Tabs
          value={activeTab === -1 ? false : activeTab}
          sx={{ px: 2, minHeight: 40, '& .MuiTab-root': { minHeight: 40, py: 0, fontSize: '0.8125rem' } }}
        >
          {TABS.map((tab) => (
            <Tab key={tab.href} label={tab.label} component={Link} href={tab.href} />
          ))}
        </Tabs>
      </AppBar>

      {children}
    </Box>
  )
}
