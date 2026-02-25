import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import DashboardCard from './DashboardCard'
import FlaggedItemsModal from './FlaggedItemsModal'
import type { FlaggedForm } from './types'

interface Props {
  percent: number
  formCount: number
  windowLabel: string
  flaggedForms: FlaggedForm[]
  onSelectForm: (submissionId: string) => void
  loading?: boolean
}

export default function ComplianceStatusCard({
  percent,
  formCount,
  windowLabel,
  flaggedForms,
  onSelectForm,
  loading,
}: Props) {
  const theme = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const passing = percent === 100
  const color = passing ? theme.palette.success.main : theme.palette.error.main

  return (
    <DashboardCard
      title="Compliance Status"
      subtitle={
        loading
          ? windowLabel
          : `${windowLabel} · ${formCount} form${formCount !== 1 ? 's' : ''}`
      }
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5 }}>
          <CircularProgress size={32} />
        </Box>
      ) : formCount === 0 ? (
        <Box sx={{ py: 0.5 }}>
          <Typography variant="body2" color="text.secondary">
            No forms submitted yet.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5}}>
          <Typography variant="h2" fontWeight={700} sx={{ color, lineHeight: 1 }}>
            {percent}%
          </Typography>
          <Chip
            label={passing ? 'Within Compliance' : 'Non-Compliant'}
            size="small"
            color={passing ? 'success' : 'error'}
          />
        </Box>
      )}

        {flaggedForms.length > 1 && (
            <Button
              size="small"
              variant="contained"
              color="error"
              onClick={() => setModalOpen(true)}
              sx={{ position: 'absolute', right: 18, top: 18, height: '75%', width: '100px', fontSize: '1rem', display: 'flex', flexDirection: 'column', padding: 1 }}
            >
              <span style={{ fontSize: '2rem' }}>{flaggedForms.length}</span>
              <span>flagged</span>
              <span style={{ paddingBottom: '8px' }}>form{flaggedForms.length !== 1 ? 's' : ''}</span>
            </Button>
          )}

      <FlaggedItemsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        forms={flaggedForms}
        onSelectForm={onSelectForm}
      />
    </DashboardCard>
  )
}
