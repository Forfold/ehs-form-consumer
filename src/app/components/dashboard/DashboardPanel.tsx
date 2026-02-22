'use client'

import Box from '@mui/material/Box'
import type { HistoryItem } from '../HistorySidebar'
import { useDashboardStats } from './useDashboardStats'
import ComplianceStatusCard from './ComplianceStatusCard'
import BmpCheckSummaryCard from './BmpCheckSummaryCard'
import MonthlyActivityCard from './MonthlyActivityCard'
import CorrectiveActionsCard from './CorrectiveActionsCard'

interface Props {
  history: HistoryItem[]
  threshold: number
  onThresholdChange: (value: number) => void
  onSelectHistory: (item: HistoryItem) => void
}

export default function DashboardPanel({ history, threshold, onThresholdChange, onSelectHistory }: Props) {
  const stats = useDashboardStats(history)

  function handleSelectSubmission(id: string) {
    const item = history.find(h => h.id === id)
    if (item) onSelectHistory(item)
  }

  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 0,
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
          formCount={stats.thisMonthCount}
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
  )
}
