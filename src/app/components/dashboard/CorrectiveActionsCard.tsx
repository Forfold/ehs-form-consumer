import Box from '@mui/material/Box'
import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Typography from '@mui/material/Typography'
import DashboardCard from './DashboardCard'
import type { OpenCorrectiveAction } from './types'

interface Props {
  actions: OpenCorrectiveAction[]
  onSelectSubmission: (submissionId: string) => void
}

function isOverdue(dueDate: string) {
  return dueDate && new Date(dueDate) < new Date()
}

export default function CorrectiveActionsCard({ actions, onSelectSubmission }: Props) {
  return (
    <DashboardCard
      title="Open Corrective Actions"
      subtitle={actions.length > 0 ? `${actions.length} pending across all forms` : undefined}
    >
      {actions.length === 0 ? (
        <Box sx={{ py: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            No open corrective actions
          </Typography>
        </Box>
      ) : (
        <TableContainer sx={{ maxHeight: 220, overflowX: 'auto' }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Facility</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem' }}>Due</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {actions.map((a, i) => (
                <TableRow
                  key={`${a.submissionId}-${i}`}
                  onClick={() => onSelectSubmission(a.submissionId)}
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <TableCell sx={{ fontSize: '0.75rem', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.facilityName}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {a.description}
                  </TableCell>
                  <TableCell sx={{ fontSize: '0.75rem', color: isOverdue(a.dueDate) ? 'error.main' : 'text.primary', whiteSpace: 'nowrap' }}>
                    {a.dueDate || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </DashboardCard>
  )
}
