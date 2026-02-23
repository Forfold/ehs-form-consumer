'use client'

import { useEffect, useState } from 'react'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Step from '@mui/material/Step'
import StepLabel from '@mui/material/StepLabel'
import Stepper from '@mui/material/Stepper'
import Typography from '@mui/material/Typography'
import { extractInspection } from '@/lib/extractInspection'
import { uploadPdf } from '@/lib/uploadPdf'
import { gqlFetch } from '@/lib/graphql/client'
import type { InspectionData, InspectionFieldHints } from '@/lib/types/inspection'
import PostReviewStep from './PostReviewStep'

const CREATE_SUBMISSION_MUTATION = `
  mutation CreateSubmission($input: CreateSubmissionInput!) {
    createSubmission(input: $input) { id processedAt }
  }
`

type FlowStep = 'pre-review' | 'processing' | 'post-review'
const STEP_LABELS = ['Review Fields', 'Processing', 'Review Results']
const STEP_INDEX: Record<FlowStep, number> = { 'pre-review': 0, 'processing': 1, 'post-review': 2 }

const EMPTY_DATA: InspectionData = {
  facilityName: '', permitNumber: '', inspectionDate: '', inspectorName: '',
  overallStatus: 'compliant', checklistItems: [], correctiveActions: [], summary: '',
}

interface Props {
  open: boolean
  file: File | null
  onClose: () => void
  onSaved: (submissionId: string) => void
}

export default function UploadFlowDialog({ open, file, onClose, onSaved }: Props) {
  const [step, setStep] = useState<FlowStep>('pre-review')
  const [fieldHints, setFieldHints] = useState<Partial<InspectionFieldHints>>({})
  const [editedData, setEditedData] = useState<InspectionData>(EMPTY_DATA)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Reset when dialog opens with a new file
  useEffect(() => {
    if (open) {
      setStep('pre-review')
      setFieldHints({})
      setEditedData(EMPTY_DATA)
      setError(null)
      setSaving(false)
    }
  }, [open])

  // Auto-run extraction when step enters 'processing'
  useEffect(() => {
    if (step !== 'processing' || !file) return
    let cancelled = false
    setError(null)

    extractInspection(file, fieldHints)
      .then((data: InspectionData) => {
        if (cancelled) return
        setEditedData(data)
        setStep('post-review')
      })
      .catch((err: unknown) => {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Extraction failed')
        setStep('pre-review')
      })

    return () => { cancelled = true }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave() {
    if (!file) return
    setSaving(true)
    setError(null)
    try {
      const pdfStorageKey = await uploadPdf(file).catch(() => null)
      const { createSubmission } = await gqlFetch<{ createSubmission: { id: string } }>(
        CREATE_SUBMISSION_MUTATION,
        {
          input: {
            fileName: file.name,
            displayName: editedData.facilityName || null,
            formType: 'iswgp',
            pdfStorageKey,
            data: editedData,
          },
        },
      )
      onSaved(createSubmission.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={step === 'processing' ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Review Form Submission</Typography>
        {file && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{file.name}</Typography>
        )}
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Stepper activeStep={STEP_INDEX[step]} alternativeLabel>
          {STEP_LABELS.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent dividers sx={{ minHeight: 300 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {step === 'pre-review' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 2 }}>
            <Typography variant="body1">
              Ready to analyze <strong>{file?.name}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', maxWidth: 420 }}>
              Field hints let you pre-fill known values so the AI focuses on checkbox detection.
              You&apos;ll be able to review and edit all extracted data before saving.
            </Typography>
          </Box>
        )}

        {step === 'processing' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 200, gap: 2 }}>
            <CircularProgress />
            <Typography variant="body2" color="text.secondary">Analyzing PDF…</Typography>
          </Box>
        )}

        {step === 'post-review' && (
          <PostReviewStep data={editedData} onChange={setEditedData} />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === 'pre-review' && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={() => setStep('processing')}>
              Process PDF
            </Button>
          </>
        )}
        {step === 'processing' && (
          <Button disabled>Processing…</Button>
        )}
        {step === 'post-review' && (
          <>
            <Button onClick={() => setStep('pre-review')} disabled={saving}>Back</Button>
            <Box sx={{ flex: 1 }} />
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving}
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            >
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
