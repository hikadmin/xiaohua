// ============ 后端业务逻辑：周期计算、统计、预测 ============
// 从前端迁移到后端，确保前后端逻辑一致

import { db } from '@/lib/db'

// ---- 日期工具 ----

export function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-')
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

export function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

export function daysBetween(d1: Date, d2: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// ---- 周期阶段计算 ----

export interface CycleInfoResult {
  phase: string
  phaseDay: number
  daysUntilNext: number
  cycleLength: number
  periodLength: number
  nextPeriodDate: string | null
  lastPeriodStart: string | null
}

export async function getCycleInfo(): Promise<CycleInfoResult> {
  const profile = await db.userProfile.findFirst()
  const cycleLength = profile?.cycleLength || 28
  const periodLength = profile?.periodLength || 5

  const periods = await db.period.findMany({
    orderBy: { startDate: 'desc' },
  })
  const lastPeriod = periods[0]

  if (!lastPeriod) {
    return {
      phase: 'follicular', phaseDay: 1, daysUntilNext: cycleLength,
      cycleLength, periodLength, nextPeriodDate: null, lastPeriodStart: null,
    }
  }

  const lastStart = parseDate(lastPeriod.startDate)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const daysSinceStart = daysBetween(lastStart, now)

  if (daysSinceStart < 0) {
    return {
      phase: 'follicular', phaseDay: 1, daysUntilNext: cycleLength,
      cycleLength, periodLength, nextPeriodDate: null, lastPeriodStart: lastPeriod.startDate,
    }
  }

  const dayInCycle = (daysSinceStart % cycleLength) + 1
  const nextPeriodDate = addDays(lastStart, cycleLength)
  const daysUntilNext = Math.max(0, daysBetween(now, nextPeriodDate))

  let phase: string
  if (dayInCycle <= periodLength) {
    phase = 'period'
  } else if (dayInCycle <= 13) {
    phase = 'follicular'
  } else if (dayInCycle <= 16) {
    phase = 'ovulation'
  } else {
    phase = 'luteal'
  }

  return {
    phase, phaseDay: dayInCycle, daysUntilNext,
    cycleLength, periodLength, nextPeriodDate: formatDateStr(nextPeriodDate), lastPeriodStart: lastPeriod.startDate,
  }
}

// ---- 经期预测 ----

export async function getPredictedPeriodDays(): Promise<string[]> {
  const profile = await db.userProfile.findFirst()
  const cycleLength = profile?.cycleLength || 28
  const periodLength = profile?.periodLength || 5

  const periods = await db.period.findMany({
    orderBy: { startDate: 'desc' },
  })
  const lastPeriod = periods[0]
  if (!lastPeriod || !lastPeriod.endDate) return []

  const lastEnd = parseDate(lastPeriod.endDate)
  const nextStart = addDays(lastEnd, cycleLength - periodLength + 1)
  const days: string[] = []
  for (let i = 0; i < periodLength; i++) {
    days.push(formatDateStr(addDays(nextStart, i)))
  }
  return days
}

// ---- 易孕期计算 ----

export async function getFertileDays(): Promise<string[]> {
  const profile = await db.userProfile.findFirst()
  const cycleLength = profile?.cycleLength || 28

  const periods = await db.period.findMany({
    orderBy: { startDate: 'desc' },
  })
  const lastPeriod = periods[0]
  if (!lastPeriod) return []

  const lastStart = parseDate(lastPeriod.startDate)
  const ovulationDay = addDays(lastStart, cycleLength - 14)
  const days: string[] = []
  for (let i = -4; i <= 1; i++) {
    days.push(formatDateStr(addDays(ovulationDay, i)))
  }
  return days
}

// ---- 周期统计 ----

export interface CycleStatsResult {
  avgCycle: number
  avgPeriod: number
  totalCycles: number
  cycleLengths: number[]
  periodLengths: number[]
  cycleRegularity: 'regular' | 'irregular' | 'insufficient_data'
  consecutiveRecordDays: number
}

export async function getCycleStats(): Promise<CycleStatsResult> {
  const profile = await db.userProfile.findFirst()
  const periods = await db.period.findMany({
    orderBy: { startDate: 'asc' },
  })
  const records = await db.dailyRecord.findMany({
    orderBy: { date: 'desc' },
  })

  const cycleLengths: number[] = []
  const periodLengths: number[] = []

  for (let i = 1; i < periods.length; i++) {
    if (periods[i].endDate) {
      const cycleLen = daysBetween(parseDate(periods[i - 1].startDate), parseDate(periods[i].startDate))
      if (cycleLen > 15 && cycleLen < 50) cycleLengths.push(cycleLen)
    }
    if (periods[i].endDate) {
      const periodLen = daysBetween(parseDate(periods[i].startDate), parseDate(periods[i].endDate!)) + 1
      if (periodLen > 0 && periodLen < 15) periodLengths.push(periodLen)
    }
  }

  const avgCycle = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : (profile?.cycleLength || 28)
  const avgPeriod = periodLengths.length > 0
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : (profile?.periodLength || 5)

  // 周期规律性判断
  let cycleRegularity: 'regular' | 'irregular' | 'insufficient_data' = 'insufficient_data'
  if (cycleLengths.length >= 3) {
    const stdDev = Math.sqrt(
      cycleLengths.reduce((sum, len) => sum + Math.pow(len - avgCycle, 2), 0) / cycleLengths.length
    )
    cycleRegularity = stdDev <= 4 ? 'regular' : 'irregular'
  }

  // 连续记录天数
  let consecutiveRecordDays = 0
  if (records.length > 0) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    for (let i = 0; i < 365; i++) {
      const checkDate = addDays(today, -i)
      const dateStr = formatDateStr(checkDate)
      if (records.some(r => r.date === dateStr)) {
        consecutiveRecordDays++
      } else {
        break
      }
    }
  }

  return {
    avgCycle,
    avgPeriod,
    totalCycles: periods.length,
    cycleLengths,
    periodLengths,
    cycleRegularity,
    consecutiveRecordDays,
  }
}

// ---- 日历生成 ----

export interface PeriodInfoResult {
  isPeriod: boolean
  isStart: boolean
  isEnd: boolean
  isActive: boolean
}

export interface CalendarDayResult {
  day: number
  dateStr: string
  isToday: boolean
  isOtherMonth: boolean
  periodInfo: PeriodInfoResult
  isPredicted: boolean
  isFertile: boolean
}

function getPeriodInfo(dateStr: string, periods: Array<{ startDate: string; endDate: string | null }>): PeriodInfoResult {
  let isPeriod = false
  let isStart = false
  let isEnd = false
  let isActive = false

  for (const period of periods) {
    if (period.startDate && !period.endDate) {
      if (dateStr === period.startDate) {
        isPeriod = true; isStart = true; isEnd = true; isActive = true;
        break
      }
      const startD = parseDate(period.startDate)
      const checkD = parseDate(dateStr)
      if (checkD > startD && checkD <= new Date()) {
        isPeriod = true;
        if (dateStr === period.startDate) isStart = true;
        isActive = true;
        break
      }
    } else if (period.startDate && period.endDate) {
      if (dateStr >= period.startDate && dateStr <= period.endDate) {
        isPeriod = true;
        if (dateStr === period.startDate) isStart = true;
        if (dateStr === period.endDate) isEnd = true;
        break
      }
    }
  }
  return { isPeriod, isStart, isEnd, isActive }
}

export async function generateCalendarDays(year: number, month: number): Promise<CalendarDayResult[]> {
  const periods = await db.period.findMany()
  const predictedDays = await getPredictedPeriodDays()
  const fertileDays = await getFertileDays()

  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)
  const startDayOfWeek = firstDay.getDay()
  const totalDays = lastDay.getDate()
  const todayStr = formatDateStr(new Date())

  const days: CalendarDayResult[] = []

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({
      day: 0, dateStr: '', isToday: false, isOtherMonth: true,
      periodInfo: { isPeriod: false, isStart: false, isEnd: false, isActive: false },
      isPredicted: false, isFertile: false,
    })
  }

  for (let day = 1; day <= totalDays; day++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const isToday = dateStr === todayStr
    const periodInfo = getPeriodInfo(dateStr, periods)
    const isPredicted = predictedDays.includes(dateStr) && !periodInfo.isPeriod
    const isFertile = fertileDays.includes(dateStr) && !periodInfo.isPeriod && !isPredicted

    days.push({ day, dateStr, isToday, isOtherMonth: false, periodInfo, isPredicted, isFertile })
  }

  return days
}
