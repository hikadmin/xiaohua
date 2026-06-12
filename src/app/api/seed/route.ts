import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST /api/seed - Seed initial data matching the prototype
export async function POST() {
  try {
    // Create default user profile if none exists
    const existingProfile = await db.userProfile.findFirst()
    if (!existingProfile) {
      await db.userProfile.create({
        data: {
          name: 'Luna',
          cycleLength: 28,
          periodLength: 5,
          lastPeriodStart: '2025-01-08',
        },
      })
    }

    // Create a sample period matching the prototype
    const existingPeriod = await db.period.findFirst({
      where: { startDate: '2025-01-08' },
    })
    if (!existingPeriod) {
      await db.period.create({
        data: {
          startDate: '2025-01-08',
          endDate: '2025-01-12',
        },
      })
    }

    // Create sample daily records matching the prototype
    const sampleRecords = [
      {
        date: '2025-01-15',
        flow: 2,
        mood: 2,
        symptoms: JSON.stringify(['痛经', '疲劳']),
        note: '今天感觉还可以',
      },
      {
        date: '2025-01-14',
        flow: 3,
        mood: 3,
        symptoms: JSON.stringify(['腰酸']),
        note: '记得多喝热水',
      },
      {
        date: '2025-01-13',
        flow: 1,
        mood: 4,
        symptoms: JSON.stringify(['头痛', '疲劳']),
        note: '',
      },
    ]

    for (const record of sampleRecords) {
      const existingRecord = await db.dailyRecord.findUnique({
        where: { date: record.date },
      })
      if (!existingRecord) {
        await db.dailyRecord.create({ data: record })
      }
    }

    // Create default settings
    const defaultSettings = [
      { key: 'period_reminder', value: 'true' },
      { key: 'record_reminder', value: 'true' },
      { key: 'ovulation_reminder', value: 'false' },
      { key: 'app_lock', value: 'true' },
      { key: 'dark_mode', value: 'true' },
    ]

    for (const setting of defaultSettings) {
      const existing = await db.setting.findUnique({
        where: { key: setting.key },
      })
      if (!existing) {
        await db.setting.create({ data: setting })
      }
    }

    return NextResponse.json({
      message: 'Seed data created successfully',
      data: {
        profile: 'Created default profile',
        periods: 'Created sample period records',
        records: 'Created sample daily records',
        settings: 'Created default settings',
      },
    })
  } catch (error) {
    console.error('Failed to seed data:', error)
    return NextResponse.json(
      { error: 'Failed to seed data' },
      { status: 500 }
    )
  }
}
