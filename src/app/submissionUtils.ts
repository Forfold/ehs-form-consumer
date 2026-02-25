import type { HistoryItem } from './components/history/HistorySidebar'

export interface SubmissionForHistory {
  id: string
  processedAt: string
  displayName: string | null
  facilityName: string
  facilityAddress: string
  permitNumber: string
  inspectionDate: string
  inspectorName: string
  data: Record<string, unknown>
  teams: Array<{ id: string; name: string }>
}

export function submissionToHistoryItem(s: SubmissionForHistory): HistoryItem {
  return {
    id: s.id,
    processedAt: s.processedAt,
    permitNumber: s.permitNumber,
    facilityName: s.facilityName,
    data: s.data,
    teams: s.teams,
  }
}
