'use client'

import { useTheme } from '@mui/material/styles'
import ReactECharts from 'echarts-for-react'
import DashboardCard from './DashboardCard'
import type { MonthBucket } from './types'

interface Props {
  buckets: MonthBucket[]
}

export default function MonthlyActivityCard({ buckets }: Props) {
  const theme = useTheme()
  const months = buckets.map(b => b.month)

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: {
      data: ['Compliant', 'Needs Attention', 'Non-Compliant'],
      textStyle: { color: theme.palette.text.secondary, fontSize: 11 },
      bottom: 0,
      itemHeight: 10,
    },
    grid: { left: 28, right: 12, top: 8, bottom: 36 },
    xAxis: {
      type: 'category',
      data: months,
      axisLabel: { color: theme.palette.text.secondary, fontSize: 11 },
      axisLine: { lineStyle: { color: theme.palette.divider } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      splitLine: { lineStyle: { color: theme.palette.divider } },
      axisLabel: { color: theme.palette.text.secondary, fontSize: 11 },
    },
    series: [
      {
        name: 'Compliant',
        type: 'bar',
        stack: 'total',
        data: buckets.map(b => b.compliant),
        itemStyle: { color: theme.palette.success.main },
      },
      {
        name: 'Needs Attention',
        type: 'bar',
        stack: 'total',
        data: buckets.map(b => b.needsAttention),
        itemStyle: { color: theme.palette.warning.main },
      },
      {
        name: 'Non-Compliant',
        type: 'bar',
        stack: 'total',
        data: buckets.map(b => b.nonCompliant),
        itemStyle: { color: theme.palette.error.main, borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
      },
    ],
  }

  return (
    <DashboardCard title="Monthly Activity" subtitle="Submissions by compliance status">
      <ReactECharts option={option} style={{ height: 200 }} notMerge />
    </DashboardCard>
  )
}
