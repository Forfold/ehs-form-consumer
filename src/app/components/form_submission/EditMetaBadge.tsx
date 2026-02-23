import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Typography from '@mui/material/Typography'
import type { EditMeta } from '@/lib/types/inspection'

interface Props {
  meta: EditMeta
}

function formatTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: 'short', day: 'numeric',
      hour: 'numeric', minute: '2-digit',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export default function EditMetaBadge({ meta }: Props) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.5, flexWrap: 'wrap' }}>
      <Chip
        label={meta.editType === 'correction' ? 'Correction' : 'Update'}
        color={meta.editType === 'correction' ? 'warning' : 'success'}
        size="small"
        sx={{ height: 18, fontSize: '0.65rem', fontWeight: 600 }}
      />
      <Typography variant="caption" color="text.disabled">
        {meta.editedBy} · {formatTime(meta.editedAt)}
      </Typography>
    </Box>
  )
}
