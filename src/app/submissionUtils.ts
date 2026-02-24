import type { HistoryItem } from './components/history/HistorySidebar'

export interface SubmissionForHistory {
  id: string
  processedAt: string
  displayName: string | null
  data: Record<string, unknown>
  teams: Array<{ id: string; name: string }>
}

export function submissionToHistoryItem(s: SubmissionForHistory): HistoryItem {
  return {
    id: s.id,
    processedAt: s.processedAt,
    permitNumber: (s.data?.permitNumber as string | undefined) ?? '',
    facilityName:
      (s.data?.facilityName as string | undefined) ?? s.displayName ?? null,
    data: s.data,
    teams: s.teams,
  }
}
