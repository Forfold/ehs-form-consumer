"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import PdfViewer from "./PdfViewer";
import PdfUploadButton from "./PdfUploadButton";

interface Props {
  submissionId: string;
  initialPdfUrl: string | null;
}

export default function PdfSection({ submissionId, initialPdfUrl }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(initialPdfUrl);

  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
        Original Form
      </Typography>

      {pdfUrl ? (
        <>
          <PdfViewer url={pdfUrl} />
          <Box sx={{ mt: 1.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
            <PdfUploadButton
              submissionId={submissionId}
              onUploaded={setPdfUrl}
              replace
            />
            <Typography variant="caption" color="text.secondary">
              Replacing the PDF will not re-process the form. Extracted data will be
              preserved.
            </Typography>
          </Box>
        </>
      ) : (
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            No original PDF attached.
          </Typography>
          <PdfUploadButton submissionId={submissionId} onUploaded={setPdfUrl} />
        </Box>
      )}
    </Box>
  );
}
