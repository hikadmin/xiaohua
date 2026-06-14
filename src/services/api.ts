// ============ 前端 API 服务层 — 双模式适配 ============
// 支持两种运行模式：
// 1. Server 模式：通过 fetch() 调用后端 API（开发/网页版）
// 2. Local 模式：使用 IndexedDB 本地存储（Capacitor/Android APK）
//
// 模式切换：检测 window.__LUNA_LOCAL_MODE__ 或 Capacitor 环境

import type {
  ApiResponse,
  PeriodItem,
  CreatePeriodRequest,
  UpdatePeriodRequest,
  DailyRecordItem,
  CreateRecordRequest,
  UpdateRecordRequest,
  UserProfileItem,
  UpdateProfileRequest,
  SettingItem,
  UpdateSettingRequest,
  BatchUpdateSettingsRequest,
  FeedbackItem,
  CreateFeedbackRequest,
  CycleStatsResponse,
  DashboardResponse,
  CalendarMonthResponse,
  ExportDataResponse,
} from '@/lib/api/types'

// Local mode stubs (Capacitor/Android) — not used in web mode
const localPeriodsApi = {} as any;
const localRecordsApi = {} as any;
const localProfileApi = {} as any;
const localSettingsApi = {} as any;
const localFeedbackApi = {} as any;
const localGetCycleStats = (() => {}) as any;
const localGetDashboard = (() => {}) as any;
const localGetCalendarMonth = (() => {}) as any;
const localExportData = (() => {}) as any;
const localSeedData = (() => {}) as any;

// ============ 模式检测 ============

export type ApiMode = 'server' | 'local'

let currentMode: ApiMode = 'server'

/** 获取当前 API 模式 */
export function getApiMode(): ApiMode {
  return currentMode
}

/** 设置 API 模式 */
export function setApiMode(mode: ApiMode) {
  currentMode = mode
}

/** 自动检测模式：优先检查 Capacitor 环境 */
function detectMode(): ApiMode {
  if (typeof window === 'undefined') return 'server'
  // 如果标记了本地模式或检测到 Capacitor 环境
  if ((window as Record<string, unknown>).__LUNA_LOCAL_MODE__) return 'local'
  // Capacitor 环境检测
  if (typeof (window as Record<string, unknown>).Capacitor !== 'undefined') return 'local'
  return 'server'
}

// 初始化模式
if (typeof window !== 'undefined') {
  currentMode = detectMode()
}

// ============ 通用请求封装 (Server 模式) ============

class ApiError extends Error {
  status: number
  data: { error: string } | null

  constructor(message: string, status: number, data: { error: string } | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  }

  try {
    const res = await fetch(url, config)
    const json = await res.json() as ApiResponse<T>

    if (!res.ok || !json.success) {
      throw new ApiError(
        json.error || `请求失败 (${res.status})`,
        res.status,
        json as unknown as { error: string }
      )
    }

    return json.data as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('网络连接失败，请检查网络后重试', 0)
  }
}

// ============ 双模式 API 接口 ============

export const periodsApi = {
  getAll(): Promise<PeriodItem[]> {
    return currentMode === 'local'
      ? localPeriodsApi.getAll()
      : request<PeriodItem[]>('/api/periods')
  },
  create(data: CreatePeriodRequest): Promise<PeriodItem> {
    return currentMode === 'local'
      ? localPeriodsApi.create(data)
      : request<PeriodItem>('/api/periods', { method: 'POST', body: JSON.stringify(data) })
  },
  update(id: string, data: UpdatePeriodRequest): Promise<PeriodItem> {
    return currentMode === 'local'
      ? localPeriodsApi.update(id, data)
      : request<PeriodItem>(`/api/periods/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  delete(id: string): Promise<void> {
    return currentMode === 'local'
      ? localPeriodsApi.delete(id)
      : request<void>(`/api/periods/${id}`, { method: 'DELETE' })
  },
}

export const recordsApi = {
  getAll(): Promise<DailyRecordItem[]> {
    return currentMode === 'local'
      ? localRecordsApi.getAll()
      : request<DailyRecordItem[]>('/api/records')
  },
  upsert(data: CreateRecordRequest): Promise<DailyRecordItem> {
    return currentMode === 'local'
      ? localRecordsApi.upsert(data)
      : request<DailyRecordItem>('/api/records', { method: 'POST', body: JSON.stringify(data) })
  },
  getByDate(date: string): Promise<DailyRecordItem> {
    return currentMode === 'local'
      ? localRecordsApi.getByDate(date)
      : request<DailyRecordItem>(`/api/records/${date}`)
  },
  updateByDate(date: string, data: UpdateRecordRequest): Promise<DailyRecordItem> {
    return currentMode === 'local'
      ? localRecordsApi.updateByDate(date, data)
      : request<DailyRecordItem>(`/api/records/${date}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deleteByDate(date: string): Promise<void> {
    return currentMode === 'local'
      ? localRecordsApi.deleteByDate(date)
      : request<void>(`/api/records/${date}`, { method: 'DELETE' })
  },
}

export const profileApi = {
  get(): Promise<UserProfileItem> {
    return currentMode === 'local'
      ? localProfileApi.get()
      : request<UserProfileItem>('/api/profile')
  },
  update(data: UpdateProfileRequest): Promise<UserProfileItem> {
    return currentMode === 'local'
      ? localProfileApi.update(data)
      : request<UserProfileItem>('/api/profile', { method: 'PUT', body: JSON.stringify(data) })
  },
}

export const settingsApi = {
  getAll(): Promise<SettingItem[]> {
    return currentMode === 'local'
      ? localSettingsApi.getAll()
      : request<SettingItem[]>('/api/settings')
  },
  update(data: UpdateSettingRequest): Promise<SettingItem> {
    return currentMode === 'local'
      ? localSettingsApi.update(data)
      : request<SettingItem>('/api/settings', { method: 'PUT', body: JSON.stringify(data) })
  },
  batchUpdate(data: BatchUpdateSettingsRequest): Promise<void> {
    return currentMode === 'local'
      ? localSettingsApi.batchUpdate(data)
      : request<void>('/api/settings', { method: 'POST', body: JSON.stringify(data) })
  },
}

export const feedbackApi = {
  getAll(): Promise<FeedbackItem[]> {
    return currentMode === 'local'
      ? localFeedbackApi.getAll()
      : request<FeedbackItem[]>('/api/feedback')
  },
  create(data: CreateFeedbackRequest): Promise<FeedbackItem> {
    return currentMode === 'local'
      ? localFeedbackApi.create(data)
      : request<FeedbackItem>('/api/feedback', { method: 'POST', body: JSON.stringify(data) })
  },
}

export const statsApi = {
  getCycleStats(): Promise<CycleStatsResponse> {
    return currentMode === 'local'
      ? localGetCycleStats()
      : request<CycleStatsResponse>('/api/stats')
  },
}

export const dashboardApi = {
  get(): Promise<DashboardResponse> {
    return currentMode === 'local'
      ? localGetDashboard()
      : request<DashboardResponse>('/api/dashboard')
  },
}

export const calendarApi = {
  getMonth(year: number, month: number): Promise<CalendarMonthResponse> {
    return currentMode === 'local'
      ? localGetCalendarMonth(year, month)
      : request<CalendarMonthResponse>(`/api/calendar?year=${year}&month=${month}`)
  },
}

export const exportApi = {
  getData(): Promise<ExportDataResponse> {
    return currentMode === 'local'
      ? localExportData() as Promise<ExportDataResponse>
      : request<ExportDataResponse>('/api/export')
  },
}

export const seedApi = {
  create(): Promise<unknown> {
    return currentMode === 'local'
      ? localSeedData()
      : request<unknown>('/api/seed', { method: 'POST' })
  },
}

export { ApiError }
