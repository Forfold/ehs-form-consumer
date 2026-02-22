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
  // Always start with 'light' on both server and client to avoid hydration mismatch.
  // The real preference (system or DB) is applied after mount in the effect below.
  const [mode, setModeState] = useState<ThemeMode>('light')

  // After mount: apply DB preference, falling back to system preference
  useEffect(() => {
    const systemMode: ThemeMode = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    gqlFetch<{ settings: { preferences: Record<string, unknown> } | null }>(SETTINGS_QUERY)
      .then(({ settings }) => {
        const dbMode = settings?.preferences?.theme as ThemeMode | undefined
        setModeState(dbMode === 'light' || dbMode === 'dark' ? dbMode : systemMode)
      })
      .catch(() => { setModeState(systemMode) })
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
