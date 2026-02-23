
'use client'

import Box from '@mui/material/Box'
import { useRouter } from 'next/navigation'
import ComplianceStatusCard from './ComplianceStatusCard'
import BmpCheckSummaryCard from './BmpCheckSummaryCard'
import MonthlyActivityCard from './MonthlyActivityCard'
import CorrectiveActionsCard from './CorrectiveActionsCard'
import { DashboardStats } from './types'

interface DashboardGridProps {
  stats: DashboardStats
  windowLabel: string
  historyLoading?: boolean
}

export function DashboardGrid({ stats, windowLabel, historyLoading }: DashboardGridProps) {
  const router = useRouter()

  function handleSelectSubmission(id: string) {
    router.push(`/forms/${id}`)
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
        gridAutoRows: 'min-content',
        gap: 3,
        alignContent: 'start',
      }}
    >
      <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, minWidth: 0 }}>
        <ComplianceStatusCard
          percent={stats.compliancePercent}
          formCount={stats.formCount}
          windowLabel={windowLabel}
          flaggedForms={stats.flaggedForms}
          onSelectForm={id => router.push(`/forms/${id}`)}
          loading={historyLoading}
        />
      </Box>

      <Box sx={{ minWidth: 0 }}><BmpCheckSummaryCard checklistTotals={stats.checklistTotals} /></Box>
      <Box sx={{ minWidth: 0 }}><MonthlyActivityCard buckets={stats.monthlyBuckets} /></Box>

      <Box sx={{ gridColumn: { xs: '1', md: '1 / -1' }, minWidth: 0 }}>
        <CorrectiveActionsCard
          actions={stats.openActions}
          onSelectSubmission={handleSelectSubmission}
          loading={historyLoading}
        />
      </Box>
    </Box>
  )
}
