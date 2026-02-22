import { useState } from 'react'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
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
}

export default function ComplianceStatusCard({ percent, formCount, windowLabel, flaggedForms, onSelectForm }: Props) {
  const theme = useTheme()
  const [modalOpen, setModalOpen] = useState(false)
  const passing = percent === 100
  const color = passing ? theme.palette.success.main : theme.palette.error.main

  return (
    <DashboardCard
      title="Compliance Status"
      subtitle={`${windowLabel} · ${formCount} form${formCount !== 1 ? 's' : ''}`}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 0.5 }}>
        <Typography variant="h2" fontWeight={700} sx={{ color, lineHeight: 1 }}>
          {percent}%
        </Typography>
        <Chip
          label={passing ? 'Within Compliance' : 'Non-Compliant'}
          size="small"
          sx={{
            bgcolor: passing ? 'success.light' : 'error.light',
            color: passing ? 'success.dark' : 'error.dark',
            fontWeight: 600,
          }}
        />
        {flaggedForms.length > 1 && (
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => setModalOpen(true)}
            sx={{ ml: 'auto', flexShrink: 0 }}
          >
            {flaggedForms.length} flagged form{flaggedForms.length !== 1 ? 's' : ''}
          </Button>
        )}
      </Box>

      <FlaggedItemsModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        forms={flaggedForms}
        onSelectForm={onSelectForm}
      />
    </DashboardCard>
  )
}
