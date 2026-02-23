
import { useMemo } from 'react'
import type { HistoryItem } from '../history/HistorySidebar'
import { type TimeRange } from './DashboardFilterBar'
import { cutoffDate } from './helpers'

export function useFilteredHistory(
  history: HistoryItem[],
  timeRange: TimeRange,
  teamId: string,
  resolvedSubmissionId: string,
) {
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

  return filteredHistory
}
