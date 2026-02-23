'use client'

import type { InspectionFieldHints } from './types/inspection'

let workerReady = false

// Maps common PDF AcroForm field name patterns to InspectionFieldHints keys.
// Field names vary widely across form vendors, so we use loose regex matching.
function matchHintKey(fieldName: string): keyof InspectionFieldHints | null {
  const n = fieldName.toLowerCase()
  if (/facility|site.?name|company|organization|property/.test(n))
    return 'facilityName'
  if (/permit|authorization/.test(n)) return 'permitNumber'
  if (/inspec.+date|date.+inspec|\binspection\b.*\bdate\b|\bdate\b/.test(n))
    return 'inspectionDate'
  if (/inspector|performed.by|inspected.by/.test(n)) return 'inspectorName'
  if (/weather|condition/.test(n)) return 'weatherConditions'
  return null
}

export interface ExtractedPdfFields {
  hints: Partial<InspectionFieldHints>
  /** true if the PDF contained an AcroForm (regardless of whether any hints matched) */
  hasAcroForm: boolean
  /** true if at least one hint value was pre-populated from the form */
  anyPrefilled: boolean
}

/**
 * Attempts to extract AcroForm text-field values from a PDF and map them to
 * InspectionFieldHints keys. Always resolves — check hasAcroForm / anyPrefilled
 * to determine what was found.
 */
export async function extractPdfFields(file: File): Promise<ExtractedPdfFields> {
  const pdfjs = await import('pdfjs-dist')

  if (!workerReady) {
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).href
    workerReady = true
  }

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise

  let fieldObjects: Record<string, Array<{ type: string; value: unknown }>> | null =
    null
  try {
    fieldObjects = (await pdf.getFieldObjects()) as unknown as typeof fieldObjects
  } catch (err) {
    console.warn(
      '[extractPdfFields] getFieldObjects failed (PDF likely has no AcroForm):',
      err,
    )
  }

  await pdf.destroy()

  if (!fieldObjects || Object.keys(fieldObjects).length === 0) {
    return { hints: {}, hasAcroForm: false, anyPrefilled: false }
  }

  const hints: Partial<InspectionFieldHints> = {}

  type FieldEntry = { type: string; value: unknown }
  for (const [name, fields] of Object.entries(fieldObjects) as Array<
    [string, FieldEntry[]]
  >) {
    const key = matchHintKey(name)
    if (!key || hints[key]) continue // skip if no match or slot already filled

    for (const field of fields) {
      if (field.type !== 'Tx') continue
      const value = typeof field.value === 'string' ? field.value.trim() : null
      if (value) {
        hints[key] = value
        break
      }
    }
  }

  return {
    hints,
    hasAcroForm: true,
    anyPrefilled: Object.keys(hints).length > 0,
  }
}
