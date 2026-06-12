import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/records - Get all daily records ordered by date desc
export async function GET() {
  try {
    const records = await db.dailyRecord.findMany({
      orderBy: { date: 'desc' },
    })
    return NextResponse.json(records)
  } catch (error) {
    console.error('Failed to fetch daily records:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily records' },
      { status: 500 }
    )
  }
}

// POST /api/records - Create or update a daily record (upsert by date)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, flow, mood, symptoms, note } = body

    if (!date) {
      return NextResponse.json(
        { error: 'date is required' },
        { status: 400 }
      )
    }

    // Serialize symptoms to JSON string if it's an array
    const symptomsStr = Array.isArray(symptoms)
      ? JSON.stringify(symptoms)
      : typeof symptoms === 'string'
        ? symptoms
        : '[]'

    const record = await db.dailyRecord.upsert({
      where: { date },
      update: {
        ...(flow !== undefined && { flow }),
        ...(mood !== undefined && { mood }),
        ...(symptoms !== undefined && { symptoms: symptomsStr }),
        ...(note !== undefined && { note }),
      },
      create: {
        date,
        flow: flow ?? 0,
        mood: mood ?? 0,
        symptoms: symptomsStr,
        note: note ?? '',
      },
    })

    return NextResponse.json(record)
  } catch (error) {
    console.error('Failed to create/update daily record:', error)
    return NextResponse.json(
      { error: 'Failed to create/update daily record' },
      { status: 500 }
    )
  }
}
