'use client'

import * as pdfjs from 'pdfjs-dist'

// Configure the worker once (runs in the browser, uses the bundled worker)
let workerReady = false
function ensureWorker() {
  if (workerReady) return
  // Use URL constructor so Next.js/webpack can resolve the asset at build time
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href
  workerReady = true
}

/**
 * Renders every page of a PDF File to JPEG base64 strings.
 * Crucially, PDF.js renders the full annotation/form-field layer (where
 * hand-marked X's, checkboxes, and other overlays live), so Claude receives
 * an accurate visual representation of the filled-out form.
 */
export async function pdfToImages(file: File, scale = 2.0): Promise<string[]> {
  ensureWorker()

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise
  const images: string[] = []

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum)
    const viewport = page.getViewport({ scale })

    const canvas = document.createElement('canvas')
    canvas.width = Math.floor(viewport.width)
    canvas.height = Math.floor(viewport.height)
    const ctx = canvas.getContext('2d')!

    await page.render({
      canvasContext: ctx,
      viewport,
      annotationMode: 2, // pdfjs AnnotationMode.ENABLE_FORMS — renders checked boxes, X marks, etc.
    }).promise

    images.push(canvas.toDataURL('image/jpeg', 0.9).split(',')[1])
    page.cleanup()
  }

  await pdf.destroy()
  return images
}
