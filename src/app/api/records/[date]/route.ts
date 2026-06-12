import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/records/[date] - Get a specific daily record by date
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params

    const record = await db.dailyRecord.findUnique({
      where: { date },
    })

    if (!record) {
      return NextResponse.json(
        { error: 'Daily record not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('Failed to fetch daily record:', error)
    return NextResponse.json(
      { error: 'Failed to fetch daily record' },
      { status: 500 }
    )
  }
}

// DELETE /api/records/[date] - Delete a daily record by date
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params

    const existing = await db.dailyRecord.findUnique({
      where: { date },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Daily record not found' },
        { status: 404 }
      )
    }

    await db.dailyRecord.delete({ where: { date } })

    return NextResponse.json({ message: 'Daily record deleted successfully' })
  } catch (error) {
    console.error('Failed to delete daily record:', error)
    return NextResponse.json(
      { error: 'Failed to delete daily record' },
      { status: 500 }
    )
  }
}
