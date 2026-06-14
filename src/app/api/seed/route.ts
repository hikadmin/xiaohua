import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { success, serverError } from '@/lib/api/response'

// POST /api/seed - 初始化种子数据
export async function POST() {
  try {
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]

    // 创建默认用户资料
    let profile = await db.userProfile.findFirst()
    if (!profile) {
      profile = await db.userProfile.create({
        data: {
          name: '小桦',
          cycleLength: 28,
          periodLength: 5,
          lastPeriodStart: todayStr,
        },
      })
    }

    // 创建近期经期
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
        data: { startDate: periodStartStr, endDate: periodEndStr },
      })
    }

    // 创建上一个周期
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
        data: { startDate: prevStartStr, endDate: prevEndStr },
      })
    }

    // 创建更早的周期
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
        data: { startDate: prevPrevStartStr, endDate: prevPrevEndStr },
      })
    }

    // 创建示例每日记录
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

    // 创建默认设置
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

    return success({
      profile: '默认资料已创建',
      periods: '示例经期已创建',
      records: '示例记录已创建',
      settings: '默认设置已创建',
    }, '种子数据初始化成功')
  } catch (error) {
    console.error('Failed to seed data:', error)
    return serverError('初始化种子数据失败')
  }
}
