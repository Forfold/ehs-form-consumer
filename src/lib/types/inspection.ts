export type ChecklistStatus = 'pass' | 'fail' | 'na'
export type OverallStatus = 'compliant' | 'non-compliant' | 'needs-attention'

export interface ChecklistItem {
  section?: string
  description: string
  status: ChecklistStatus
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
  checklistItems: ChecklistItem[]
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
