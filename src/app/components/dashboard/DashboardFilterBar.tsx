'use client'

import Box from '@mui/material/Box'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'

export type TimeRange = '30d' | '90d' | '6mo' | '1yr' | 'all'

export interface FilterTeam {
  id: string
  name: string
}

interface Props {
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  teams: FilterTeam[]
  teamId: string
  onTeamChange: (teamId: string) => void
}

const TIME_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '6mo', label: '6mo' },
  { value: '1yr', label: '1yr' },
  { value: 'all', label: 'All' },
]

export default function DashboardFilterBar({ timeRange, onTimeRangeChange, teams, teamId, onTeamChange }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 1.5 }}>
      <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', mr: 0.5 }}>
        Showing
      </Typography>

      <ToggleButtonGroup
        value={timeRange}
        exclusive
        size="small"
        onChange={(_, v) => { if (v) onTimeRangeChange(v as TimeRange) }}
        sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1.25, fontSize: '0.72rem', lineHeight: 1.6, border: '1px solid', borderColor: 'divider' } }}
      >
        {TIME_OPTIONS.map(opt => (
          <ToggleButton key={opt.value} value={opt.value}>
            {opt.label}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>

      {teams.length > 0 && (
        <Select
          value={teamId}
          onChange={e => onTeamChange(e.target.value)}
          size="small"
          sx={{ fontSize: '0.75rem', minWidth: 130, '& .MuiSelect-select': { py: '3px' } }}
        >
          <MenuItem value="all">All teams</MenuItem>
          <MenuItem value="personal">Personal only</MenuItem>
          {teams.map(t => (
            <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
          ))}
        </Select>
      )}
    </Box>
  )
}
