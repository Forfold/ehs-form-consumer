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
import StepButton from '@mui/material/StepButton'
import Stepper from '@mui/material/Stepper'
import Typography from '@mui/material/Typography'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import { extractInspection } from '@/lib/extractInspection'
import { uploadPdf } from '@/lib/uploadPdf'
import { gqlFetch } from '@/lib/graphql/client'
import type { InspectionData, InspectionFieldHints } from '@/lib/types/inspection'
import PostReviewStep from './PostReviewStep'
import PreReviewStep from './PreReviewStep'

const CREATE_SUBMISSION_MUTATION = `
  mutation CreateSubmission($input: CreateSubmissionInput!) {
    createSubmission(input: $input) { id processedAt }
  }
`

type FlowStep = 'pre-review' | 'processing' | 'post-review'
const STEP_LABELS = ['Preview PDF', 'Processing', 'Review Results']
const STEP_INDEX: Record<FlowStep, number> = { 'pre-review': 0, 'processing': 1, 'post-review': 2 }
const INDEX_TO_STEP: FlowStep[] = ['pre-review', 'processing', 'post-review']

const EMPTY_DATA: InspectionData = {
  facilityName: '', permitNumber: '', inspectionDate: '', inspectorName: '',
  overallStatus: 'compliant', checklistItems: [], correctiveActions: [], summary: '',
}

// All transient flow state in one object so a single setFlow() resets everything.
type FlowState = {
  step: FlowStep
  fieldHints: Partial<InspectionFieldHints>
  editedData: InspectionData
  processed: boolean
  error: string | null
  saving: boolean
}

const INITIAL_FLOW: FlowState = {
  step: 'pre-review',
  fieldHints: {},
  editedData: EMPTY_DATA,
  processed: false,
  error: null,
  saving: false,
}

interface Props {
  open: boolean
  file: File | null
  onClose: () => void
  onSaved: (submissionId: string) => void
}

export default function UploadFlowDialog({ open, file, onClose, onSaved }: Props) {
  const [flow, setFlow] = useState<FlowState>(INITIAL_FLOW)
  // Track previous `open` so we can reset at render time when the dialog (re-)opens,
  // avoiding synchronous setState inside an effect.
  const [prevOpen, setPrevOpen] = useState(open)

  if (open && !prevOpen) {
    setPrevOpen(true)
    setFlow(INITIAL_FLOW)
  } else if (!open && prevOpen) {
    setPrevOpen(false)
  }

  const { step, fieldHints, editedData, processed, error, saving } = flow

  // Stable functional patcher — safe to call from inside effect closures because
  // it uses the `prev =>` updater form of setFlow.
  function patch(update: Partial<FlowState>) {
    setFlow(prev => ({ ...prev, ...update }))
  }

  // Auto-run extraction when step enters 'processing' — skipped if already processed.
  // No synchronous setState here; all updates happen in async callbacks.
  useEffect(() => {
    if (step !== 'processing' || !file || processed) return
    let cancelled = false

    extractInspection(file, fieldHints)
      .then((data: InspectionData) => {
        if (cancelled) return
        patch({ editedData: data, processed: true, step: 'post-review', error: null })
      })
      .catch((err: unknown) => {
        if (cancelled) return
        patch({
          error: err instanceof Error ? err.message : 'Extraction failed',
          step: 'pre-review',
        })
      })

    return () => { cancelled = true }
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  function navigateToStep(index: number) {
    if (step === 'processing' && !processed) return
    patch({ step: INDEX_TO_STEP[index] })
  }

  function isStepEnabled(index: number): boolean {
    if (step === 'processing' && !processed) return false
    if (index === 0) return true
    return processed
  }

  // Processing step (index 1) is permanently marked complete once processed.
  // Other steps are complete when we've moved past them.
  function isStepCompleted(index: number): boolean {
    if (!processed) return false
    if (index === 1) return true
    return index < STEP_INDEX[step]
  }

  async function handleSave() {
    if (!file) return
    patch({ saving: true, error: null })
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
      patch({
        error: err instanceof Error ? err.message : 'Save failed',
        saving: false,
      })
    }
  }

  const isActivelyProcessing = step === 'processing' && !processed

  return (
    <Dialog open={open} onClose={isActivelyProcessing ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle component="div" sx={{ pb: 1 }}>
        <Typography variant="h6" fontWeight={700}>Review Form Submission</Typography>
        {file && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{file.name}</Typography>
        )}
      </DialogTitle>

      <Box sx={{ px: 3, pb: 1 }}>
        <Stepper activeStep={STEP_INDEX[step]} alternativeLabel nonLinear>
          {STEP_LABELS.map((label, index) => (
            <Step key={label} completed={isStepCompleted(index)}>
              <StepButton onClick={() => navigateToStep(index)} disabled={!isStepEnabled(index)}>
                {label}
              </StepButton>
            </Step>
          ))}
        </Stepper>
      </Box>

      <DialogContent dividers sx={{ minHeight: 300 }}>
        {/* Hide stale errors while actively processing */}
        {error && !isActivelyProcessing && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {step === 'pre-review' && file && (
          <PreReviewStep
            file={file}
            hints={fieldHints}
            onChange={(hints) => patch({ fieldHints: hints })}
          />
        )}

        {step === 'processing' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 2 }}>
            {/* <Box
              component="img"
              src="/visua_mascot.png"
              alt="FormVis mascot"
              sx={{ width: 110, height: 110, objectFit: 'contain' }}
            /> */}
            {processed ? (
              <>
                <CheckCircleIcon sx={{ color: 'success.main', fontSize: 36 }} />
                <Typography variant="body1" fontWeight={600} color="success.main">
                  Successfully processed!
                </Typography>
              </>
            ) : (
              <>
                <CircularProgress size={32} />
                <Typography variant="body2" color="text.secondary">Analyzing PDF…</Typography>
              </>
            )}
          </Box>
        )}

        {step === 'post-review' && (
          <PostReviewStep data={editedData} onChange={(data) => patch({ editedData: data })} />
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        {step === 'pre-review' && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            {processed ? (
              <Button variant="contained" onClick={() => patch({ step: 'post-review' })}>
                Back to Results
              </Button>
            ) : (
              <Button variant="contained" onClick={() => patch({ step: 'processing' })}>
                Process PDF
              </Button>
            )}
          </>
        )}
        {step === 'processing' && !processed && (
          <Button disabled>Processing…</Button>
        )}
        {step === 'processing' && processed && (
          <>
            <Button onClick={onClose}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={() => patch({ step: 'post-review' })}>
              Review Results
            </Button>
          </>
        )}
        {step === 'post-review' && (
          <>
            <Button onClick={() => patch({ step: 'pre-review' })} disabled={saving}>Back</Button>
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
