import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import Divider from '@mui/material/Divider'
import IconButton from '@mui/material/IconButton'
import Link from '@mui/material/Link'
import Typography from '@mui/material/Typography'
import CloseIcon from '@mui/icons-material/Close'
import type { FlaggedForm } from './types'

interface Props {
  open: boolean
  onClose: () => void
  forms: FlaggedForm[]
  onSelectForm: (submissionId: string) => void
}

export default function FlaggedItemsModal({ open, onClose, forms, onSelectForm }: Props) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pr: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Typography variant="h6" fontWeight={700}>Flagged Forms</Typography>
          <Chip label={forms.length} size="small" color="error" />
        </Box>
        <IconButton size="small" onClick={onClose} aria-label="close">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        {forms.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>No flagged forms in this window.</Typography>
        ) : (
          forms.map((form, i) => (
            <Box key={form.submissionId}>
              {i > 0 && <Divider />}
              <Box sx={{ px: 3, py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', mb: 1 }}>
                  <Link
                    component="button"
                    variant="subtitle2"
                    fontWeight={700}
                    underline="hover"
                    onClick={() => { onSelectForm(form.submissionId); onClose() }}
                    sx={{ textAlign: 'left' }}
                  >
                    {form.facilityName}
                  </Link>
                  {form.inspectionDate && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 2, flexShrink: 0 }}>
                      {new Date(form.inspectionDate).toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </Typography>
                  )}
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                  {form.failedBmpItems.map((item, j) => (
                    <Box key={j} sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Chip label="Fail" size="small" color="error" variant="outlined" sx={{ height: 18, fontSize: '0.65rem', mt: 0.25, flexShrink: 0 }} />
                        <Typography variant="body2">{item.description}</Typography>
                      </Box>
                      {item.notes && (
                        <Typography variant="caption" color="text.secondary" sx={{ pl: 4.5 }}>
                          {item.notes}
                        </Typography>
                      )}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          ))
        )}
      </DialogContent>
    </Dialog>
  )
}
