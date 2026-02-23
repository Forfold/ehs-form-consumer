export type BmpStatus = 'pass' | 'fail' | 'na'
export type OverallStatus = 'compliant' | 'non-compliant' | 'needs-attention'

export interface BmpItem {
  section?: string
  description: string
  status: BmpStatus
  notes: string
}

export interface CorrectiveAction {
  description: string
  dueDate: string
  completed: boolean
}

export interface InspectionData {
  facilityName: string
  permitNumber: string
  inspectionDate: string
  inspectorName: string
  weatherConditions?: string
  rainEventDuringInspection?: boolean | null
  overallStatus: OverallStatus
  bmpItems: BmpItem[]
  correctiveActions: CorrectiveAction[]
  summary: string
  deadletter?: Record<string, unknown>
}

export interface InspectionFieldHints {
  facilityName?: string
  permitNumber?: string
  inspectionDate?: string
  inspectorName?: string
  weatherConditions?: string
}
