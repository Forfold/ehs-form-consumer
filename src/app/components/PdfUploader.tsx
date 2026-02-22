'use client'

import { useCallback, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'

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
      {/* Drop zone */}
      <Box
        onClick={() => !loading && inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); if (!loading) setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        sx={{
          border: '1.5px dashed',
          borderColor: selectedFile ? 'success.main' : dragging ? 'primary.main' : 'divider',
          borderRadius: 2,
          py: 5,
          px: 3,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 0.75,
          cursor: loading ? 'default' : 'pointer',
          bgcolor: selectedFile ? 'success.50' : dragging ? 'primary.50' : 'action.hover',
          transition: 'border-color 0.15s, background-color 0.15s',
          pointerEvents: loading ? 'none' : undefined,
          opacity: loading ? 0.6 : 1,
          '&:hover': {
            borderColor: selectedFile ? 'success.main' : 'primary.main',
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
          <InsertDriveFileOutlinedIcon sx={{ fontSize: 36, color: 'success.main' }} />
        ) : (
          <CloudUploadIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
        )}

        {selectedFile ? (
          <>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              {selectedFile.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Click to swap file
            </Typography>
          </>
        ) : (
          <>
            <Typography variant="body2" fontWeight={500} color="text.primary">
              Drop PDF here or click to browse
            </Typography>
            <Typography variant="caption" color="text.disabled">
              .pdf only
            </Typography>
          </>
        )}
      </Box>

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
