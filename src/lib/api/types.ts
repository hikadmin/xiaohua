// ============ API 请求/响应类型定义 ============
// 前后端共享的接口类型契约

// ---- 通用 ----
export interface ApiErrorResponse {
  success: false
  data: null
  error: string
  message: null
  timestamp: string
}

export interface ApiSuccessResponse<T> {
  success: true
  data: T
  error: null
  message: string | null
  timestamp: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ---- Periods (经期) ----

export interface PeriodItem {
  id: string
  startDate: string
  endDate: string | null
  createdAt: string
  updatedAt: string
}

export interface CreatePeriodRequest {
  startDate: string
  endDate?: string | null
}

export interface UpdatePeriodRequest {
  startDate?: string
  endDate?: string | null
}

// ---- Records (每日记录) ----

export interface DailyRecordItem {
  id: string
  date: string
  flow: number
  mood: number
  symptoms: string   // JSON string of string[]
  note: string
  createdAt: string
  updatedAt: string
}

export interface CreateRecordRequest {
  date: string
  flow?: number
  mood?: number
  symptoms?: string[] | string
  note?: string
}

export interface UpdateRecordRequest {
  flow?: number
  mood?: number
  symptoms?: string[] | string
  note?: string
}

// ---- Profile (用户资料) ----

export interface UserProfileItem {
  id: string
  name: string
  avatar: string
  cycleLength: number
  periodLength: number
  lastPeriodStart: string | null
  createdAt: string
  updatedAt: string
}

export interface UpdateProfileRequest {
  name?: string
  avatar?: string
  cycleLength?: number
  periodLength?: number
  lastPeriodStart?: string | null
}

// ---- Settings (设置) ----

export interface SettingItem {
  id: string
  key: string
  value: string
}

export interface UpdateSettingRequest {
  key: string
  value: string
}

export interface BatchUpdateSettingsRequest {
  settings: Array<{ key: string; value: string }>
}

// ---- Feedback (反馈) ----

export interface FeedbackItem {
  id: string
  category: string
  content: string
  contact: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface CreateFeedbackRequest {
  category?: string
  content: string
  contact?: string
}

// ---- Statistics (统计) ----

export interface CycleStatsResponse {
  avgCycle: number
  avgPeriod: number
  totalCycles: number
  cycleLengths: number[]
  periodLengths: number[]
  cycleRegularity: 'regular' | 'irregular' | 'insufficient_data'
  consecutiveRecordDays: number
}

export interface CycleInfoResponse {
  phase: string
  phaseDay: number
  daysUntilNext: number
  cycleLength: number
  periodLength: number
  nextPeriodDate: string | null
  lastPeriodStart: string | null
  predictedPeriodDays: string[]
  fertileDays: string[]
}

export interface DashboardResponse {
  cycleInfo: CycleInfoResponse
  cycleStats: CycleStatsResponse
  recentRecords: DailyRecordItem[]
  dailyTip: {
    phase: string
    tip: string
    index: number
  }
}

// ---- Calendar (日历) ----

export interface CalendarDayResponse {
  day: number
  dateStr: string
  isToday: boolean
  isOtherMonth: boolean
  periodInfo: {
    isPeriod: boolean
    isStart: boolean
    isEnd: boolean
    isActive: boolean
  }
  isPredicted: boolean
  isFertile: boolean
}

export interface CalendarMonthResponse {
  year: number
  month: number
  days: CalendarDayResponse[]
  periodHistory: Array<{
    id: string
    startDate: string
    endDate: string | null
    length: number | string
  }>
}

// ---- Export (导出) ----

export interface ExportDataResponse {
  records: DailyRecordItem[]
  periods: PeriodItem[]
  profile: UserProfileItem
  exportedAt: string
}
