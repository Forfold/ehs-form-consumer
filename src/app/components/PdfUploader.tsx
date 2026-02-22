'use client'

import { useCallback, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile'

interface Props {
  onFile: (file: File) => void
  loading: boolean
}

export default function PdfUploader({ onFile, loading }: Props) {
  const [dragging, setDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file?.type === 'application/pdf') setSelectedFile(file)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setSelectedFile(file)
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        sx={{
          border: '2px dashed',
          borderColor: selectedFile ? 'success.main' : dragging ? 'primary.main' : 'grey.300',
          borderRadius: 2,
          py: 7,
          px: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
          cursor: 'pointer',
          bgcolor: selectedFile ? 'success.50' : dragging ? 'primary.50' : 'background.paper',
          transition: 'border-color 0.2s, background-color 0.2s',
          '&:hover': {
            borderColor: selectedFile ? 'success.dark' : 'primary.main',
            bgcolor: 'action.hover',
          },
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          hidden
          onChange={handleChange}
        />

        {selectedFile ? (
          <InsertDriveFileIcon sx={{ fontSize: 48, color: 'success.main' }} />
        ) : (
          <CloudUploadIcon sx={{ fontSize: 48, color: 'text.disabled' }} />
        )}

        {selectedFile ? (
          <>
            <Typography variant="body1" fontWeight={600}>{selectedFile.name}</Typography>
            <Typography variant="body2" color="text.secondary">Click to choose a different file</Typography>
          </>
        ) : (
          <>
            <Typography variant="body1" fontWeight={500}>Drop your PDF here</Typography>
            <Typography variant="body2" color="text.secondary">or click to browse</Typography>
          </>
        )}
      </Box>

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={!selectedFile || loading}
        onClick={() => selectedFile && onFile(selectedFile)}
        startIcon={loading ? <CircularProgress size={18} color="inherit" /> : undefined}
        sx={{ py: 1.5 }}
      >
        {loading ? 'Extracting…' : 'Extract Form Data'}
      </Button>
    </Box>
  )
}
