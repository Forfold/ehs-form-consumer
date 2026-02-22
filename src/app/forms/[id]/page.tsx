'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import IconButton from '@mui/material/IconButton'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import MenuIcon from '@mui/icons-material/Menu'
import Link from 'next/link'
import { gqlFetch } from '@/lib/graphql/client'
import InspectionResults from '@/app/components/InspectionResults'
import HistorySidebar from '@/app/components/HistorySidebar'
import UserMenu from '@/app/components/UserMenu'

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

interface GqlSubmission {
  id: string
  fileName: string
  processedAt: string
  displayName: string | null
  data: Record<string, unknown>
  teams: Array<{ id: string; name: string }>
}

const SUBMISSION_QUERY = `
  query GetSubmission($id: ID!) {
    submission(id: $id) {
      id fileName processedAt displayName data
      teams { id name }
    }
  }
`

const SUBMISSIONS_QUERY = `
  query {
    submissions(limit: 50) {
      id fileName processedAt displayName data
      teams { id name }
    }
  }
`

function submissionToHistoryItem(s: GqlSubmission) {
  return {
    id: s.id,
    fileName: s.fileName,
    processedAt: s.processedAt,
    facilityName: (s.data?.facilityName as string | undefined) ?? s.displayName ?? null,
    data: s.data,
    teams: s.teams,
  }
}

export default function FormDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [submission, setSubmission] = useState<GqlSubmission | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [history, setHistory] = useState<ReturnType<typeof submissionToHistoryItem>[]>([])

  useEffect(() => {
    gqlFetch<{ submission: GqlSubmission | null }>(SUBMISSION_QUERY, { id })
      .then(({ submission }) => {
        if (!submission) setNotFound(true)
        else setSubmission(submission)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    gqlFetch<{ submissions: GqlSubmission[] }>(SUBMISSIONS_QUERY)
      .then(({ submissions }) => setHistory(submissions.map(submissionToHistoryItem)))
      .catch(() => {/* DB not configured yet */})
  }, [])

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

          <Breadcrumbs
            sx={{ flexGrow: 1, '& .MuiBreadcrumbs-separator': { color: 'text.disabled' } }}
          >
            <Box
              component={Link}
              href="/"
              sx={{ display: 'flex', alignItems: 'center', gap: 0.75, textDecoration: 'none', '&:hover': { opacity: 0.8 } }}
            >
              <AssignmentOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: '-0.01em', color: 'text.primary' }}>
                FormVis
              </Typography>
            </Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 500, color: loading ? 'text.disabled' : 'text.primary', letterSpacing: '-0.01em' }}
            >
              {loading
                ? '…'
                : (submission?.data?.facilityName as string | undefined)
                  ?? submission?.displayName
                  ?? submission?.fileName
                  ?? '—'}
            </Typography>
          </Breadcrumbs>

          <Chip label="Beta" size="small" variant="outlined" color="primary" sx={{ borderRadius: 1, fontSize: '0.7rem', height: 22 }} />
          <UserMenu />
        </Toolbar>
      </AppBar>

      <HistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={history}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <CircularProgress />
        </Box>
      ) : notFound || !submission ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
          <Typography color="text.secondary">Form not found.</Typography>
        </Box>
      ) : (
        <Container maxWidth="md" sx={{ py: 4, flex: 1 }}>
          <InspectionResults
            data={submission.data as unknown as InspectionData}
            onReset={() => router.push('/')}
          />
        </Container>
      )}
    </Box>
  )
}
