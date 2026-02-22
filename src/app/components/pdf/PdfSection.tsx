'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Typography from '@mui/material/Typography'
import PdfViewer from './PdfViewer'
import PdfUploadButton from './PdfUploadButton'

interface Props {
  submissionId: string
  initialPdfUrl: string | null
}

export default function PdfSection({ submissionId, initialPdfUrl }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(initialPdfUrl)

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2 }} />
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Original Form
        </Typography>
        {pdfUrl && (
          <PdfUploadButton submissionId={submissionId} onUploaded={setPdfUrl} />
        )}
      </Box>

      {pdfUrl ? (
        <PdfViewer url={pdfUrl} />
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No original PDF attached.
          </Typography>
          <PdfUploadButton submissionId={submissionId} onUploaded={setPdfUrl} />
        </Box>
      )}
    </Box>
  )
}
