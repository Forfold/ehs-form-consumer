'use client'

import { useMemo, useState } from 'react'
import Box from '@mui/material/Box'
import type { HistoryItem } from '../HistorySidebar'
import { useDashboardStats } from './useDashboardStats'
import ComplianceStatusCard from './ComplianceStatusCard'
import BmpCheckSummaryCard from './BmpCheckSummaryCard'
import MonthlyActivityCard from './MonthlyActivityCard'
import CorrectiveActionsCard from './CorrectiveActionsCard'
import DashboardFilterBar, { type TimeRange } from './DashboardFilterBar'

interface Props {
  history: HistoryItem[]
  threshold: number
  onThresholdChange: (value: number) => void
  onSelectHistory: (item: HistoryItem) => void
}

const WINDOW_LABELS: Record<Exclude<TimeRange, 'single'>, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '6mo': 'Last 6 months',
  '1yr': 'Last year',
  'all': 'All time',
}

function cutoffDate(range: Exclude<TimeRange, 'single'>): Date | null {
  const now = new Date()
  switch (range) {
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '6mo': return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    case '1yr': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    case 'all': return null
  }
}

function submissionLabel(item: HistoryItem): string {
  const name = item.facilityName ?? item.fileName
  const date = new Date(item.processedAt).toLocaleDateString('default', { month: 'short', day: 'numeric', year: '2-digit' })
  return `${name} · ${date}`
}

export default function DashboardPanel({ history, threshold, onThresholdChange, onSelectHistory }: Props) {
  const [timeRange, setTimeRange] = useState<TimeRange>('6mo')
  const [teamId, setTeamId] = useState('all')
  const [selectedSubmissionId, setSelectedSubmissionId] = useState(() => history[0]?.id ?? '')

  // Keep selectedSubmissionId valid when history loads or changes
  const resolvedSubmissionId = history.some(h => h.id === selectedSubmissionId)
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

  const submissionOptions = useMemo(
    () => history.map(h => ({ id: h.id, label: submissionLabel(h) })),
    [history],
  )

  const filteredHistory = useMemo(() => {
    if (timeRange === 'single') {
      return history.filter(h => h.id === resolvedSubmissionId)
    }
    const cutoff = cutoffDate(timeRange)
    const byTeam = teamId === 'all'
      ? history
      : teamId === 'personal'
        ? history.filter(h => !h.teams?.length)
        : history.filter(h => h.teams?.some(t => t.id === teamId))
    return cutoff
      ? byTeam.filter(h => new Date(h.processedAt) >= cutoff)
      : byTeam
  }, [history, timeRange, teamId, resolvedSubmissionId])

  const windowLabel = useMemo(() => {
    if (timeRange === 'single') {
      const item = history.find(h => h.id === resolvedSubmissionId)
      return item ? (item.facilityName ?? item.fileName) : '1 form'
    }
    return WINDOW_LABELS[timeRange]
  }, [timeRange, history, resolvedSubmissionId])

  const stats = useDashboardStats(filteredHistory)

  function handleSelectSubmission(id: string) {
    const item = history.find(h => h.id === id)
    if (item) onSelectHistory(item)
  }

  return (
    <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
      <DashboardFilterBar
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        teams={teams}
        teamId={teamId}
        onTeamChange={setTeamId}
        submissionOptions={submissionOptions}
        selectedSubmissionId={resolvedSubmissionId}
        onSubmissionChange={setSelectedSubmissionId}
      />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gridAutoRows: 'min-content',
          gap: 2,
          alignContent: 'start',
        }}
      >
        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, minWidth: 0 }}>
          <ComplianceStatusCard
            percent={stats.compliancePercent}
            formCount={stats.formCount}
            windowLabel={windowLabel}
            threshold={threshold}
            onThresholdChange={onThresholdChange}
          />
        </Box>

        <Box sx={{ minWidth: 0 }}><BmpCheckSummaryCard bmpTotals={stats.bmpTotals} /></Box>
        <Box sx={{ minWidth: 0 }}><MonthlyActivityCard buckets={stats.monthlyBuckets} /></Box>

        <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, minWidth: 0 }}>
          <CorrectiveActionsCard
            actions={stats.openActions}
            onSelectSubmission={handleSelectSubmission}
          />
        </Box>
      </Box>
    </Box>
  )
}
