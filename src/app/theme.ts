import { createTheme } from '@mui/material/styles'

const theme = createTheme({
  typography: {
    fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif',
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600 },
  },
  shape: {
    borderRadius: 8,
  },
  palette: {
    primary: {
      main: '#1B4FD8',
    },
    background: {
      default: '#F0F2F5',
      paper: '#FFFFFF',
    },
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
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E8EC',
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
        outlined: { borderColor: '#E5E8EC' },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 600,
          backgroundColor: '#F8F9FB',
          color: '#5A6374',
          fontSize: '0.75rem',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
        },
      },
    },
  },
})

export default theme
