'use client'

import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react'
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
  // Start with 'light' to match SSR — real theme applied after hydration
  const [mode, setModeState] = useState<ThemeMode>('light')

  // Runs before first paint — no flash
  useLayoutEffect(() => {
    const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setModeState(systemDark ? 'dark' : 'light')
  }, [])

  // Fetch from DB and override if a preference is saved
  useEffect(() => {
    gqlFetch<{ settings: { preferences: Record<string, unknown> } | null }>(SETTINGS_QUERY)
      .then(({ settings }) => {
        const dbMode = settings?.preferences?.theme as ThemeMode | undefined
        if (dbMode === 'light' || dbMode === 'dark') {
          setModeState(dbMode)
        }
      })
      .catch(() => {/* db not configured */})
  }, [])

  function setMode(m: ThemeMode) {
    setModeState(m)
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
