import Box from '@mui/material/Box'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>
      {children}
    </Box>
  )
}
