
import type { HistoryItem } from '../HistorySidebar'
import { type TimeRange } from './DashboardFilterBar'

export const WINDOW_LABELS: Record<Exclude<TimeRange, 'single'>, string> = {
  '30d': 'Last 30 days',
  '90d': 'Last 90 days',
  '6mo': 'Last 6 months',
  '1yr': 'Last year',
  'all': 'All time',
}

export function cutoffDate(range: Exclude<TimeRange, 'single'>): Date | null {
  const now = new Date()
  switch (range) {
    case '30d': return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    case '90d': return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
    case '6mo': return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
    case '1yr': return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    case 'all': return null
  }
}

export function submissionLabel(item: HistoryItem): string {
  const name = item.facilityName ?? item.fileName
  const date = new Date(item.processedAt).toLocaleDateString('default', { month: 'short', day: 'numeric', year: '2-digit' })
  return `${name} · ${date}`
}
