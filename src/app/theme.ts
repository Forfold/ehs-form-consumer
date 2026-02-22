import { createTheme } from '@mui/material/styles'

export type ThemeMode = 'light' | 'dark' | 'system'

export function makeTheme(mode: ThemeMode) {
  // 'system' is resolved to 'light'/'dark' by Providers before calling makeTheme
  const resolved: 'light' | 'dark' = mode === 'system' ? 'light' : mode
  const dark = resolved === 'dark'
  return createTheme({
    typography: {
      fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
      h6:       { fontWeight: 700, letterSpacing: '-0.01em' },
      subtitle1: { fontWeight: 600 },
    },
    shape: {
      borderRadius: 8,
    },
    palette: {
      mode: resolved,
      primary: {
        main: dark ? '#6B9FFF' : '#1B4FD8',
      },
      background: dark
        ? { default: '#0F1117', paper: '#1A1F2E' }
        : { default: '#F0F2F5', paper: '#FFFFFF' },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.01em',
          },
          containedPrimary: {
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            backgroundColor: dark ? '#1E2430' : '#FFFFFF',
            borderBottom: `1px solid ${dark ? '#2D3548' : '#E5E8EC'}`,
            color: 'inherit',
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiPaper: {
        styleOverrides: {
          outlined: { borderColor: dark ? '#2D3548' : '#E5E8EC' },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          head: {
            fontWeight: 600,
            backgroundColor: dark ? '#1A2035' : '#F8F9FB',
            color: dark ? '#8B95A9' : '#5A6374',
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          },
        },
      },
    },
  })
}

export default makeTheme('light')
