import { useMemo } from 'react'
import type { HistoryItem } from '../HistorySidebar'
import type { DashboardStats, FlaggedForm, InspectionDataSummary, MonthBucket } from './types'

function monthKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}`
}

function monthLabel(d: Date) {
  return d.toLocaleString('default', { month: 'short', year: '2-digit' })
}

export function useDashboardStats(history: HistoryItem[]): DashboardStats {
  return useMemo(() => {
    const now = new Date()

    // Compliance across the (already-filtered) history
    const compliant = history.filter(
      item => (item.data as Partial<InspectionDataSummary>).overallStatus === 'compliant'
    ).length
    const compliancePercent =
      history.length === 0 ? 100 : Math.round((compliant / history.length) * 100)

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

    // Open corrective actions (documented) + BMP failures with no documented action (gaps)
    const openActions = history.flatMap(item => {
      const d = item.data as Partial<InspectionDataSummary>
      const documented = (d.correctiveActions ?? [])
        .filter(a => !a.completed)
        .map(a => ({
          submissionId: item.id,
          facilityName: item.facilityName ?? item.fileName,
          description: a.description,
          dueDate: a.dueDate,
          source: 'documented' as const,
        }))

      // If no corrective actions were documented, surface each failed BMP item as a gap
      const failedBmps = (d.bmpItems ?? []).filter(b => b.status === 'fail')
      const gaps = documented.length === 0 && failedBmps.length > 0
        ? failedBmps.map(b => ({
            submissionId: item.id,
            facilityName: item.facilityName ?? item.fileName,
            description: b.description,
            dueDate: '',
            source: 'gap' as const,
          }))
        : []

      return [...documented, ...gaps]
    })

    // Flagged forms — non-compliant items with their failed BMP checks
    const flaggedForms: FlaggedForm[] = history
      .filter(item => (item.data as Partial<InspectionDataSummary>).overallStatus === 'non-compliant')
      .map(item => {
        const d = item.data as Partial<InspectionDataSummary>
        return {
          submissionId: item.id,
          facilityName: item.facilityName ?? item.fileName,
          inspectionDate: d.inspectionDate ?? null,
          failedBmpItems: (d.bmpItems ?? [])
            .filter(b => b.status === 'fail')
            .map(b => ({ section: b.section, description: b.description, notes: b.notes })),
        }
      })

    return { compliancePercent, formCount: history.length, bmpTotals, monthlyBuckets, openActions, flaggedForms }
  }, [history])
}
