import { NextRequest, NextResponse } from 'next/server'
import { getHistory, insertHistory } from '@/lib/db'

export async function GET() {
  try {
    const rows = await getHistory()
    const items = rows.map((row) => ({
      id: String(row.id),
      facilityName: row.facility_name ?? null,
      fileName: row.file_name,
      processedAt: (row.processed_at as Date).toISOString(),
    }))
    return NextResponse.json(items)
  } catch (err) {
    console.error('[history] GET error:', err)
    return NextResponse.json([], { status: 200 }) // return empty rather than crashing UI
  }
}

export async function POST(request: NextRequest) {
  try {
    const { facilityName, fileName } = await request.json()
    const row = await insertHistory(facilityName ?? null, fileName)
    return NextResponse.json({
      id: String(row.id),
      facilityName: row.facility_name ?? null,
      fileName: row.file_name,
      processedAt: (row.processed_at as Date).toISOString(),
    })
  } catch (err) {
    console.error('[history] POST error:', err)
    return NextResponse.json({ error: 'Failed to save history' }, { status: 500 })
  }
}
