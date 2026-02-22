import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Slider from '@mui/material/Slider'
import Typography from '@mui/material/Typography'
import { useTheme } from '@mui/material/styles'
import DashboardCard from './DashboardCard'

interface Props {
  percent: number
  formCount: number
  windowLabel: string
  threshold: number
  onThresholdChange: (value: number) => void
}

export default function ComplianceStatusCard({ percent, formCount, windowLabel, threshold, onThresholdChange }: Props) {
  const theme = useTheme()
  const passing = percent >= threshold
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
          label={passing ? 'Within Compliance' : 'At Risk'}
          size="small"
          sx={{
            bgcolor: passing ? 'success.light' : 'error.light',
            color: passing ? 'success.dark' : 'error.dark',
            fontWeight: 600,
          }}
        />
      </Box>

      <Box>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
          Alert threshold: {threshold}%
        </Typography>
        <Slider
          size="small"
          value={threshold}
          min={0}
          max={100}
          marks={[{ value: 0 }, { value: 50 }, { value: 80 }, { value: 100 }]}
          onChange={(_, v) => onThresholdChange(v as number)}
          sx={{ color }}
        />
      </Box>
    </DashboardCard>
  )
}
