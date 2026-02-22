'use client'

import { useRef, useState } from 'react'
import Button from '@mui/material/Button'
import CircularProgress from '@mui/material/CircularProgress'
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined'
import { uploadPdf } from '@/lib/uploadPdf'
import { gqlFetch } from '@/lib/graphql/client'

const ATTACH_PDF_MUTATION = `
  mutation AttachPdf($id: ID!, $pdfStorageKey: String!) {
    attachPdfToSubmission(id: $id, pdfStorageKey: $pdfStorageKey) { id pdfStorageKey }
  }
`

interface Props {
  submissionId: string
  onUploaded: (url: string) => void
}

export default function PdfUploadButton({ submissionId, onUploaded }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    try {
      const url = await uploadPdf(file, submissionId)
      await gqlFetch(ATTACH_PDF_MUTATION, { id: submissionId, pdfStorageKey: url })
      onUploaded(url)
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        hidden
        onChange={handleChange}
      />
      <Button
        variant="outlined"
        size="small"
        startIcon={loading ? <CircularProgress size={14} /> : <UploadFileOutlinedIcon />}
        disabled={loading}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? 'Uploading…' : 'Attach original PDF'}
      </Button>
    </>
  )
}
