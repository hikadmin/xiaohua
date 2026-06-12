import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/settings - Get all settings
export async function GET() {
  try {
    const settings = await db.setting.findMany()
    return NextResponse.json(settings)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// PUT /api/settings - Update a setting (upsert by key)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key) {
      return NextResponse.json(
        { error: 'key is required' },
        { status: 400 }
      )
    }

    if (value === undefined) {
      return NextResponse.json(
        { error: 'value is required' },
        { status: 400 }
      )
    }

    const setting = await db.setting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json(setting)
  } catch (error) {
    console.error('Failed to update setting:', error)
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    )
  }
}
