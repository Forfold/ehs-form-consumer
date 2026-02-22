'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { SessionProvider } from 'next-auth/react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import { makeTheme, type ThemeMode } from './theme'
import { gqlFetch } from '@/lib/graphql/client'

// ── ThemeContext ───────────────────────────────────────────────────────────────

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
}

export const ThemeContext = createContext<ThemeContextValue>({
  mode: 'light',
  setMode: () => {},
})

export function useThemeMode() {
  return useContext(ThemeContext)
}

const UPDATE_SETTINGS_MUTATION = `
  mutation UpdateSettings($input: UpdateSettingsInput!) {
    updateSettings(input: $input) { preferences }
  }
`

const SETTINGS_QUERY = `
  query { settings { preferences } }
`

// ── Providers ─────────────────────────────────────────────────────────────────

export default function Providers({ children }: { children: React.ReactNode }) {
  // Read from localStorage synchronously to avoid flash
  const [mode, setModeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return 'light'
    return (localStorage.getItem('theme') as ThemeMode | null) ?? 'light'
  })

  // On mount, confirm with DB (handles different-device scenario)
  useEffect(() => {
    gqlFetch<{ settings: { preferences: Record<string, unknown> } | null }>(SETTINGS_QUERY)
      .then(({ settings }) => {
        const dbMode = settings?.preferences?.theme as ThemeMode | undefined
        if (dbMode === 'light' || dbMode === 'dark') {
          setModeState(dbMode)
          localStorage.setItem('theme', dbMode)
        }
      })
      .catch(() => {/* db not configured */})
  }, [])

  function setMode(m: ThemeMode) {
    setModeState(m)
    localStorage.setItem('theme', m)
    gqlFetch(UPDATE_SETTINGS_MUTATION, { input: { preferences: { theme: m } } })
      .catch(() => {/* db not configured */})
  }

  const theme = useMemo(() => makeTheme(mode), [mode])

  return (
    <ThemeContext.Provider value={{ mode, setMode }}>
      <SessionProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </SessionProvider>
    </ThemeContext.Provider>
  )
}
