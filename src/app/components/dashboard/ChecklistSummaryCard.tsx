'use client'

import { useTheme } from '@mui/material/styles'
import ReactECharts from 'echarts-for-react'
import DashboardCard from './DashboardCard'
import type { ChecklistTotals } from './types'

interface Props {
  checklistTotals: ChecklistTotals
}

export default function ChecklistSummaryCard({ checklistTotals }: Props) {
  const theme = useTheme()

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: 48, right: 16, top: 8, bottom: 8 },
    xAxis: { type: 'value', splitLine: { show: false }, axisLabel: { show: false } },
    yAxis: {
      type: 'category',
      data: ['Pass', 'Fail', 'N/A'],
      axisLabel: { color: theme.palette.text.secondary, fontSize: 12 },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: [
          {
            value: checklistTotals.pass,
            itemStyle: {
              color: theme.palette.success.main,
              borderRadius: [0, 4, 4, 0],
            },
          },
          {
            value: checklistTotals.fail,
            itemStyle: {
              color: theme.palette.error.main,
              borderRadius: [0, 4, 4, 0],
            },
          },
          {
            value: checklistTotals.na,
            itemStyle: {
              color: theme.palette.action.disabled,
              borderRadius: [0, 4, 4, 0],
            },
          },
        ],
        barMaxWidth: 28,
        label: {
          show: true,
          position: 'right',
          color: theme.palette.text.secondary,
          fontSize: 11,
        },
      },
    ],
  }

  const total = checklistTotals.pass + checklistTotals.fail + checklistTotals.na

  return (
    <DashboardCard title="Checklist Summary" subtitle={`${total} items total`}>
      <ReactECharts option={option} style={{ height: '65%' }} notMerge />
    </DashboardCard>
  )
}
