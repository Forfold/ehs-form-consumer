"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import { DropZone } from "./DropZone";

interface Props {
  onFile: (file: File) => void;
}

export default function PdfUploader({ onFile }: Props) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <DropZone onFileSelected={setSelectedFile} />

      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={!selectedFile}
        onClick={() => selectedFile && onFile(selectedFile)}
      >
        Review &amp; Save
      </Button>
    </Box>
  );
}
