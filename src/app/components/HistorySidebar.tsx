'use client'

import { useRouter } from 'next/navigation'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import HistoryIcon from '@mui/icons-material/History'
import { HistoryList } from './HistoryList'

export interface HistoryItem {
  id: string
  facilityName: string | null
  fileName: string
  processedAt: string
  data: Record<string, unknown>
  teams?: Array<{ id: string; name: string }>
}

interface Props {
  open: boolean
  onClose: () => void
  items: HistoryItem[]
  onItemTeamsChanged?: (itemId: string, teams: Array<{ id: string; name: string }>) => void
}

export default function HistorySidebar({ open, onClose, items, onItemTeamsChanged }: Props) {
  const router = useRouter()

  function handleSelect(item: HistoryItem) {
    router.push(`/forms/${item.id}`)
    onClose()
  }

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{ sx: { width: 300 } }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5, gap: 1 }}>
        <HistoryIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
        <Typography variant="subtitle2" fontWeight={700} sx={{ flex: 1 }}>
          Processed Forms
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <Divider />

      <HistoryList
        items={items}
        onItemClick={handleSelect}
        onItemTeamsChanged={onItemTeamsChanged!}
      />
    </Drawer>
  )
}
