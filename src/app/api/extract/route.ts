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
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: mediaType, data: base64 }
          },
          {
            type: 'text',
            text: `Extract this industrial stormwater inspection form into JSON with exactly this shape:
{
  "facilityName": string,
  "permitNumber": string,
  "inspectionDate": string,
  "inspectorName": string,
  "overallStatus": "compliant" | "non-compliant" | "needs-attention",
  "bmpItems": [
    { "description": string, "status": "pass" | "fail" | "na", "notes": string }
  ],
  "correctiveActions": [
    { "description": string, "dueDate": string, "completed": boolean }
  ],
  "summary": "2-3 sentence plain English summary of findings and urgent issues"
}
Return only valid JSON, no markdown, no explanation. Additionally return a deadletter object of missed or unprocessable strings.`
          }
        ]
      }]
    })

    const block = response.content[0]
    if (block.type !== 'text') throw new Error('Unexpected response type')
    const parsed = JSON.parse(block.text)
    return NextResponse.json(parsed)

  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 })
  }
}