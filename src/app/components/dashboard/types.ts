export interface InspectionDataSummary {
  overallStatus: 'compliant' | 'non-compliant' | 'needs-attention'
  bmpItems: Array<{ section?: string; description: string; status: 'pass' | 'fail' | 'na'; notes: string }>
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

export interface FlaggedForm {
  submissionId: string
  facilityName: string
  inspectionDate: string | null
  failedBmpItems: Array<{ section?: string; description: string; notes: string }>
}

export interface OpenCorrectiveAction {
  submissionId: string
  facilityName: string
  description: string
  dueDate: string
  source: 'documented' | 'gap'
}

export interface DashboardStats {
  compliancePercent: number
  formCount: number
  bmpTotals: BmpTotals
  monthlyBuckets: MonthBucket[]
  openActions: OpenCorrectiveAction[]
  flaggedForms: FlaggedForm[]
}
