'use client'

/** Uploads a PDF file to Vercel Blob via the /api/upload-pdf route.
 *  Returns the public blob URL for the stored file. */
export async function uploadPdf(file: File, submissionId?: string): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  if (submissionId) form.append('submissionId', submissionId)

  const res = await fetch('/api/upload-pdf', { method: 'POST', body: form })
  if (!res.ok) throw new Error('PDF upload failed')

  const { url } = (await res.json()) as { url: string }
  return url
}
