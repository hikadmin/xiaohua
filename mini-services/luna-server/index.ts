// ============ 小桦 Period Tracker — Standalone Embedded HTTP Server ============
// Bundled with the Android APK, runs as a local HTTP server on the device.
// Uses bun:sqlite for persistence, serves all 21 API endpoints.

import { Database } from 'bun:sqlite'
import { mkdirSync } from 'fs'
import { dirname } from 'path'

// ============ Configuration ============

const PORT = parseInt(process.env.PORT || '3210', 10)
const DB_PATH = process.env.DB_PATH || './data/luna.db'

// Ensure DB directory exists
mkdirSync(dirname(DB_PATH), { recursive: true })

// ============ Database Setup ============

const db = new Database(DB_PATH, { create: true })

// Enable WAL mode for better concurrent read performance
db.run('PRAGMA journal_mode = WAL')

// Create tables on startup
db.run(`
  CREATE TABLE IF NOT EXISTS UserProfile (
    id TEXT PRIMARY KEY,
    name TEXT DEFAULT '小桦',
    avatar TEXT DEFAULT '',
    cycleLength INTEGER DEFAULT 28,
    periodLength INTEGER DEFAULT 5,
    lastPeriodStart TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )
`)
db.run(`
  CREATE TABLE IF NOT EXISTS Period (
    id TEXT PRIMARY KEY,
    startDate TEXT NOT NULL,
    endDate TEXT,
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )
`)
db.run(`
  CREATE TABLE IF NOT EXISTS DailyRecord (
    id TEXT PRIMARY KEY,
    date TEXT UNIQUE NOT NULL,
    flow INTEGER DEFAULT 0,
    mood INTEGER DEFAULT 0,
    symptoms TEXT DEFAULT '[]',
    note TEXT DEFAULT '',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )
`)
db.run(`
  CREATE TABLE IF NOT EXISTS Setting (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    value TEXT DEFAULT ''
  )
`)
db.run(`
  CREATE TABLE IF NOT EXISTS Feedback (
    id TEXT PRIMARY KEY,
    category TEXT DEFAULT '其他',
    content TEXT NOT NULL,
    contact TEXT DEFAULT '',
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT (datetime('now')),
    updatedAt TEXT DEFAULT (datetime('now'))
  )
`)

// ============ ID Generation ============

function generateId(): string {
  return crypto.randomUUID()
}

// ============ Unified Response Format ============

interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  error: string | null
  message: string | null
  timestamp: string
}

function jsonResponse<T>(
  success: boolean,
  data: T | null = null,
  error: string | null = null,
  message: string | null = null,
  status: number = 200
): Response {
  const body: ApiResponse<T> = {
    success,
    data,
    error,
    message,
    timestamp: new Date().toISOString(),
  }
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}

function success<T>(data: T, message?: string) {
  return jsonResponse(true, data, null, message ?? null, 200)
}

function created<T>(data: T, message?: string) {
  return jsonResponse(true, data, null, message ?? '创建成功', 201)
}

function ok(message?: string) {
  return jsonResponse(true, null, null, message ?? '操作成功', 200)
}

function badRequest(error: string) {
  return jsonResponse(false, null, error, null, 400)
}

function notFound(error: string = '资源不存在') {
  return jsonResponse(false, null, error, null, 404)
}

function serverError(error: string = '服务器内部错误') {
  return jsonResponse(false, null, error, null, 500)
}

// ============ Validation Helpers ============

function validateRequired(body: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `缺少必填字段: ${field}`
    }
  }
  return null
}

function validateDateStr(value: string, fieldName: string = 'date'): string | null {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(value)) {
    return `${fieldName} 格式不正确，应为 YYYY-MM-DD`
  }
  const [y, m, d] = value.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) {
    return `${fieldName} 不是有效日期: ${value}`
  }
  return null
}

function validateIntRange(value: number, min: number, max: number, fieldName: string): string | null {
  if (!Number.isInteger(value)) {
    return `${fieldName} 必须是整数`
  }
  if (value < min || value > max) {
    return `${fieldName} 必须在 ${min}-${max} 之间`
  }
  return null
}

function validateStringLength(value: string, maxLen: number, fieldName: string): string | null {
  if (value.length > maxLen) {
    return `${fieldName} 长度不能超过 ${maxLen} 个字符`
  }
  return null
}

async function parseRequestBody(request: Request): Promise<{ data: Record<string, unknown> | null; error: Response | null }> {
  try {
    const data = await request.json()
    return { data, error: null }
  } catch {
    return { data: null, error: badRequest('请求体格式错误，应为有效JSON') }
  }
}

// ============ Date Utilities ============

function parseDate(dateStr: string): Date {
  const parts = dateStr.split('-')
  return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]))
}

function formatDateStr(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function daysBetween(d1: Date, d2: Date): number {
  return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24))
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

// ============ Daily Tips ============

const DAILY_TIPS: Record<string, string[]> = {
  period: [
    '🧣 今天适合穿暖色衣服，给自己温暖的呵护',
    '🍵 喝一杯红糖姜茶，温暖整个身体',
    '🛁 温水泡脚15分钟，缓解经期不适',
    '😴 早睡1小时，让身体充分休息',
    '🧘 轻柔的冥想呼吸，帮助放松身心',
  ],
  follicular: [
    '🏃 今天精力充沛，适合进行高强度运动',
    '🎨 创造力高峰期，尝试新的创意活动',
    '🥗 多吃富含铁质的食物，补充流失营养',
    '💪 体力和耐力提升，挑战新的运动目标',
    '📚 学习效率最佳，适合阅读和思考',
  ],
  ovulation: [
    '✨ 社交能力最佳，适合与朋友聚会',
    '💝 自信魅力高峰，适合重要约会和演讲',
    '🥑 补充健康脂肪，维持激素平衡',
    '🎯 注意力集中，处理重要工作',
    '🌟 魅力四射的一天，展现最好的自己',
  ],
  luteal: [
    '🧘 瑜伽和拉伸运动，缓解身体不适',
    '🍫 适量吃些黑巧克力，提升心情',
    '📝 记录情绪变化，更好地了解自己',
    '🎵 听舒缓的音乐，放松紧张情绪',
    '🌿 补充镁和维生素B6，稳定情绪',
  ],
}

const FLOW_LABELS = ['', '点滴', '少量', '中等', '大量']
const MOOD_LABELS = ['', '开心', '平静', '低落', '烦躁', '焦虑']
const FEEDBACK_CATEGORIES = ['功能建议', '问题反馈', '体验优化', '其他']

// ============ Cycle Calculation Logic ============

interface CycleInfoResult {
  phase: string
  phaseDay: number
  daysUntilNext: number
  cycleLength: number
  periodLength: number
  nextPeriodDate: string | null
  lastPeriodStart: string | null
}

function getCycleInfo(): CycleInfoResult {
  const profile = db.query('SELECT * FROM UserProfile LIMIT 1').get() as any
  const cycleLength = profile?.cycleLength || 28
  const periodLength = profile?.periodLength || 5

  const periods = db.query('SELECT * FROM Period ORDER BY startDate DESC').all() as any[]
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

function getPredictedPeriodDays(): string[] {
  const profile = db.query('SELECT * FROM UserProfile LIMIT 1').get() as any
  const cycleLength = profile?.cycleLength || 28
  const periodLength = profile?.periodLength || 5

  const periods = db.query('SELECT * FROM Period ORDER BY startDate DESC').all() as any[]
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

function getFertileDays(): string[] {
  const profile = db.query('SELECT * FROM UserProfile LIMIT 1').get() as any
  const cycleLength = profile?.cycleLength || 28

  const periods = db.query('SELECT * FROM Period ORDER BY startDate DESC').all() as any[]
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

interface CycleStatsResult {
  avgCycle: number
  avgPeriod: number
  totalCycles: number
  cycleLengths: number[]
  periodLengths: number[]
  cycleRegularity: 'regular' | 'irregular' | 'insufficient_data'
  consecutiveRecordDays: number
}

function getCycleStats(): CycleStatsResult {
  const profile = db.query('SELECT * FROM UserProfile LIMIT 1').get() as any
  const periods = db.query('SELECT * FROM Period ORDER BY startDate ASC').all() as any[]
  const records = db.query('SELECT * FROM DailyRecord ORDER BY date DESC').all() as any[]

  const cycleLengths: number[] = []
  const periodLengths: number[] = []

  for (let i = 1; i < periods.length; i++) {
    if (periods[i].endDate) {
      const cycleLen = daysBetween(parseDate(periods[i - 1].startDate), parseDate(periods[i].startDate))
      if (cycleLen > 15 && cycleLen < 50) cycleLengths.push(cycleLen)
    }
    if (periods[i].endDate) {
      const periodLen = daysBetween(parseDate(periods[i].startDate), parseDate(periods[i].endDate)) + 1
      if (periodLen > 0 && periodLen < 15) periodLengths.push(periodLen)
    }
  }

  const avgCycle = cycleLengths.length > 0
    ? Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length)
    : (profile?.cycleLength || 28)
  const avgPeriod = periodLengths.length > 0
    ? Math.round(periodLengths.reduce((a, b) => a + b, 0) / periodLengths.length)
    : (profile?.periodLength || 5)

  // Cycle regularity
  let cycleRegularity: 'regular' | 'irregular' | 'insufficient_data' = 'insufficient_data'
  if (cycleLengths.length >= 3) {
    const stdDev = Math.sqrt(
      cycleLengths.reduce((sum, len) => sum + Math.pow(len - avgCycle, 2), 0) / cycleLengths.length
    )
    cycleRegularity = stdDev <= 4 ? 'regular' : 'irregular'
  }

  // Consecutive record days
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

interface PeriodInfoResult {
  isPeriod: boolean
  isStart: boolean
  isEnd: boolean
  isActive: boolean
}

interface CalendarDayResult {
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

function generateCalendarDays(year: number, month: number): CalendarDayResult[] {
  const periods = db.query('SELECT * FROM Period').all() as any[]
  const predictedDays = getPredictedPeriodDays()
  const fertileDays = getFertileDays()

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

// ============ Route Handlers ============

// --- Periods ---

function getPeriods(): Response {
  try {
    const periods = db.query('SELECT * FROM Period ORDER BY startDate DESC').all()
    return success(periods)
  } catch (error) {
    console.error('Failed to fetch periods:', error)
    return serverError('获取经期记录失败')
  }
}

function createPeriod(body: Record<string, unknown>): Response {
  try {
    const requiredError = validateRequired(body, ['startDate'])
    if (requiredError) return badRequest(requiredError)

    const dateError = validateDateStr(body.startDate as string, 'startDate')
    if (dateError) return badRequest(dateError)

    if (body.endDate) {
      const endDateError = validateDateStr(body.endDate as string, 'endDate')
      if (endDateError) return badRequest(endDateError)

      if ((body.endDate as string) < (body.startDate as string)) {
        return badRequest('结束日期不能早于开始日期')
      }
    }

    const id = generateId()
    const now = new Date().toISOString()
    db.run(
      'INSERT INTO Period (id, startDate, endDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
      [id, body.startDate as string, (body.endDate as string) || null, now, now]
    )

    const period = db.query('SELECT * FROM Period WHERE id = ?').get(id)
    return created(period, '经期记录创建成功')
  } catch (error) {
    console.error('Failed to create period:', error)
    return serverError('创建经期记录失败')
  }
}

function updatePeriod(id: string, body: Record<string, unknown>): Response {
  try {
    const existing = db.query('SELECT * FROM Period WHERE id = ?').get(id) as any
    if (!existing) return notFound('经期记录不存在')

    if (body.startDate !== undefined) {
      const dateError = validateDateStr(body.startDate as string, 'startDate')
      if (dateError) return badRequest(dateError)
    }
    if (body.endDate !== undefined && body.endDate !== null) {
      const dateError = validateDateStr(body.endDate as string, 'endDate')
      if (dateError) return badRequest(dateError)
    }

    const now = new Date().toISOString()
    const updates: string[] = []
    const values: any[] = []

    if (body.startDate !== undefined) { updates.push('startDate = ?'); values.push(body.startDate) }
    if (body.endDate !== undefined) { updates.push('endDate = ?'); values.push(body.endDate as string | null) }
    updates.push('updatedAt = ?'); values.push(now)
    values.push(id)

    db.run(`UPDATE Period SET ${updates.join(', ')} WHERE id = ?`, values)

    const period = db.query('SELECT * FROM Period WHERE id = ?').get(id)
    return success(period, '经期记录更新成功')
  } catch (error) {
    console.error('Failed to update period:', error)
    return serverError('更新经期记录失败')
  }
}

function deletePeriod(id: string): Response {
  try {
    const existing = db.query('SELECT * FROM Period WHERE id = ?').get(id)
    if (!existing) return notFound('经期记录不存在')

    db.run('DELETE FROM Period WHERE id = ?', [id])
    return ok('经期记录删除成功')
  } catch (error) {
    console.error('Failed to delete period:', error)
    return serverError('删除经期记录失败')
  }
}

// --- Records ---

function getRecords(): Response {
  try {
    const records = db.query('SELECT * FROM DailyRecord ORDER BY date DESC').all()
    return success(records)
  } catch (error) {
    console.error('Failed to fetch daily records:', error)
    return serverError('获取每日记录失败')
  }
}

function upsertRecord(body: Record<string, unknown>): Response {
  try {
    const requiredError = validateRequired(body, ['date'])
    if (requiredError) return badRequest(requiredError)

    const dateError = validateDateStr(body.date as string, 'date')
    if (dateError) return badRequest(dateError)

    if (body.flow !== undefined) {
      const flowError = validateIntRange(body.flow as number, 0, 4, 'flow')
      if (flowError) return badRequest(flowError)
    }

    if (body.mood !== undefined) {
      const moodError = validateIntRange(body.mood as number, 0, 5, 'mood')
      if (moodError) return badRequest(moodError)
    }

    // Serialize symptoms
    let symptomsStr = '[]'
    if (body.symptoms !== undefined) {
      if (Array.isArray(body.symptoms)) {
        symptomsStr = JSON.stringify(body.symptoms)
      } else if (typeof body.symptoms === 'string') {
        symptomsStr = body.symptoms
      }
    }

    const now = new Date().toISOString()
    const existing = db.query('SELECT * FROM DailyRecord WHERE date = ?').get(body.date as string) as any

    if (existing) {
      // Update
      const updates: string[] = []
      const values: any[] = []

      if (body.flow !== undefined) { updates.push('flow = ?'); values.push(body.flow as number) }
      if (body.mood !== undefined) { updates.push('mood = ?'); values.push(body.mood as number) }
      if (body.symptoms !== undefined) { updates.push('symptoms = ?'); values.push(symptomsStr) }
      if (body.note !== undefined) { updates.push('note = ?'); values.push(body.note as string) }
      updates.push('updatedAt = ?'); values.push(now)
      values.push(body.date as string)

      db.run(`UPDATE DailyRecord SET ${updates.join(', ')} WHERE date = ?`, values)
      const record = db.query('SELECT * FROM DailyRecord WHERE date = ?').get(body.date as string)
      return created(record, '每日记录保存成功')
    } else {
      // Create
      const id = generateId()
      db.run(
        'INSERT INTO DailyRecord (id, date, flow, mood, symptoms, note, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, body.date as string, (body.flow as number) ?? 0, (body.mood as number) ?? 0, symptomsStr, (body.note as string) ?? '', now, now]
      )
      const record = db.query('SELECT * FROM DailyRecord WHERE id = ?').get(id)
      return created(record, '每日记录保存成功')
    }
  } catch (error) {
    console.error('Failed to create/update daily record:', error)
    return serverError('保存每日记录失败')
  }
}

function getRecordByDate(date: string): Response {
  try {
    const dateError = validateDateStr(date, 'date')
    if (dateError) return badRequest(dateError)

    const record = db.query('SELECT * FROM DailyRecord WHERE date = ?').get(date)
    if (!record) return notFound('该日期暂无记录')

    return success(record)
  } catch (error) {
    console.error('Failed to fetch daily record:', error)
    return serverError('获取每日记录失败')
  }
}

function updateRecordByDate(date: string, body: Record<string, unknown>): Response {
  try {
    const dateError = validateDateStr(date, 'date')
    if (dateError) return badRequest(dateError)

    const existing = db.query('SELECT * FROM DailyRecord WHERE date = ?').get(date) as any
    if (!existing) return notFound('该日期暂无记录，请使用 POST 创建')

    if (body.flow !== undefined) {
      const flowError = validateIntRange(body.flow as number, 0, 4, 'flow')
      if (flowError) return badRequest(flowError)
    }
    if (body.mood !== undefined) {
      const moodError = validateIntRange(body.mood as number, 0, 5, 'mood')
      if (moodError) return badRequest(moodError)
    }

    // Serialize symptoms
    let symptomsStr: string | undefined
    if (body.symptoms !== undefined) {
      symptomsStr = Array.isArray(body.symptoms)
        ? JSON.stringify(body.symptoms)
        : typeof body.symptoms === 'string' ? body.symptoms : '[]'
    }

    const now = new Date().toISOString()
    const updates: string[] = []
    const values: any[] = []

    if (body.flow !== undefined) { updates.push('flow = ?'); values.push(body.flow as number) }
    if (body.mood !== undefined) { updates.push('mood = ?'); values.push(body.mood as number) }
    if (symptomsStr !== undefined) { updates.push('symptoms = ?'); values.push(symptomsStr) }
    if (body.note !== undefined) { updates.push('note = ?'); values.push(body.note as string) }
    updates.push('updatedAt = ?'); values.push(now)
    values.push(date)

    db.run(`UPDATE DailyRecord SET ${updates.join(', ')} WHERE date = ?`, values)
    const record = db.query('SELECT * FROM DailyRecord WHERE date = ?').get(date)
    return success(record, '记录更新成功')
  } catch (error) {
    console.error('Failed to update daily record:', error)
    return serverError('更新每日记录失败')
  }
}

function deleteRecordByDate(date: string): Response {
  try {
    const dateError = validateDateStr(date, 'date')
    if (dateError) return badRequest(dateError)

    const existing = db.query('SELECT * FROM DailyRecord WHERE date = ?').get(date)
    if (!existing) return notFound('该日期暂无记录')

    db.run('DELETE FROM DailyRecord WHERE date = ?', [date])
    return ok('记录删除成功')
  } catch (error) {
    console.error('Failed to delete daily record:', error)
    return serverError('删除每日记录失败')
  }
}

// --- Profile ---

function getProfile(): Response {
  try {
    let profile = db.query('SELECT * FROM UserProfile LIMIT 1').get() as any

    if (!profile) {
      const id = generateId()
      const now = new Date().toISOString()
      db.run(
        'INSERT INTO UserProfile (id, name, avatar, cycleLength, periodLength, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [id, '小桦', '', 28, 5, now, now]
      )
      profile = db.query('SELECT * FROM UserProfile WHERE id = ?').get(id)
    }

    return success(profile)
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return serverError('获取用户资料失败')
  }
}

function updateProfile(body: Record<string, unknown>): Response {
  try {
    if (body.name !== undefined) {
      if (typeof body.name !== 'string') return badRequest('name 必须为字符串')
      const nameError = validateStringLength(body.name as string, 20, 'name')
      if (nameError) return badRequest(nameError)
    }

    if (body.cycleLength !== undefined) {
      const cycleError = validateIntRange(body.cycleLength as number, 15, 50, 'cycleLength')
      if (cycleError) return badRequest(cycleError)
    }

    if (body.periodLength !== undefined) {
      const periodError = validateIntRange(body.periodLength as number, 1, 14, 'periodLength')
      if (periodError) return badRequest(periodError)
    }

    if (body.lastPeriodStart !== undefined && body.lastPeriodStart !== null) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(body.lastPeriodStart as string)) {
        return badRequest('lastPeriodStart 格式不正确')
      }
    }

    let profile = db.query('SELECT * FROM UserProfile LIMIT 1').get() as any

    if (!profile) {
      const id = generateId()
      const now = new Date().toISOString()
      db.run(
        'INSERT INTO UserProfile (id, name, avatar, cycleLength, periodLength, lastPeriodStart, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, (body.name as string) ?? '小桦', (body.avatar as string) ?? '', (body.cycleLength as number) ?? 28, (body.periodLength as number) ?? 5, (body.lastPeriodStart as string) ?? null, now, now]
      )
      profile = db.query('SELECT * FROM UserProfile WHERE id = ?').get(id)
      return created(profile, '用户资料创建成功')
    } else {
      const now = new Date().toISOString()
      const updates: string[] = []
      const values: any[] = []

      if (body.name !== undefined) { updates.push('name = ?'); values.push(body.name) }
      if (body.avatar !== undefined) { updates.push('avatar = ?'); values.push(body.avatar) }
      if (body.cycleLength !== undefined) { updates.push('cycleLength = ?'); values.push(body.cycleLength) }
      if (body.periodLength !== undefined) { updates.push('periodLength = ?'); values.push(body.periodLength) }
      if (body.lastPeriodStart !== undefined) { updates.push('lastPeriodStart = ?'); values.push(body.lastPeriodStart as string | null) }
      updates.push('updatedAt = ?'); values.push(now)
      values.push(profile.id)

      db.run(`UPDATE UserProfile SET ${updates.join(', ')} WHERE id = ?`, values)
      profile = db.query('SELECT * FROM UserProfile WHERE id = ?').get(profile.id)
      return success(profile, '用户资料更新成功')
    }
  } catch (error) {
    console.error('Failed to update profile:', error)
    return serverError('更新用户资料失败')
  }
}

// --- Settings ---

function getSettings(): Response {
  try {
    const settings = db.query('SELECT * FROM Setting').all()
    return success(settings)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return serverError('获取设置失败')
  }
}

function upsertSetting(body: Record<string, unknown>): Response {
  try {
    const requiredError = validateRequired(body, ['key', 'value'])
    if (requiredError) return badRequest(requiredError)

    const existing = db.query('SELECT * FROM Setting WHERE key = ?').get(body.key as string) as any

    if (existing) {
      db.run('UPDATE Setting SET value = ? WHERE key = ?', [body.value as string, body.key as string])
      const setting = db.query('SELECT * FROM Setting WHERE key = ?').get(body.key as string)
      return success(setting, '设置更新成功')
    } else {
      const id = generateId()
      db.run('INSERT INTO Setting (id, key, value) VALUES (?, ?, ?)', [id, body.key as string, body.value as string])
      const setting = db.query('SELECT * FROM Setting WHERE id = ?').get(id)
      return success(setting, '设置更新成功')
    }
  } catch (error) {
    console.error('Failed to update setting:', error)
    return serverError('更新设置失败')
  }
}

function batchUpdateSettings(body: Record<string, unknown>): Response {
  try {
    if (!body.settings || !Array.isArray(body.settings)) {
      return badRequest('settings 必须是数组')
    }

    let count = 0
    for (const item of body.settings as Array<{ key: string; value: string }>) {
      if (!item.key || item.value === undefined) {
        return badRequest(`设置项缺少 key 或 value: ${JSON.stringify(item)}`)
      }
      const existing = db.query('SELECT * FROM Setting WHERE key = ?').get(item.key) as any
      if (existing) {
        db.run('UPDATE Setting SET value = ? WHERE key = ?', [item.value, item.key])
      } else {
        const id = generateId()
        db.run('INSERT INTO Setting (id, key, value) VALUES (?, ?, ?)', [id, item.key, item.value])
      }
      count++
    }

    return ok(`成功更新 ${count} 项设置`)
  } catch (error) {
    console.error('Failed to batch update settings:', error)
    return serverError('批量更新设置失败')
  }
}

// --- Feedback ---

function getFeedback(): Response {
  try {
    const feedbacks = db.query('SELECT * FROM Feedback ORDER BY createdAt DESC').all()
    return success(feedbacks)
  } catch (error) {
    console.error('Failed to fetch feedback:', error)
    return serverError('获取反馈列表失败')
  }
}

function createFeedback(body: Record<string, unknown>): Response {
  try {
    const requiredError = validateRequired(body, ['content'])
    if (requiredError) return badRequest(requiredError)

    const contentError = validateStringLength((body.content as string).trim(), 500, 'content')
    if (contentError) return badRequest(contentError)

    if (body.contact) {
      const contactError = validateStringLength(body.contact as string, 100, 'contact')
      if (contactError) return badRequest(contactError)
    }

    const validCategories = FEEDBACK_CATEGORIES
    const category = validCategories.includes(body.category as string) ? body.category : '其他'

    const id = generateId()
    const now = new Date().toISOString()
    db.run(
      'INSERT INTO Feedback (id, category, content, contact, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, category as string, (body.content as string).trim(), (body.contact as string)?.trim() || '', 'pending', now, now]
    )

    const feedback = db.query('SELECT * FROM Feedback WHERE id = ?').get(id)
    return created(feedback, '反馈提交成功，感谢您的意见！')
  } catch (error) {
    console.error('Failed to create feedback:', error)
    return serverError('提交反馈失败')
  }
}

// --- Stats ---

function getStats(): Response {
  try {
    const stats = getCycleStats()
    return success(stats)
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return serverError('获取统计数据失败')
  }
}

// --- Dashboard ---

function getDashboard(): Response {
  try {
    const cycleInfo = getCycleInfo()
    const cycleStats = getCycleStats()

    // Recent 3 records
    const recentRecords = db.query('SELECT * FROM DailyRecord ORDER BY date DESC LIMIT 3').all()

    // Daily tip
    const phaseTips = DAILY_TIPS[cycleInfo.phase] || DAILY_TIPS.follicular
    const t = new Date()
    const tipIndex = (t.getFullYear() * 366 + t.getMonth() * 31 + t.getDate()) % 5

    return success({
      cycleInfo,
      cycleStats,
      recentRecords,
      dailyTip: {
        phase: cycleInfo.phase,
        tip: phaseTips[tipIndex],
        index: tipIndex,
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard:', error)
    return serverError('获取仪表盘数据失败')
  }
}

// --- Calendar ---

function getCalendar(url: URL): Response {
  try {
    const yearStr = url.searchParams.get('year')
    const monthStr = url.searchParams.get('month')

    if (!yearStr || !monthStr) {
      return badRequest('缺少 year 或 month 参数')
    }

    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return badRequest('year 或 month 参数不合法')
    }

    const days = generateCalendarDays(year, month)

    // Period history
    const periods = db.query('SELECT * FROM Period ORDER BY startDate DESC LIMIT 5').all() as any[]

    const periodHistory = periods.map(p => {
      const endDate = p.endDate ? new Date(p.endDate) : null
      const startDate = new Date(p.startDate)
      const length = endDate
        ? Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        : '进行中'
      return {
        id: p.id,
        startDate: p.startDate,
        endDate: p.endDate,
        length,
      }
    })

    return success({
      year,
      month,
      days,
      periodHistory,
    })
  } catch (error) {
    console.error('Failed to fetch calendar:', error)
    return serverError('获取日历数据失败')
  }
}

// --- Export ---

function exportData(): Response {
  try {
    const records = db.query('SELECT * FROM DailyRecord ORDER BY date DESC').all() as any[]
    const periods = db.query('SELECT * FROM Period ORDER BY startDate DESC').all() as any[]
    const profile = db.query('SELECT * FROM UserProfile LIMIT 1').get() as any

    // CSV format
    const csvHeaders = ['日期', '流量', '情绪', '症状', '备注']
    const csvRows = records.map(r => {
      const symptoms = JSON.parse(r.symptoms || '[]')
      return [
        r.date,
        FLOW_LABELS[r.flow] || '',
        MOOD_LABELS[r.mood] || '',
        symptoms.join(';'),
        `"${(r.note || '').replace(/"/g, '""')}"`,
      ]
    })
    const csvContent = [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n')

    return success({
      records,
      periods,
      profile,
      csvContent,
      exportedAt: formatDateStr(new Date()),
    })
  } catch (error) {
    console.error('Failed to export data:', error)
    return serverError('导出数据失败')
  }
}

// --- Seed ---

function seedData(): Response {
  try {
    const today = new Date()
    const todayStr = formatDateStr(today)

    // Create default profile
    let profile = db.query('SELECT * FROM UserProfile LIMIT 1').get() as any
    if (!profile) {
      const id = generateId()
      const now = new Date().toISOString()
      db.run(
        'INSERT INTO UserProfile (id, name, avatar, cycleLength, periodLength, lastPeriodStart, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [id, '小桦', '', 28, 5, todayStr, now, now]
      )
      profile = db.query('SELECT * FROM UserProfile WHERE id = ?').get(id)
    }

    // Create recent period
    const periodStart = new Date(today)
    periodStart.setDate(today.getDate() - 2)
    const periodStartStr = formatDateStr(periodStart)

    const periodEnd = new Date(periodStart)
    periodEnd.setDate(periodStart.getDate() + 4)
    const periodEndStr = formatDateStr(periodEnd)

    const existingPeriod = db.query('SELECT * FROM Period WHERE startDate = ?').get(periodStartStr) as any
    if (!existingPeriod) {
      const id = generateId()
      const now = new Date().toISOString()
      db.run(
        'INSERT INTO Period (id, startDate, endDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [id, periodStartStr, periodEndStr, now, now]
      )
    }

    // Create previous cycle
    const prevStart = new Date(periodStart)
    prevStart.setDate(periodStart.getDate() - 28)
    const prevStartStr = formatDateStr(prevStart)

    const prevEnd = new Date(prevStart)
    prevEnd.setDate(prevStart.getDate() + 4)
    const prevEndStr = formatDateStr(prevEnd)

    const existingPrevPeriod = db.query('SELECT * FROM Period WHERE startDate = ?').get(prevStartStr) as any
    if (!existingPrevPeriod) {
      const id = generateId()
      const now = new Date().toISOString()
      db.run(
        'INSERT INTO Period (id, startDate, endDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [id, prevStartStr, prevEndStr, now, now]
      )
    }

    // Create earlier cycle
    const prevPrevStart = new Date(prevStart)
    prevPrevStart.setDate(prevStart.getDate() - 27)
    const prevPrevStartStr = formatDateStr(prevPrevStart)

    const prevPrevEnd = new Date(prevPrevStart)
    prevPrevEnd.setDate(prevPrevStart.getDate() + 5)
    const prevPrevEndStr = formatDateStr(prevPrevEnd)

    const existingPrevPrevPeriod = db.query('SELECT * FROM Period WHERE startDate = ?').get(prevPrevStartStr) as any
    if (!existingPrevPrevPeriod) {
      const id = generateId()
      const now = new Date().toISOString()
      db.run(
        'INSERT INTO Period (id, startDate, endDate, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
        [id, prevPrevStartStr, prevPrevEndStr, now, now]
      )
    }

    // Create sample daily records
    const day1Str = formatDateStr(periodStart)
    const day2 = new Date(periodStart)
    day2.setDate(periodStart.getDate() + 1)
    const day2Str = formatDateStr(day2)

    const sampleRecords = [
      { date: day1Str, flow: 2, mood: 3, symptoms: JSON.stringify(['痛经', '疲劳']), note: '经期第一天，注意保暖' },
      { date: day2Str, flow: 3, mood: 4, symptoms: JSON.stringify(['腰酸', '头痛']), note: '记得多喝热水' },
    ]

    for (const record of sampleRecords) {
      const existingRecord = db.query('SELECT * FROM DailyRecord WHERE date = ?').get(record.date) as any
      if (!existingRecord) {
        const id = generateId()
        const now = new Date().toISOString()
        db.run(
          'INSERT INTO DailyRecord (id, date, flow, mood, symptoms, note, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [id, record.date, record.flow, record.mood, record.symptoms, record.note, now, now]
        )
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
      const existing = db.query('SELECT * FROM Setting WHERE key = ?').get(setting.key) as any
      if (!existing) {
        const id = generateId()
        db.run('INSERT INTO Setting (id, key, value) VALUES (?, ?, ?)', [id, setting.key, setting.value])
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

// ============ Router ============

function corsHeaders(): HeadersInit {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  }
}

async function handleRequest(request: Request): Promise<Response> {
  const url = new URL(request.url)
  const path = url.pathname
  const method = request.method

  // Handle CORS preflight
  if (method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  try {
    // ============ Periods ============
    if (path === '/api/periods' && method === 'GET') {
      return getPeriods()
    }
    if (path === '/api/periods' && method === 'POST') {
      const { data, error } = await parseRequestBody(request)
      if (error) return error
      return createPeriod(data!)
    }
    // PUT /api/periods/:id or DELETE /api/periods/:id
    const periodIdMatch = path.match(/^\/api\/periods\/([^/]+)$/)
    if (periodIdMatch) {
      const id = periodIdMatch[1]
      if (method === 'PUT') {
        const { data, error } = await parseRequestBody(request)
        if (error) return error
        return updatePeriod(id, data!)
      }
      if (method === 'DELETE') {
        return deletePeriod(id)
      }
    }

    // ============ Records ============
    if (path === '/api/records' && method === 'GET') {
      return getRecords()
    }
    if (path === '/api/records' && method === 'POST') {
      const { data, error } = await parseRequestBody(request)
      if (error) return error
      return upsertRecord(data!)
    }
    // /api/records/:date
    const recordDateMatch = path.match(/^\/api\/records\/([^/]+)$/)
    if (recordDateMatch) {
      const date = recordDateMatch[1]
      if (method === 'GET') {
        return getRecordByDate(date)
      }
      if (method === 'PUT') {
        const { data, error } = await parseRequestBody(request)
        if (error) return error
        return updateRecordByDate(date, data!)
      }
      if (method === 'DELETE') {
        return deleteRecordByDate(date)
      }
    }

    // ============ Profile ============
    if (path === '/api/profile' && method === 'GET') {
      return getProfile()
    }
    if (path === '/api/profile' && method === 'PUT') {
      const { data, error } = await parseRequestBody(request)
      if (error) return error
      return updateProfile(data!)
    }

    // ============ Settings ============
    if (path === '/api/settings' && method === 'GET') {
      return getSettings()
    }
    if (path === '/api/settings' && method === 'PUT') {
      const { data, error } = await parseRequestBody(request)
      if (error) return error
      return upsertSetting(data!)
    }
    if (path === '/api/settings' && method === 'POST') {
      const { data, error } = await parseRequestBody(request)
      if (error) return error
      return batchUpdateSettings(data!)
    }

    // ============ Feedback ============
    if (path === '/api/feedback' && method === 'GET') {
      return getFeedback()
    }
    if (path === '/api/feedback' && method === 'POST') {
      const { data, error } = await parseRequestBody(request)
      if (error) return error
      return createFeedback(data!)
    }

    // ============ Stats ============
    if (path === '/api/stats' && method === 'GET') {
      return getStats()
    }

    // ============ Dashboard ============
    if (path === '/api/dashboard' && method === 'GET') {
      return getDashboard()
    }

    // ============ Calendar ============
    if (path === '/api/calendar' && method === 'GET') {
      return getCalendar(url)
    }

    // ============ Export ============
    if (path === '/api/export' && method === 'GET') {
      return exportData()
    }

    // ============ Seed ============
    if (path === '/api/seed' && method === 'POST') {
      return seedData()
    }

    // 404 - No matching route
    return jsonResponse(false, null, '接口不存在', null, 404)
  } catch (err) {
    console.error('Unhandled error:', err)
    return serverError('服务器内部错误')
  }
}

// ============ Start Server ============

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    return handleRequest(request)
  },
})

console.log(`🌸 小桦 Server running on http://localhost:${PORT}`)
console.log(`📦 Database: ${DB_PATH}`)
console.log(`🔗 API base: http://localhost:${PORT}/api`)
