import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/periods - Get all periods ordered by startDate desc
export async function GET() {
  try {
    const periods = await db.period.findMany({
      orderBy: { startDate: 'desc' },
    })
    return NextResponse.json(periods)
  } catch (error) {
    console.error('Failed to fetch periods:', error)
    return NextResponse.json(
      { error: 'Failed to fetch periods' },
      { status: 500 }
    )
  }
}

// POST /api/periods - Create a new period
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { startDate, endDate } = body

    if (!startDate) {
      return NextResponse.json(
        { error: 'startDate is required' },
        { status: 400 }
      )
    }

    const period = await db.period.create({
      data: {
        startDate,
        endDate: endDate || null,
      },
    })

    return NextResponse.json(period, { status: 201 })
  } catch (error) {
    console.error('Failed to create period:', error)
    return NextResponse.json(
      { error: 'Failed to create period' },
      { status: 500 }
    )
  }
}
