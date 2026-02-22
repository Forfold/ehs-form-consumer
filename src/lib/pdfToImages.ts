'use client'

import * as pdfjs from 'pdfjs-dist'

let workerReady = false
function ensureWorker() {
  if (workerReady) return
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
  ).href
  workerReady = true
}

/**
 * Renders every page of a PDF to JPEG base64 strings, compositing ALL layers:
 *
 *   annotationMode: ENABLE_STORAGE (3)
 *   ├── Base page content stream (always rendered)
 *   ├── Ink / e-drawing annotations  (appearance streams → canvas)
 *   ├── Shape annotations — rectangles, circles, arrows (appearance streams)
 *   ├── Stamp / free-text annotations (appearance streams)
 *   └── AcroForm / interactive form fields (field values composited to canvas)
 *
 * ENABLE_STORAGE is the "print" mode: everything is flattened onto the canvas
 * so Claude receives a pixel-accurate view of exactly what the user marked.
 *
 * Contrast with ENABLE_FORMS (2), which sends form-field widgets to an HTML
 * overlay instead of the canvas — so they would appear blank in our export.
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
      canvas,          // required in pdfjs-dist v5
      canvasContext: ctx,
      viewport,
      // ENABLE_STORAGE = 3: composites form-field values AND all annotation
      // appearance streams directly onto the canvas — correct for export/print.
      annotationMode: pdfjs.AnnotationMode.ENABLE_STORAGE,
    }).promise

    images.push(canvas.toDataURL('image/jpeg', 0.92).split(',')[1])
    page.cleanup()
  }

  await pdf.destroy()
  return images
}
