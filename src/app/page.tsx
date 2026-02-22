'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import { extractInspection } from '@/lib/extractInspection'
import { gqlFetch } from '@/lib/graphql/client'
import HistorySidebar, { type HistoryItem } from './components/HistorySidebar'
import UserMenu from './components/UserMenu'
import UploaderCard from './components/dashboard/UploaderCard'
import DashboardPanel from './components/dashboard/DashboardPanel'

const SUBMISSIONS_QUERY = `
  query {
    submissions(limit: 50) {
      id fileName processedAt displayName data
      teams { id name }
    }
  }
`
const CREATE_SUBMISSION_MUTATION = `
  mutation CreateSubmission($input: CreateSubmissionInput!) {
    createSubmission(input: $input) { id processedAt }
  }
`

interface GqlSubmission {
  id: string; fileName: string; processedAt: string
  displayName: string | null; data: Record<string, unknown>
  teams: Array<{ id: string; name: string }>
}

function submissionToHistoryItem(s: GqlSubmission): HistoryItem {
  return {
    id: s.id, fileName: s.fileName, processedAt: s.processedAt,
    facilityName: (s.data?.facilityName as string | undefined) ?? s.displayName ?? null,
    data: s.data, teams: s.teams,
  }
}

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  useEffect(() => {
    gqlFetch<{ submissions: GqlSubmission[] }>(SUBMISSIONS_QUERY)
      .then(({ submissions }) => setHistory(submissions.map(submissionToHistoryItem)))
      .catch(() => {/* DB not configured yet */})
      .finally(() => setHistoryLoading(false))
  }, [])

  async function handleFile(file: File) {
    setLoading(true)
    setError(null)
    try {
      const data = await extractInspection(file)
      const { createSubmission } = await gqlFetch<{ createSubmission: { id: string; processedAt: string } }>(
        CREATE_SUBMISSION_MUTATION,
        { input: { fileName: file.name, displayName: data.facilityName ?? null, formType: 'iswgp', data } },
      )
      router.push(`/forms/${createSubmission.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
      setLoading(false)
    }
  }

  function handleItemTeamsChanged(itemId: string, teams: Array<{ id: string; name: string }>) {
    setHistory(prev => prev.map(h => h.id === itemId ? { ...h, teams } : h))
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>

      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            size="small" edge="start"
            onClick={() => setSidebarOpen(true)}
            sx={{ color: 'text.secondary', mr: 0.5 }}
            aria-label="open history"
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <AssignmentOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: 'text.primary' }}>
              FormVis
            </Typography>
          </Box>

          <Chip label="Beta" size="small" variant="outlined" color="primary" sx={{ borderRadius: 1, fontSize: '0.7rem', height: 22 }} />
          <UserMenu />
        </Toolbar>
      </AppBar>

      <HistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={history}
        onItemTeamsChanged={handleItemTeamsChanged}
      />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, p: 3, overflow: 'auto' }}>
        <UploaderCard onFile={handleFile} loading={loading} error={error} />
        <DashboardPanel history={history} historyLoading={historyLoading} />
      </Box>
    </Box>
  )
}
