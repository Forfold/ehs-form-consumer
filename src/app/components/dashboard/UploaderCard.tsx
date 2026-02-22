import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Divider from '@mui/material/Divider'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import PdfUploader from '../PdfUploader'

const EXTRACTED_FIELDS = [
  'Facility & permit details',
  'BMP inspection results',
  'Corrective actions & due dates',
]

interface Props {
  onFile: (file: File) => void
  loading: boolean
  error: string | null
}

export default function UploaderCard({ onFile, loading, error }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{ width: { xs: '100%', lg: 400 }, flexShrink: 0, p: { xs: 3, sm: 4 }, borderRadius: 3, alignSelf: 'flex-start' }}
    >
      <Typography variant="h6" gutterBottom>
        Monthly Inspection Form
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Upload your ISWGP PDF and extract structured data in seconds.
      </Typography>

      <PdfUploader onFile={onFile} loading={loading} />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      <Divider sx={{ my: 3 }} />

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {EXTRACTED_FIELDS.map(field => (
          <Box key={field} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CheckCircleOutlineIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">
              {field}
            </Typography>
          </Box>
        ))}
      </Box>
    </Paper>
  )
}
