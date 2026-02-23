'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import ZoomInIcon from '@mui/icons-material/ZoomIn'
import CloseIcon from '@mui/icons-material/Close'
import { pdfToImages } from '@/lib/pdfToImages'
import { extractPdfFields } from '@/lib/extractPdfFields'
import type { InspectionFieldHints } from '@/lib/types/inspection'

interface Props {
  file: File
  hints: Partial<InspectionFieldHints>
  onChange: (hints: Partial<InspectionFieldHints>) => void
}

export default function PreReviewStep({ file, hints, onChange }: Props) {
  const [pages, setPages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [zoomOpen, setZoomOpen] = useState(false)

  useEffect(() => {
    let cancelled = false
    setPages([])
    setCurrentPage(0)
    setLoading(true)

    pdfToImages(file, 1.5)
      .then((images) => {
        if (cancelled) return
        setPages(images.map(img => `data:image/jpeg;base64,${img}`))
        setLoading(false)
      })
      .catch(err => {
        console.warn('[PreReviewStep] PDF render failed:', err)
        setLoading(false)
      })

    // Auto-extract AcroForm fields silently for AI hints
    extractPdfFields(file)
      .then(({ hints: extracted, anyPrefilled }) => {
        if (cancelled) return
        const userHasTyped = Object.values(hints).some(v => v?.trim())
        if (!userHasTyped && anyPrefilled) onChange(extracted)
      })
      .catch(() => {})

    return () => { cancelled = true }
  }, [file]) // eslint-disable-line react-hooks/exhaustive-deps

  const pageCount = pages.length
  const currentSrc = pages[currentPage]

  function goPrev() { setCurrentPage(p => Math.max(0, p - 1)) }
  function goNext() { setCurrentPage(p => Math.min(pageCount - 1, p + 1)) }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>

      {/* PDF page preview */}
      <Box sx={{ position: 'relative', width: '100%' }}>
        {loading ? (
          <Box sx={{
            width: '100%', aspectRatio: '8.5 / 11',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'action.hover', borderRadius: 1,
          }}>
            <CircularProgress size={32} />
          </Box>
        ) : currentSrc ? (
          <Box sx={{ position: 'relative' }}>
            <Box
              component="img"
              src={currentSrc}
              alt={`Page ${currentPage + 1}`}
              onClick={() => setZoomOpen(true)}
              sx={{
                width: '100%',
                display: 'block',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: 1,
                cursor: 'zoom-in',
              }}
            />
            <IconButton
              size="small"
              onClick={() => setZoomOpen(true)}
              sx={{
                position: 'absolute', top: 8, right: 8,
                bgcolor: 'rgba(0,0,0,0.45)', color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' },
              }}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            Could not render PDF preview.
          </Typography>
        )}
      </Box>

      {/* Page navigation */}
      {pageCount > 1 && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton size="small" onClick={goPrev} disabled={currentPage === 0}>
            <ChevronLeftIcon />
          </IconButton>
          <Typography variant="body2" color="text.secondary" sx={{ minWidth: 56, textAlign: 'center' }}>
            {currentPage + 1} / {pageCount}
          </Typography>
          <IconButton size="small" onClick={goNext} disabled={currentPage === pageCount - 1}>
            <ChevronRightIcon />
          </IconButton>
        </Box>
      )}

      {/* Zoom dialog */}
      <Dialog
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        maxWidth="xl"
        fullWidth
        scroll="body"
      >
        <Box sx={{ position: 'relative' }}>
          <IconButton
            onClick={() => setZoomOpen(false)}
            sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1, bgcolor: 'rgba(0,0,0,0.45)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.65)' } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>

          {currentSrc && (
            <Box
              component="img"
              src={currentSrc}
              alt={`Page ${currentPage + 1}`}
              sx={{ width: '100%', display: 'block' }}
            />
          )}

          {pageCount > 1 && (
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
              position: 'sticky', bottom: 0,
              bgcolor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              py: 1,
            }}>
              <IconButton onClick={goPrev} disabled={currentPage === 0} sx={{ color: 'white' }}>
                <ChevronLeftIcon />
              </IconButton>
              <Typography variant="body2" sx={{ color: 'white', minWidth: 56, textAlign: 'center' }}>
                {currentPage + 1} / {pageCount}
              </Typography>
              <IconButton onClick={goNext} disabled={currentPage === pageCount - 1} sx={{ color: 'white' }}>
                <ChevronRightIcon />
              </IconButton>
            </Box>
          )}
        </Box>
      </Dialog>

    </Box>
  )
}
