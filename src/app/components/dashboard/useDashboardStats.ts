import { useMemo } from 'react'
import type { HistoryItem } from '../HistorySidebar'
import type { DashboardStats, InspectionDataSummary, MonthBucket } from './types'

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`
}

function monthLabel(d: Date) {
  return d.toLocaleString('default', { month: 'short', year: '2-digit' })
}

export function useDashboardStats(history: HistoryItem[]): DashboardStats {
  return useMemo(() => {
    const now = new Date()
    const thisKey = monthKey(now)

    // Compliance this month
    const thisMonthForms = history.filter(item => monthKey(new Date(item.processedAt)) === thisKey)
    const compliant = thisMonthForms.filter(
      item => (item.data as Partial<InspectionDataSummary>).overallStatus === 'compliant'
    ).length
    const compliancePercent =
      thisMonthForms.length === 0 ? 100 : Math.round((compliant / thisMonthForms.length) * 100)

    // BMP totals across all history
    const bmpTotals = { pass: 0, fail: 0, na: 0 }
    for (const item of history) {
      for (const bmp of (item.data as Partial<InspectionDataSummary>).bmpItems ?? []) {
        if (bmp.status === 'pass') bmpTotals.pass++
        else if (bmp.status === 'fail') bmpTotals.fail++
        else bmpTotals.na++
      }
    }

    // Monthly buckets — last 6 months oldest first
    const bucketMap = new Map<string, MonthBucket>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      bucketMap.set(monthKey(d), { month: monthLabel(d), compliant: 0, nonCompliant: 0, needsAttention: 0 })
    }
    for (const item of history) {
      const key = monthKey(new Date(item.processedAt))
      const bucket = bucketMap.get(key)
      if (!bucket) continue
      const status = (item.data as Partial<InspectionDataSummary>).overallStatus
      if (status === 'compliant') bucket.compliant++
      else if (status === 'non-compliant') bucket.nonCompliant++
      else bucket.needsAttention++
    }
    const monthlyBuckets = Array.from(bucketMap.values())

    // Open corrective actions
    const openActions = history.flatMap(item => {
      const d = item.data as Partial<InspectionDataSummary>
      return (d.correctiveActions ?? [])
        .filter(a => !a.completed)
        .map(a => ({
          submissionId: item.id,
          facilityName: item.facilityName ?? item.fileName,
          description: a.description,
          dueDate: a.dueDate,
        }))
    })

    return { compliancePercent, thisMonthCount: thisMonthForms.length, bmpTotals, monthlyBuckets, openActions }
  }, [history])
}
