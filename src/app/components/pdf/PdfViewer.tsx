'use client'

import { useEffect, useRef, useState } from 'react'
import Box from '@mui/material/Box'
import CircularProgress from '@mui/material/CircularProgress'
import Typography from '@mui/material/Typography'

interface Props {
  url: string
}

export default function PdfViewer({ url }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function render() {
      setLoading(true)
      setError(null)

      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url,
        ).href

        const res = await fetch(url)
        const buffer = await res.arrayBuffer()
        const pdf = await pdfjs.getDocument({ data: buffer }).promise

        if (cancelled || !containerRef.current) return

        containerRef.current.innerHTML = ''

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          if (cancelled) break
          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 1.5 })

          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          canvas.style.display = 'block'
          canvas.style.width = '100%'
          canvas.style.marginBottom = '8px'
          canvas.style.borderRadius = '4px'

          containerRef.current?.appendChild(canvas)

          await page.render({
            canvas,
            canvasContext: canvas.getContext('2d')!,
            viewport,
            annotationMode: pdfjs.AnnotationMode.ENABLE_STORAGE,
          }).promise

          page.cleanup()
        }

        await pdf.destroy()
      } catch {
        if (!cancelled) setError('Failed to load PDF')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    render()
    return () => { cancelled = true }
  }, [url])

  return (
    <Box>
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress size={28} />
        </Box>
      )}
      {error && (
        <Typography color="error" variant="body2">{error}</Typography>
      )}
      <Box ref={containerRef} />
    </Box>
  )
}
