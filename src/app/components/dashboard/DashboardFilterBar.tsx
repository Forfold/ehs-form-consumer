'use client'

import Box from '@mui/material/Box'
import IconButton from '@mui/material/IconButton'
import MenuItem from '@mui/material/MenuItem'
import Select from '@mui/material/Select'
import ToggleButton from '@mui/material/ToggleButton'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import Typography from '@mui/material/Typography'
import HistoryIcon from '@mui/icons-material/History'
import { useState } from 'react'
import HistorySidebar, { type HistoryItem } from '../HistorySidebar'
import Tooltip from '@mui/material/Tooltip'

export type TimeRange = '30d' | '90d' | '6mo' | '1yr' | 'all' | 'single'

export interface FilterTeam {
  id: string
  name: string
}

export interface SubmissionOption {
  id: string
  label: string
}

interface Props {
  timeRange: TimeRange
  onTimeRangeChange: (range: TimeRange) => void
  teams: FilterTeam[]
  teamId: string
  onTeamChange: (teamId: string) => void
  submissionOptions: SubmissionOption[]
  selectedSubmissionId: string
  onSubmissionChange: (id: string) => void
  history: HistoryItem[]
  historyLoading?: boolean
  onItemTeamsChanged?: (itemId: string, teams: Array<{ id: string; name: string }>) => void
}

const TIME_OPTIONS: Array<{ value: TimeRange; label: string }> = [
  { value: '30d', label: '30d' },
  { value: '90d', label: '90d' },
  { value: '6mo', label: '6mo' },
  { value: '1yr', label: '1yr' },
  { value: 'all', label: 'All' },
  { value: 'single', label: 'Form' },
]

export default function DashboardFilterBar({
  timeRange, onTimeRangeChange,
  teams, teamId, onTeamChange,
  submissionOptions, selectedSubmissionId, onSubmissionChange,
  history, onItemTeamsChanged,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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

      {timeRange === 'single' ? (
        <Select
          value={selectedSubmissionId}
          onChange={e => onSubmissionChange(e.target.value)}
          size="small"
          displayEmpty
          sx={{ fontSize: '0.75rem', minWidth: 200, maxWidth: 300, '& .MuiSelect-select': { py: '3px' } }}
        >
          {submissionOptions.length === 0
            ? <MenuItem value="" disabled>No submissions</MenuItem>
            : submissionOptions.map(s => (
                <MenuItem key={s.id} value={s.id}>{s.label}</MenuItem>
              ))
          }
        </Select>
      ) : (
        teams.length > 0 && (
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
        )
      )}

      <Tooltip title='Show processed forms history'>
        <IconButton
        size="small"
        onClick={() => setSidebarOpen(true)}
        sx={{ color: 'text.secondary', mr: 0.5 }}
        aria-label="open history"
      >
        <HistoryIcon fontSize="small" />
      </IconButton>
      </Tooltip>

      <HistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={history}
        onItemTeamsChanged={onItemTeamsChanged}
      />
    </Box>
  )
}
