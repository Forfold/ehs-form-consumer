import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY // never reaches the client
})

export async function POST(request: NextRequest) {
  try {
    const { base64, mediaType } = await request.json()

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: `This is an ISWGP (Industrial Stormwater General Permit) Monthly Inspection / Visual Evaluation Report.

CHECKBOX READING INSTRUCTIONS:
- Each checklist item has three circle columns: Yes, No, N/A
- A circle counts as SELECTED if it contains ANY of the following: a filled/solid circle (●), an X mark, a checkmark (✓ or √), a pen/pencil scribble, a dot, any handwritten mark, any darkening or ink inside the boundary, or any digital fill
- An EMPTY, HOLLOW, or OUTLINE-ONLY circle (○) with nothing inside = not selected
- When the form is handwritten or scanned, look for ink strokes, pen marks, or pencil marks inside each circle — even faint or imprecise marks count as selected
- Examine all three columns for each row before deciding; the marked column is the answer
- If no circle appears marked for a row, use "na"

TEXT READING INSTRUCTIONS:
- Text fields may be filled in with a computer/digital font, a typewriter, or handwriting
- For handwritten/scanned forms: read cursive and print handwriting carefully, including faint pencil marks, partial letters, or scratched-out corrections (use the most recent/legible version)
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

Extract ALL checklist rows from every section of the form. Put any text fields you cannot confidently assign to a field into "deadletter".

Return only valid JSON, no markdown, no explanation.`
          }
        ]
      }]
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