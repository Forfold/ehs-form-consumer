'use client'

import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import { DropZone } from './DropZone'

interface Props {
  onFile: (file: File) => void
  loading: boolean
}

export default function PdfUploader({ onFile, loading }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <DropZone onFileSelected={setSelectedFile} loading={loading} />

      {/* Submit */}
      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={!selectedFile || loading}
        onClick={() => selectedFile && onFile(selectedFile)}
        startIcon={loading ? <CircularProgress size={16} color="inherit" /> : undefined}
      >
        {loading ? 'Extracting…' : 'Extract Form Data'}
      </Button>
    </Box>
  )
}
