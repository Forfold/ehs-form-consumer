import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import PdfUploader from "../pdf/PdfUploader";

interface Props {
  onFile: (file: File) => void;
}

export default function UploaderCard({ onFile }: Props) {
  return (
    <Paper
      variant="outlined"
      sx={{
        width: { xs: "100%", lg: 400 },
        flexShrink: 0,
        p: { xs: 3, sm: 4 },
        alignSelf: "flex-start",
      }}
    >
      <Typography variant="h6" gutterBottom>
        PDF Form Uploader
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Visualize the compliance of your Environmental, Health, and Safety inspection
        results
      </Typography>

      <PdfUploader onFile={onFile} />
    </Paper>
  );
}
