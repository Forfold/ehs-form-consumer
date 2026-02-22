'use client'

import { useState } from 'react'
import Alert from '@mui/material/Alert'
import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Container from '@mui/material/Container'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import { extractInspection } from '@/lib/extractInspection'
import PdfUploader from './components/PdfUploader'
import InspectionResults from './components/InspectionResults'

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

export default function Home() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<InspectionData | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const data = await extractInspection(file)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Extraction failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'background.default' }}>

      {/* App bar */}
      <AppBar position="static">
        <Toolbar sx={{ gap: 1.5 }}>
          <AssignmentOutlinedIcon sx={{ color: 'primary.main', fontSize: 22 }} />
          <Typography
            variant="subtitle1"
            sx={{ flexGrow: 1, fontWeight: 700, letterSpacing: '-0.01em', color: 'text.primary' }}
          >
            EHS Inspector
          </Typography>
          <Chip
            label="Beta"
            size="small"
            variant="outlined"
            color="primary"
            sx={{ borderRadius: 1, fontSize: '0.7rem', height: 22 }}
          />
        </Toolbar>
      </AppBar>

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
