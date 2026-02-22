'use client'

import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import HistoryIcon from '@mui/icons-material/History'
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined'

export interface HistoryItem {
  id: string
  facilityName: string | null
  fileName: string
  processedAt: string
}

interface Props {
  open: boolean
  onClose: () => void
  items: HistoryItem[]
}

export default function HistorySidebar({ open, onClose, items }: Props) {
  return (
    <Drawer
      anchor="left"
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

      {items.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No forms processed yet.
          </Typography>
        </Box>
      ) : (
        <List disablePadding>
          {items.map((item, i) => (
            <Box key={item.id}>
              <ListItem alignItems="flex-start" sx={{ px: 2, py: 1.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
                  <InsertDriveFileOutlinedIcon
                    sx={{ fontSize: 20, color: 'text.disabled', mt: 0.3, flexShrink: 0 }}
                  />
                  <ListItemText
                    primary={item.facilityName ?? item.fileName}
                    secondary={
                      <>
                        {item.facilityName && (
                          <Box component="span" sx={{ display: 'block' }}>
                            {item.fileName}
                          </Box>
                        )}
                        {new Date(item.processedAt).toLocaleString()}
                      </>
                    }
                    primaryTypographyProps={{
                      variant: 'body2',
                      fontWeight: 600,
                      sx: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
                    }}
                    secondaryTypographyProps={{ variant: 'caption', component: 'div' }}
                  />
                </Box>
              </ListItem>
              {i < items.length - 1 && <Divider component="li" />}
            </Box>
          ))}
        </List>
      )}
    </Drawer>
  )
}
