'use client'

import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import type { HistoryItem } from '../history/HistorySidebar'
import { useDashboardStats } from './useDashboardStats'
import DashboardFilterBar, { type TimeRange } from './DashboardFilterBar'
import { useFilteredHistory } from './useFilteredHistory'
import { submissionLabel, WINDOW_LABELS } from './helpers'
import { DashboardGrid } from './DashboardGrid'

interface Props {
  history: HistoryItem[]
  historyLoading?: boolean
  onItemTeamsChanged?: (
    itemId: string,
    teams: Array<{ id: string; name: string }>,
  ) => void
}

export default function DashboardPanel({
  history,
  historyLoading,
  onItemTeamsChanged,
}: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('6mo')
  const [teamId, setTeamId] = useState('all')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(
    () => history[0]?.id ?? '',
  )

  // Keep selectedSubmissionId valid when history loads or changes
  const resolvedSubmissionId = history.some((h) => h.id === selectedSubmissionId)
    ? selectedSubmissionId
    : (history[0]?.id ?? '')

  const teams = useMemo(() => {
    const seen = new Map<string, string>()
    for (const item of history) {
      for (const t of item.teams ?? []) {
        if (!seen.has(t.id)) seen.set(t.id, t.name)
      }
    }
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [history])

  const filterBySubmissionOptions = useMemo(
    () => history.map((h) => ({ id: h.id, label: submissionLabel(h) })),
    [history],
  )

  const filteredHistory = useFilteredHistory(
    history,
    timeRange,
    teamId,
    resolvedSubmissionId,
  )

  const windowLabel = useMemo(() => {
    if (timeRange === 'single') {
      const item = history.find((h) => h.id === resolvedSubmissionId)
      return item ? item.permitNumber : '1 form'
    }
    return WINDOW_LABELS[timeRange]
  }, [timeRange, history, resolvedSubmissionId])

  const stats = useDashboardStats(filteredHistory)

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <DashboardFilterBar
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        teams={teams}
        teamId={teamId}
        onTeamChange={setTeamId}
        filterBySubmissionOptions={filterBySubmissionOptions}
        selectedSubmissionId={resolvedSubmissionId}
        onSubmissionChange={setSelectedSubmissionId}
        history={history}
        onItemTeamsChanged={onItemTeamsChanged}
      />
      <DashboardGrid
        stats={stats}
        windowLabel={windowLabel}
        historyLoading={historyLoading}
      />
    </Box>
  )
}
