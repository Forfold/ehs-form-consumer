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
  console.log('history: ', history)
  const filteredHistory = useMemo(() => {
    if (timeRange === 'single') {
      return history.filter((h) => h.id === resolvedSubmissionId)
    }
    const cutoff = cutoffDate(timeRange)

    let byTeam: HistoryItem[] = []
    if (teamId === 'all') byTeam = history
    if (teamId === 'personal') byTeam = history.filter((h) => !h.teams?.length)
    else history.filter((h) => h.teams?.some((t) => t.id === teamId))

    // Prefer inspectionDate from extracted data; fall back to processedAt
    return cutoff
      ? byTeam.filter((h) => {
          const dateStr = h.inspectionDate
          const date = new Date(dateStr)
          return date >= cutoff
        })
      : byTeam
  }, [history, timeRange, teamId, resolvedSubmissionId])

  return filteredHistory
}
