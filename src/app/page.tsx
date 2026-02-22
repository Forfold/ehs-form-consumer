'use client'

import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Paper from '@mui/material/Paper'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import LogoutIcon from '@mui/icons-material/Logout'
import MenuIcon from '@mui/icons-material/Menu'
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { extractInspection } from '@/lib/extractInspection'
import { gqlFetch } from '@/lib/graphql/client'
import PdfUploader from './components/PdfUploader'
import InspectionResults from './components/InspectionResults'
import HistorySidebar, { type HistoryItem } from './components/HistorySidebar'

type OverallStatus = 'compliant' | 'non-compliant' | 'needs-attention'

interface InspectionData {
  facilityName: string
  permitNumber: string
  inspectionDate: string
  inspectorName: string
  overallStatus: OverallStatus
  bmpItems: Array<{ description: string; status: 'pass' | 'fail' | 'na'; notes: string }>
  correctiveActions: Array<{ description: string; dueDate: string; completed: boolean }>
  summary: string
  deadletter?: Record<string, unknown>
}

const EXTRACTED_FIELDS = [
  'Facility & permit details',
  'BMP inspection results',
  'Corrective actions & due dates',
]

const SUBMISSIONS_QUERY = `
  query {
    submissions(limit: 50) {
      id
      fileName
      processedAt
      displayName
      data
      teams {
        id
        name
      }
    }
  }
`

const CREATE_SUBMISSION_MUTATION = `
  mutation CreateSubmission($input: CreateSubmissionInput!) {
    createSubmission(input: $input) {
      id
      processedAt
    }
  }
`

interface GqlSubmission {
  id: string
  fileName: string
  processedAt: string
  displayName: string | null
  data: Record<string, unknown>
  teams: Array<{ id: string; name: string }>
}

function submissionToHistoryItem(s: GqlSubmission): HistoryItem {
  return {
    id: s.id,
    fileName: s.fileName,
    processedAt: s.processedAt,
    facilityName: (s.data?.facilityName as string | undefined) ?? s.displayName ?? null,
    data: s.data,
    teams: s.teams,
  }
}

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InspectionData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState<HistoryItem[]>([])

  useEffect(() => {
    gqlFetch<{ submissions: GqlSubmission[] }>(SUBMISSIONS_QUERY)
      .then(({ submissions }) => setHistory(submissions.map(submissionToHistoryItem)))
      .catch(() => {/* DB not configured yet */})
  }, [])

  async function handleFile(file: File) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await extractInspection(file)
      setResult(data)

      const { createSubmission } = await gqlFetch<{ createSubmission: { id: string; processedAt: string } }>(
        CREATE_SUBMISSION_MUTATION,
        {
          input: {
            fileName: file.name,
            displayName: data.facilityName ?? null,
            formType: 'iswgp',
            data: data,
          },
        },
      )

      const newItem: HistoryItem = {
        id: createSubmission.id,
        fileName: file.name,
        processedAt: createSubmission.processedAt,
        facilityName: data.facilityName ?? null,
        data: data as Record<string, unknown>,
      }
      setHistory(prev => [newItem, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }

  function handleSelectHistory(item: HistoryItem) {
    setResult(item.data as unknown as InspectionData)
  }

  function handleItemTeamsChanged(itemId: string, teams: Array<{ id: string; name: string }>) {
    setHistory((prev) => prev.map((h) => h.id === itemId ? { ...h, teams } : h))
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>

      {/* App bar */}
      <AppBar position="static">
        <Toolbar sx={{ gap: 1 }}>
          <IconButton
            size="small"
            edge="start"
            onClick={() => setSidebarOpen(true)}
            sx={{ color: 'text.secondary', mr: 0.5 }}
            aria-label="open history"
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          <Box
            onClick={() => setResult(null)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexGrow: 1,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <AssignmentOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: 'text.primary' }}
            >
              EHS Inspector
            </Typography>
          </Box>

          <Chip
            label="Beta"
            size="small"
            variant="outlined"
            color="primary"
            sx={{ borderRadius: 1, fontSize: '0.7rem', height: 22 }}
          />

          <IconButton
            size="small"
            component={Link}
            href="/settings"
            sx={{ color: 'text.secondary' }}
            aria-label="settings"
          >
            <SettingsOutlinedIcon fontSize="small" />
          </IconButton>

          <IconButton
            size="small"
            onClick={() => signOut()}
            sx={{ color: 'text.secondary' }}
            aria-label="sign out"
          >
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Toolbar>
      </AppBar>

      <HistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={history}
        onSelect={handleSelectHistory}
        onItemTeamsChanged={handleItemTeamsChanged}
      />

      {/* Content */}
      {result ? (
        <Container maxWidth="md" sx={{ py: 4, flex: 1 }}>
          <InspectionResults data={result} onReset={() => setResult(null)} />
        </Container>
      ) : (
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 3,
          }}
        >
          <Paper
            variant="outlined"
            sx={{ width: '100%', maxWidth: 480, p: { xs: 3, sm: 4 }, borderRadius: 3 }}
          >
            {/* Card header */}
            <Typography variant="h6" gutterBottom>
              Monthly Inspection Form
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Upload your ISWGP PDF and extract structured data in seconds.
            </Typography>

            <PdfUploader onFile={handleFile} loading={loading} />

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Divider sx={{ my: 3 }} />

            {/* What gets extracted */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
              {EXTRACTED_FIELDS.map(field => (
                <Box key={field} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                  <Typography variant="caption" color="text.secondary">
                    {field}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      )}
    </Box>
  )
}
