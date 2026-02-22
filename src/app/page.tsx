'use client'

import { useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
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
    <Container maxWidth="md" sx={{ py: 6 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          EHS Form Extractor
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload an industrial stormwater inspection PDF to extract and visualize form data.
        </Typography>
      </Box>

      {!result && <PdfUploader onFile={handleFile} loading={loading} />}

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      )}

      {result && (
        <InspectionResults data={result} onReset={() => setResult(null)} />
      )}
    </Container>
  )
}
