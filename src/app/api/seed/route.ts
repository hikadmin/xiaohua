import { db } from '@/lib/db'
import { NextResponse } from 'next/server'

// POST /api/seed - Seed initial data with current dates
export async function POST() {
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // Create default user profile if none exists
    let profile = await db.userProfile.findFirst()
    if (!profile) {
      profile = await db.userProfile.create({
        data: {
          name: 'Luna',
          cycleLength: 28,
          periodLength: 5,
          lastPeriodStart: todayStr,
        },
      })
    }

    // Create a recent period (started a few days ago)
    const periodStart = new Date(today)
    periodStart.setDate(today.getDate() - 2)
    const periodStartStr = periodStart.toISOString().split('T')[0]

    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodStart.getDate() + 4)
    const periodEndStr = periodEnd.toISOString().split('T')[0]

    const existingPeriod = await db.period.findFirst({
      where: { startDate: periodStartStr },
    })
    if (!existingPeriod) {
      await db.period.create({
        data: {
          startDate: periodStartStr,
          endDate: periodEndStr,
        },
      })
    }

    // Create a previous period (28 days before current)
    const prevStart = new Date(periodStart)
    prevStart.setDate(periodStart.getDate() - 28)
    const prevStartStr = prevStart.toISOString().split('T')[0]

    const prevEnd = new Date(prevStart)
    prevEnd.setDate(prevStart.getDate() + 4)
    const prevEndStr = prevEnd.toISOString().split('T')[0]

    const existingPrevPeriod = await db.period.findFirst({
      where: { startDate: prevStartStr },
    })
    if (!existingPrevPeriod) {
      await db.period.create({
        data: {
          startDate: prevStartStr,
          endDate: prevEndStr,
        },
      })
    }

    // Create one more period before that
    const prevPrevStart = new Date(prevStart)
    prevPrevStart.setDate(prevStart.getDate() - 27)
    const prevPrevStartStr = prevPrevStart.toISOString().split('T')[0]

    const prevPrevEnd = new Date(prevPrevStart)
    prevPrevEnd.setDate(prevPrevStart.getDate() + 5)
    const prevPrevEndStr = prevPrevEnd.toISOString().split('T')[0]

    const existingPrevPrevPeriod = await db.period.findFirst({
      where: { startDate: prevPrevStartStr },
    })
    if (!existingPrevPrevPeriod) {
      await db.period.create({
        data: {
          startDate: prevPrevStartStr,
          endDate: prevPrevEndStr,
        },
      })
    }

    // Create sample daily records with Chinese symptoms
    const day1 = new Date(periodStart)
    const day1Str = day1.toISOString().split('T')[0]

    const day2 = new Date(periodStart)
    day2.setDate(periodStart.getDate() + 1)
    const day2Str = day2.toISOString().split('T')[0]

    const sampleRecords = [
      {
        date: day1Str,
        flow: 2,
        mood: 3,
        symptoms: JSON.stringify(['痛经', '疲劳']),
        note: '经期第一天，注意保暖',
      },
      {
        date: day2Str,
        flow: 3,
        mood: 4,
        symptoms: JSON.stringify(['腰酸', '头痛']),
        note: '记得多喝热水',
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
