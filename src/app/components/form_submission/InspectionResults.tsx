import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemIcon from '@mui/material/ListItemIcon'
import ListItemText from '@mui/material/ListItemText'
import Paper from '@mui/material/Paper'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import WarningAmberIcon from '@mui/icons-material/WarningAmber'
import type { BmpStatus, InspectionData } from '@/lib/types/inspection'

export type { InspectionData }

interface Props {
  data: InspectionData
}

const bmpChipProps: Record<BmpStatus, { label: string; color: 'success' | 'error' | 'default' }> = {
  pass: { label: 'Pass', color: 'success' },
  fail: { label: 'Fail', color: 'error'   },
  na:   { label: 'N/A',  color: 'default' },
}

function SectionHeading({ children, large }: { children: React.ReactNode; large?: boolean }) {
  return (
    <Typography
      variant="overline"
      sx={{
        color: 'text.secondary',
        fontWeight: 600,
        letterSpacing: '0.08em',
        display: 'block',
        mb: 1.5,
        fontSize: large ? '0.8rem' : undefined,
      }}
    >
      {children}
    </Typography>
  )
}

export default function InspectionResults({ data }: Props) {
  const bmpItems = data.bmpItems ?? []
  const correctiveActions = data.correctiveActions ?? []
  const pendingCount = correctiveActions.filter(a => !a.completed).length
  const deadletterCount = data.deadletter ? Object.keys(data.deadletter).length : 0

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>

      {/* Facility info */}
      <Paper variant="outlined" sx={{ p: 2 }}>
        <SectionHeading large>Facility Information</SectionHeading>
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
          {[
            ['Facility Name',    data.facilityName],
            ['Permit Number',    data.permitNumber],
            ['Inspection Date',  data.inspectionDate],
            ['Inspector',        data.inspectorName],
          ].map(([label, value]) => (
            <Box key={label}>
              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                {label}
              </Typography>
              <Typography variant="body1">{value || '—'}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      {/* Summary */}
      {data.summary && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <SectionHeading>Summary</SectionHeading>
          <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.7 }}>
            {data.summary}
          </Typography>
        </Paper>
      )}

      {/* Corrective actions */}
      {correctiveActions.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <SectionHeading>Corrective Actions</SectionHeading>
            {pendingCount > 0 && (
              <Chip
                label={`${pendingCount} pending`}
                color="warning"
                size="small"
                sx={{ mb: 1.5 }}
              />
            )}
          </Box>
          <List disablePadding>
            {correctiveActions.map((action, i) => (
              <Box key={i}>
                {i > 0 && <Divider component="li" />}
                <ListItem alignItems="flex-start" disableGutters sx={{ py: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                    {action.completed
                      ? <CheckCircleIcon color="success" />
                      : <WarningAmberIcon color="warning" />
                    }
                  </ListItemIcon>
                  <ListItemText
                    primary={action.description}
                    secondary={`Due: ${action.dueDate || 'N/A'} · ${action.completed ? 'Completed' : 'Pending'}`}
                    slotProps={{
                      primary: { variant: 'body2', fontWeight: 500 } as object,
                      secondary: { variant: 'caption' } as object,
                    }}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        </Paper>
      )}

      {/* BMP items */}
      {bmpItems.length > 0 && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <SectionHeading>BMP Inspection Items</SectionHeading>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                  <TableCell sx={{ fontWeight: 600, width: 90 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Notes</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {bmpItems.map((item, i) => {
                  const chip = bmpChipProps[item.status] ?? { label: item.status, color: 'default' as const }
                  return (
                    <TableRow
                      key={i}
                      sx={{ bgcolor: item.status === 'fail' ? 'error.50' : undefined }}
                    >
                      <TableCell>{item.description}</TableCell>
                      <TableCell>
                        <Chip label={chip.label} color={chip.color} size="small" />
                      </TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>{item.notes || '—'}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Deadletter */}
      {deadletterCount > 0 && (
        <Paper id="deadletter-section" variant="outlined" sx={{ p: 2 }}>
          <SectionHeading>Unprocessable Fields</SectionHeading>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              bgcolor: 'action.hover',
              borderRadius: 1,
              fontSize: 12,
              color: 'text.secondary',
              overflowX: 'auto',
              fontFamily: 'var(--font-geist-mono), monospace',
            }}
          >
            {JSON.stringify(data.deadletter, null, 2)}
          </Box>
        </Paper>
      )}

    </Box>
  )
}
