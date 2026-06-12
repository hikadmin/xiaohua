import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// PUT /api/periods/[id] - Update a period
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { startDate, endDate } = body

    const existing = await db.period.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    const period = await db.period.update({
      where: { id },
      data: {
        ...(startDate !== undefined && { startDate }),
        ...(endDate !== undefined && { endDate }),
      },
    })

    return NextResponse.json(period)
  } catch (error) {
    console.error('Failed to update period:', error)
    return NextResponse.json(
      { error: 'Failed to update period' },
      { status: 500 }
    )
  }
}

// DELETE /api/periods/[id] - Delete a period
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.period.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Period not found' },
        { status: 404 }
      )
    }

    await db.period.delete({ where: { id } })

    return NextResponse.json({ message: 'Period deleted successfully' })
  } catch (error) {
    console.error('Failed to delete period:', error)
    return NextResponse.json(
      { error: 'Failed to delete period' },
      { status: 500 }
    )
  }
}
