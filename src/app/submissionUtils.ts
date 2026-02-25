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
    facilityName: s.facilityName,
    facilityAddress: s.facilityAddress,
    permitNumber: s.permitNumber,
    inspectionDate: s.inspectionDate,
    inspectorName: s.inspectorName,
    data: s.data,
    teams: s.teams,
  }
}
