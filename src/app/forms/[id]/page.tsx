'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Alert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Breadcrumbs from '@mui/material/Breadcrumbs'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Container from '@mui/material/Container'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline'
import MenuIcon from '@mui/icons-material/Menu'
import Link from 'next/link'
import { gqlFetch } from '@/lib/graphql/client'
import InspectionResults from '@/app/components/form_submission/InspectionResults'
import type { InspectionData } from '@/lib/types/inspection'
import HistorySidebar from '@/app/components/history/HistorySidebar'
import PdfSection from '@/app/components/pdf/PdfSection'
import UserMenu from '@/app/components/main/UserMenu'
import DeleteFormButton from './DeleteFormButton'

const STATUS_CONFIG = {
  compliant:         { label: 'Compliant',       severity: 'success' as const },
  'non-compliant':   { label: 'Non-Compliant',   severity: 'error'   as const },
  'needs-attention': { label: 'Needs Attention', severity: 'warning' as const },
}

interface GqlSubmission {
  id: string
  fileName: string
  processedAt: string
  displayName: string | null
  pdfStorageKey: string | null
  data: Record<string, unknown>
  teams: Array<{ id: string; name: string }>
}

const SUBMISSION_QUERY = `
  query GetSubmission($id: ID!) {
    submission(id: $id) {
      id fileName processedAt displayName pdfStorageKey data
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

function breadcrumbTitle(submission: GqlSubmission | null, loading: boolean): string {
  if (loading) return '…'
  if (!submission) return '—'
  const data = submission.data as Partial<InspectionData>
  const parts = [data.permitNumber, data.inspectionDate].filter(Boolean)
  if (parts.length > 0) return parts.join(' · ')
  return (data.facilityName ?? submission.displayName ?? submission.fileName ?? '—')
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
  const [ncModalOpen, setNcModalOpen] = useState(false)

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

  // Derived banner data
  const inspectionData = submission?.data as Partial<InspectionData> | undefined
  const overallStatus = inspectionData?.overallStatus
  const statusConfig = overallStatus ? STATUS_CONFIG[overallStatus] : null
  const bmpItems = inspectionData?.bmpItems ?? []
  const passCount = bmpItems.filter(i => i.status === 'pass').length
  const failCount = bmpItems.filter(i => i.status === 'fail').length
  const failedItems = bmpItems.filter(i => i.status === 'fail')
  const deadletterCount = inspectionData?.deadletter ? Object.keys(inspectionData.deadletter).length : 0
  const isBlankForm =
    !inspectionData?.facilityName &&
    !inspectionData?.permitNumber &&
    !inspectionData?.inspectionDate &&
    (bmpItems.length === 0 || bmpItems.every(i => i.status === 'na'))
  const isNonCompliantClickable = overallStatus === 'non-compliant' && failedItems.length > 0

  const displayName = submission
    ? ((submission.data?.facilityName as string | undefined) ?? submission.displayName)
    : null

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
              {breadcrumbTitle(submission, loading)}
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
        <Container maxWidth="xl" sx={{ py: 4, flex: 1 }}>

          {/* Full-width banners */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
            {isBlankForm && (
              <Alert severity="info">
                This appears to be an unfilled form template. Upload a completed inspection form to see extracted results.
              </Alert>
            )}
            {statusConfig && (
              <Box
                onClick={isNonCompliantClickable ? () => setNcModalOpen(true) : undefined}
                sx={isNonCompliantClickable ? { cursor: 'pointer' } : undefined}
              >
                <Alert
                  severity={statusConfig.severity}
                  sx={{ alignItems: 'center', pointerEvents: 'none' }}
                  action={
                    bmpItems.length > 0 ? (
                      <Typography variant="body2" sx={{ whiteSpace: 'nowrap', opacity: 0.85, pr: 1 }}>
                        {passCount} pass &middot; {failCount} fail &middot; {bmpItems.length} items
                        {isNonCompliantClickable && (
                          <Box component="span" sx={{ ml: 1, opacity: 0.7, fontSize: '0.75rem' }}>· tap to view</Box>
                        )}
                      </Typography>
                    ) : undefined
                  }
                >
                  <Typography fontWeight={700}>{statusConfig.label}</Typography>
                </Alert>
              </Box>
            )}
            {deadletterCount > 0 && (
              <Alert
                severity="warning"
                action={
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => document.getElementById('deadletter-section')?.scrollIntoView({ behavior: 'smooth' })}
                  >
                    View
                  </Button>
                }
              >
                {deadletterCount} field{deadletterCount !== 1 ? 's' : ''} could not be processed — review below.
              </Alert>
            )}
          </Box>

          {/* Two-column grid: results left, PDF right */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 520px' },
              gap: 4,
              alignItems: 'start',
            }}
          >
            {/* Left: results + action buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
              <InspectionResults
                data={submission.data as unknown as InspectionData}
              />
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Button variant="outlined" onClick={() => router.push('/')}>
                  Process another form
                </Button>
                <DeleteFormButton
                  submissionId={submission.id}
                  displayName={displayName}
                />
              </Box>
            </Box>

            {/* Right: PDF (sticky on large screens) */}
            <Box sx={{ position: { lg: 'sticky' }, top: { lg: 16 } }}>
              <PdfSection
                submissionId={submission.id}
                initialPdfUrl={submission.pdfStorageKey}
              />
            </Box>
          </Box>

          {/* Non-compliant items modal */}
          <Dialog open={ncModalOpen} onClose={() => setNcModalOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Non-Compliant Items</DialogTitle>
            <DialogContent>
              <List disablePadding>
                {failedItems.map((item, i) => (
                  <Box key={i}>
                    {i > 0 && <Divider component="li" />}
                    <ListItem disableGutters sx={{ py: 1 }}>
                      <ListItemIcon sx={{ minWidth: 36 }}>
                        <ErrorOutlineIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.description}
                        secondary={item.notes || undefined}
                        slotProps={{
                          primary: { variant: 'body2', fontWeight: 500 } as object,
                          secondary: { variant: 'caption' } as object,
                        }}
                      />
                    </ListItem>
                  </Box>
                ))}
              </List>
            </DialogContent>
          </Dialog>

        </Container>
      )}
    </Box>
  )
}
