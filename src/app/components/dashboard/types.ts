export interface InspectionDataSummary {
  overallStatus: 'compliant' | 'non-compliant' | 'needs-attention'
  bmpItems: Array<{ description: string; status: 'pass' | 'fail' | 'na'; notes: string }>
  correctiveActions: Array<{ description: string; dueDate: string; completed: boolean }>
  facilityName: string | null
  inspectionDate: string | null
}

export interface BmpTotals {
  pass: number
  fail: number
  na: number
}

export interface MonthBucket {
  month: string
  compliant: number
  nonCompliant: number
  needsAttention: number
}

export interface OpenCorrectiveAction {
  submissionId: string
  facilityName: string
  description: string
  dueDate: string
}

export interface DashboardStats {
  compliancePercent: number
  thisMonthCount: number
  bmpTotals: BmpTotals
  monthlyBuckets: MonthBucket[]
  openActions: OpenCorrectiveAction[]
}
