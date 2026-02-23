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

function setCookie(m: ThemeMode) {
  document.cookie = `theme=${m}; path=/; max-age=31536000; SameSite=Lax`
}

export default function Providers({
  children,
  initialMode = 'light',
}: {
  children: React.ReactNode
  initialMode?: ThemeMode
}) {
  // initialMode comes from the server-read cookie, so server and client agree from the start.
  const [mode, setModeState] = useState<ThemeMode>(initialMode)
  // Tracks the OS dark/light preference; only used when mode === 'system'
  const [systemPreference, setSystemPreference] = useState<'light' | 'dark'>('light')

  // Listen for OS preference changes only while mode is 'system'
  useEffect(() => {
    if (mode !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const update = () => setSystemPreference(mq.matches ? 'dark' : 'light')
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [mode])

  // Derive resolved mode — no extra state, no cascading renders
  const resolvedMode: 'light' | 'dark' = mode === 'system' ? systemPreference : mode

  // After mount: sync with DB preference (and keep cookie up to date)
  useEffect(() => {
    gqlFetch<{ settings: { preferences: Record<string, unknown> } | null }>(
      SETTINGS_QUERY,
    )
      .then(({ settings }) => {
        const dbMode = settings?.preferences?.theme as ThemeMode | undefined
        if (dbMode === 'light' || dbMode === 'dark' || dbMode === 'system') {
          setModeState(dbMode)
          setCookie(dbMode)
        }
      })
      .catch(() => {
        /* db not configured */
      })
  }, [])

  function setMode(m: ThemeMode) {
    setModeState(m)
    setCookie(m)
    gqlFetch(UPDATE_SETTINGS_MUTATION, {
      input: { preferences: { theme: m } },
    }).catch(() => {
      /* db not configured */
    })
  }

  const theme = useMemo(() => makeTheme(resolvedMode), [resolvedMode])

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
