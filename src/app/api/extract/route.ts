import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const PROMPT = `This is an ISWGP (Industrial Stormwater General Permit) Monthly Inspection / Visual Evaluation Report. The pages are fully-rendered PDF images with ALL layers composited: base content, AcroForm field values, ink/e-drawing annotations, shape annotations, stamps, and free-text overlays. Every visible mark is present.

CHECKBOX READING INSTRUCTIONS — forms may be filled in any of these ways:

1. AcroForm / digital form fill: a checkbox widget rendered as ✓, ✗, ●, or a filled square inside the column cell
2. Handwritten ink (pen, pencil, stylus/e-drawing): strokes, X marks, checkmarks, or scribbles drawn inside or directly over a circle
3. Ink annotation overlay: a digitally-drawn mark (e.g. from Apple Pencil or a PDF annotation app) placed on top of the circle
4. Shape annotation: a rectangle, circle, or oval drawn around or enclosing the correct column cell — treat the enclosed column as selected
5. Arrow annotation: an arrow pointing at a specific column cell — treat the pointed-to column as selected
6. Stamp annotation: any stamp, sticker, or imported image placed in a column cell

A circle/cell counts as SELECTED if ANY mark appears inside it or is clearly associated with it (enclosed by a shape, pointed to by an arrow, etc.). An untouched empty circle = not selected.

Examine ALL three columns (Yes / No / N/A) per row before deciding. If no column is clearly marked, use "na".

TEXT READING INSTRUCTIONS:
- Text fields may be filled via digital form fill, typewriter, or handwriting (print or cursive)
- Read faint pencil marks and scratched-out corrections (use the most recent/legible value)
- If a text field is completely blank or illegible, return null for that field

Map answers to BMP status:
- "Yes" marked = "pass" (compliant)
- "No" marked = "fail" (non-compliant)
- "N/A" marked = "na"
- Not determinable = "na"

Extract into this exact JSON shape:
{
  "facilityName": string or null,
  "permitNumber": string or null,
  "inspectionDate": string or null,
  "inspectorName": string or null,
  "weatherConditions": string or null,
  "rainEventDuringInspection": boolean or null,
  "overallStatus": "compliant" | "non-compliant" | "needs-attention",
  "bmpItems": [
    {
      "section": string,
      "description": string,
      "status": "pass" | "fail" | "na",
      "notes": string
    }
  ],
  "correctiveActions": [
    { "description": string, "dueDate": string, "completed": boolean }
  ],
  "summary": "2-3 sentence plain English summary of findings and urgent issues",
  "deadletter": {}
}

The "section" field in bmpItems must be one of:
"SWPPP and Site Map" | "Vehicle/Equipment - Cleaning" | "Vehicle/Equipment - Fueling" | "Vehicle/Equipment - Maintenance" | "Good Housekeeping" | "Spill Response and Equipment" | "General Material Storage" | "Storm Water BMPs and Treatment Structures" | "Observation of Storm Water Discharges" | "Miscellaneous"

For overallStatus: if any bmpItem has status "fail", use "non-compliant"; if all are "pass" or "na", use "compliant"; otherwise use "needs-attention".

Extract ALL checklist rows from every section of the form — list every BMP item as its own entry in bmpItems, even if no checkbox is marked (use "na" for unmarked rows). Never return an empty bmpItems array for a standard ISWGP form; the array should always reflect the full checklist structure. Put any text fields you cannot confidently assign to a field into "deadletter".

Return only valid JSON, no markdown, no explanation.`

const HINTS_INTRO = `\nThe user has manually verified the following field values from the form — use them directly instead of re-extracting:\n`

export async function POST(request: NextRequest) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[extract] ANTHROPIC_API_KEY is not set')
    return NextResponse.json({ error: 'Extraction service is not configured. Please contact support.' }, { status: 503 })
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  try {
    const { images, fieldHints } = await request.json() as { images: string[]; fieldHints?: Record<string, string> }

    if (!images?.length) {
      return NextResponse.json({ error: 'No images provided' }, { status: 400 })
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          // One image block per PDF page — Claude sees the fully rendered page
          // including annotation/form-field layers where X marks live
          ...images.map((img) => ({
            type: 'image' as const,
            source: { type: 'base64' as const, media_type: 'image/jpeg' as const, data: img },
          })),
          {
            type: 'text' as const,
            text: (() => {
              const filled = Object.entries(fieldHints ?? {}).filter(([, v]) => v?.trim())
              if (!filled.length) return PROMPT
              // k = field name (e.g. "facilityName"), v = user-verified value
              return PROMPT + HINTS_INTRO + filled.map(([k, v]) => `- ${k}: "${v}"`).join('\n')
            })(),
          },
        ],
      }],
    })

    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')
    const text = block.text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(text)
    return NextResponse.json(parsed)

  } catch (err) {
    console.error('[extract] error:', err)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}
