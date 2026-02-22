import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface Props {
  title: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
}

export default function DashboardCard({ title, subtitle, action, children }: Props) {
  return (
    <Paper variant="outlined" sx={{ borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', boxSizing: 'border-box' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} lineHeight={1.2}>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        {action}
      </Box>
      {children}
    </Paper>
  )
}
