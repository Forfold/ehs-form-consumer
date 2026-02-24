'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import { gqlFetch } from '@/lib/graphql/client'
import { submissionToHistoryItem } from './submissionUtils'
import { type HistoryItem } from './components/history/HistorySidebar'
import UserMenu from './components/main/UserMenu'
import UploaderCard from './components/dashboard/UploaderCard'
import DashboardPanel from './components/dashboard/DashboardPanel'
import UploadFlowDialog from './components/upload/UploadFlowDialog'

const SUBMISSIONS_QUERY = `
  query {
    submissions(limit: 50) {
      id processedAt displayName data
      teams { id name }
    }
  }
`

interface GqlSubmission {
  id: string
  processedAt: string
  displayName: string | null
  data: Record<string, unknown>
  teams: Array<{ id: string; name: string }>
}


export default function Home() {
  const router = useRouter()
  const [dialogFile, setDialogFile] = useState<File | null>(null)
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)

  function loadHistory() {
    gqlFetch<{ submissions: GqlSubmission[] }>(SUBMISSIONS_QUERY)
      .then(({ submissions }) => setHistory(submissions.map(submissionToHistoryItem)))
      .catch(() => {
        /* DB not configured yet */
      })
      .finally(() => setHistoryLoading(false))
  }

  useEffect(() => {
    loadHistory()
  }, [])

  function handleSaved(submissionId: string) {
    setDialogFile(null)
    loadHistory()
    router.push(`/forms/${submissionId}`)
  }

  function handleItemTeamsChanged(
    itemId: string,
    teams: Array<{ id: string; name: string }>,
  ) {
    setHistory((prev) => prev.map((h) => (h.id === itemId ? { ...h, teams } : h)))
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.default',
      }}
    >
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexGrow: 1 }}>
            <AssignmentOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
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

          <Chip
            label="Beta"
            size="small"
            variant="outlined"
            color="primary"
            sx={{ borderRadius: 1, fontSize: '0.7rem', height: 22 }}
          />
          <UserMenu />
        </Toolbar>
      </AppBar>

      <Box
        sx={{
          flex: 1,
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 3,
          p: 3,
          overflow: 'auto',
        }}
      >
        <UploaderCard onFile={setDialogFile} />
        <DashboardPanel
          history={history}
          historyLoading={historyLoading}
          onItemTeamsChanged={handleItemTeamsChanged}
        />
      </Box>

      <UploadFlowDialog
        open={!!dialogFile}
        file={dialogFile}
        onClose={() => setDialogFile(null)}
        onSaved={handleSaved}
      />
    </Box>
  )
}
