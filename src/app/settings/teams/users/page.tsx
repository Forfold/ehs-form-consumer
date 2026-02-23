'use client'

import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import Link from 'next/link'
import UserMenu from '@/app/components/main/UserMenu'
import UserManagementList from '@/app/settings/users/components/UserManagementList'

export default function TeamsUsersPage() {
  return (
    <>
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <Breadcrumbs
            sx={{
              flexGrow: 1,
              '& .MuiBreadcrumbs-separator': { color: 'text.disabled' },
            }}
          >
            <Box
              component={Link}
              href="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                textDecoration: 'none',
                '&:hover': { opacity: 0.8 },
              }}
            >
              <AssignmentOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: 'text.primary',
                }}
              >
                FormVis
              </Typography>
            </Box>
            <Box
              component={Link}
              href="/settings/teams"
              sx={{ textDecoration: 'none', '&:hover': { opacity: 0.8 } }}
            >
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 500,
                  letterSpacing: '-0.01em',
                  color: 'text.primary',
                }}
              >
                Teams
              </Typography>
            </Box>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 500,
                letterSpacing: '-0.01em',
                color: 'text.primary',
              }}
            >
              Users
            </Typography>
          </Breadcrumbs>
          <UserMenu />
        </Toolbar>
      </AppBar>

      <UserManagementList />
    </>
  )
}
