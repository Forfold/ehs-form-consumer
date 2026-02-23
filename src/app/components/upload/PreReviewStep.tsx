'use client'

import { useEffect, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { pdfToImages } from '@/lib/pdfToImages'
import { extractPdfFields } from '@/lib/extractPdfFields'
import type { InspectionFieldHints } from '@/lib/types/inspection'

interface Props {
  file: File
  hints: Partial<InspectionFieldHints>
  onChange: (hints: Partial<InspectionFieldHints>) => void
}

export default function PreReviewStep({ file, hints, onChange }: Props) {
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const [acroFormStatus, setAcroFormStatus] = useState<'loading' | 'found' | 'prefilled' | 'none'>('loading')

  useEffect(() => {
    let cancelled = false

    // Render page 1 at low scale for the PDF thumbnail
    pdfToImages(file, 0.4)
      .then(([firstPage]) => {
        if (!cancelled && firstPage) setThumbnail(`data:image/jpeg;base64,${firstPage}`)
      })
      .catch(err => console.warn('[PreReviewStep] thumbnail failed:', err))

    // Try to extract AcroForm text fields and pre-populate hints
    extractPdfFields(file)
      .then(({ hints: extracted, hasAcroForm, anyPrefilled }) => {
        if (cancelled) return
        if (!hasAcroForm) {
          setAcroFormStatus('none')
          return
        }
        // Only auto-fill if the user hasn't already typed anything
        const userHasTyped = Object.values(hints).some(v => v?.trim())
        if (!userHasTyped && anyPrefilled) {
          onChange(extracted)
          setAcroFormStatus('prefilled')
        } else {
          setAcroFormStatus('found')
        }
      })
      .catch(err => {
        console.warn('[PreReviewStep] field extraction failed:', err)
        setAcroFormStatus('none')
      })

    return () => { cancelled = true }
  }, [file]) // eslint-disable-line react-hooks/exhaustive-deps

  function setHint(key: keyof InspectionFieldHints, value: string) {
    onChange({ ...hints, [key]: value || undefined })
  }

  const statusNote =
    acroFormStatus === 'loading'   ? 'Reading form fields…' :
    acroFormStatus === 'prefilled' ? 'Fields pre-filled from PDF — review and correct as needed.' :
    acroFormStatus === 'found'     ? 'AcroForm fields found in PDF.' :
    'No fillable fields detected — enter hints manually or leave blank.'

  return (
    <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>

      {/* PDF thumbnail */}
      <Box sx={{ width: 200, flexShrink: 0 }}>
        {thumbnail ? (
          <Box
            component="img"
            src={thumbnail}
            alt="PDF preview"
            sx={{ width: '100%', borderRadius: 1, border: '1px solid', borderColor: 'divider', boxShadow: 1 }}
          />
        ) : (
          <Box sx={{
            width: '100%', aspectRatio: '8.5 / 11',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            bgcolor: 'action.hover', borderRadius: 1,
          }}>
            <CircularProgress size={24} />
          </Box>
        )}
      </Box>

      {/* Hints form */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>Field Hints</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {statusNote}
          </Typography>
        </Box>

        <TextField
          label="Facility Name"
          size="small"
          value={hints.facilityName ?? ''}
          onChange={e => setHint('facilityName', e.target.value)}
        />
        <TextField
          label="Permit Number"
          size="small"
          value={hints.permitNumber ?? ''}
          onChange={e => setHint('permitNumber', e.target.value)}
        />
        <TextField
          label="Inspection Date"
          size="small"
          value={hints.inspectionDate ?? ''}
          onChange={e => setHint('inspectionDate', e.target.value)}
        />
        <TextField
          label="Inspector"
          size="small"
          value={hints.inspectorName ?? ''}
          onChange={e => setHint('inspectorName', e.target.value)}
        />
        <TextField
          label="Weather Conditions"
          size="small"
          value={hints.weatherConditions ?? ''}
          onChange={e => setHint('weatherConditions', e.target.value)}
        />
      </Box>

    </Box>
  )
}
