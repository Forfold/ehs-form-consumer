import Alert from '@mui/material/Alert'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import PdfUploader from '../pdf/PdfUploader'

interface Props {
  onFile: (file: File) => void
  loading: boolean
  error: string | null
}

export default function UploaderCard({ onFile, loading, error }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{ width: { xs: '100%', lg: 400 }, flexShrink: 0, p: { xs: 3, sm: 4 }, alignSelf: 'flex-start' }}
    >
      <Typography variant="h6" gutterBottom>
        PDF Form Uploader
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Visualize the compliance of your Environmental, Health, and Safety inspection results
      </Typography>

      <PdfUploader onFile={onFile} loading={loading} />

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
          <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.85 }}>
            Re-upload your PDF to try again, or contact support if the problem persists.
          </Typography>
        </Alert>
      )}
    </Paper>
  )
}
