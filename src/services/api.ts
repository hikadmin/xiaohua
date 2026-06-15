// ============ 前端 API 服务层 — 双模式适配 ============
// 支持两种运行模式：
// 1. Server 模式：通过 fetch() 调用后端 API（开发/网页版）
// 2. Local 模式：使用 IndexedDB 本地存储（Capacitor/Android APK）
//
// 模式切换：检测 window.__LUNA_LOCAL_MODE__ 或 Capacitor 环境
//
// 重要：local-api.ts 依赖 Dexie (IndexedDB)，是浏览器专用模块，
// SSR 环境无法加载，因此使用动态 import() 按需加载。

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
  if ((window as Record<string, unknown>).__LUNA_LOCAL_MODE__) return 'local'
  if (typeof (window as Record<string, unknown>).Capacitor !== 'undefined') return 'local'
  return 'server'
}

// 初始化模式
if (typeof window !== 'undefined') {
  currentMode = detectMode()
}

// ============ 动态加载 local-api（浏览器专用模块） ============

type LocalApiModule = typeof import('./local-api')

let localApiCache: LocalApiModule | null = null

async function getLocalApi(): Promise<LocalApiModule> {
  if (!localApiCache) {
    localApiCache = await import('./local-api')
  }
  return localApiCache
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
  async getAll(): Promise<PeriodItem[]> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localPeriodsApi.getAll()
    }
    return request<PeriodItem[]>('/api/periods')
  },
  async create(data: CreatePeriodRequest): Promise<PeriodItem> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localPeriodsApi.create(data)
    }
    return request<PeriodItem>('/api/periods', { method: 'POST', body: JSON.stringify(data) })
  },
  async update(id: string, data: UpdatePeriodRequest): Promise<PeriodItem> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localPeriodsApi.update(id, data)
    }
    return request<PeriodItem>(`/api/periods/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  async delete(id: string): Promise<void> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localPeriodsApi.delete(id)
    }
    return request<void>(`/api/periods/${id}`, { method: 'DELETE' })
  },
}

export const recordsApi = {
  async getAll(): Promise<DailyRecordItem[]> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localRecordsApi.getAll()
    }
    return request<DailyRecordItem[]>('/api/records')
  },
  async upsert(data: CreateRecordRequest): Promise<DailyRecordItem> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localRecordsApi.upsert(data)
    }
    return request<DailyRecordItem>('/api/records', { method: 'POST', body: JSON.stringify(data) })
  },
  async getByDate(date: string): Promise<DailyRecordItem> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localRecordsApi.getByDate(date)
    }
    return request<DailyRecordItem>(`/api/records/${date}`)
  },
  async updateByDate(date: string, data: UpdateRecordRequest): Promise<DailyRecordItem> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localRecordsApi.updateByDate(date, data)
    }
    return request<DailyRecordItem>(`/api/records/${date}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  async deleteByDate(date: string): Promise<void> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localRecordsApi.deleteByDate(date)
    }
    return request<void>(`/api/records/${date}`, { method: 'DELETE' })
  },
}

export const profileApi = {
  async get(): Promise<UserProfileItem> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localProfileApi.get()
    }
    return request<UserProfileItem>('/api/profile')
  },
  async update(data: UpdateProfileRequest): Promise<UserProfileItem> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localProfileApi.update(data)
    }
    return request<UserProfileItem>('/api/profile', { method: 'PUT', body: JSON.stringify(data) })
  },
}

export const settingsApi = {
  async getAll(): Promise<SettingItem[]> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localSettingsApi.getAll()
    }
    return request<SettingItem[]>('/api/settings')
  },
  async update(data: UpdateSettingRequest): Promise<SettingItem> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localSettingsApi.update(data)
    }
    return request<SettingItem>('/api/settings', { method: 'PUT', body: JSON.stringify(data) })
  },
  async batchUpdate(data: BatchUpdateSettingsRequest): Promise<void> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localSettingsApi.batchUpdate(data)
    }
    return request<void>('/api/settings', { method: 'POST', body: JSON.stringify(data) })
  },
}

export const feedbackApi = {
  async getAll(): Promise<FeedbackItem[]> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localFeedbackApi.getAll()
    }
    return request<FeedbackItem[]>('/api/feedback')
  },
  async create(data: CreateFeedbackRequest): Promise<FeedbackItem> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localFeedbackApi.create(data)
    }
    return request<FeedbackItem>('/api/feedback', { method: 'POST', body: JSON.stringify(data) })
  },
}

export const statsApi = {
  async getCycleStats(): Promise<CycleStatsResponse> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localGetCycleStats()
    }
    return request<CycleStatsResponse>('/api/stats')
  },
}

export const dashboardApi = {
  async get(): Promise<DashboardResponse> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localGetDashboard()
    }
    return request<DashboardResponse>('/api/dashboard')
  },
}

export const calendarApi = {
  async getMonth(year: number, month: number): Promise<CalendarMonthResponse> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localGetCalendarMonth(year, month)
    }
    return request<CalendarMonthResponse>(`/api/calendar?year=${year}&month=${month}`)
  },
}

export const exportApi = {
  async getData(): Promise<ExportDataResponse> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localExportData() as Promise<ExportDataResponse>
    }
    return request<ExportDataResponse>('/api/export')
  },
}

export const seedApi = {
  async create(): Promise<unknown> {
    if (currentMode === 'local') {
      const local = await getLocalApi()
      return local.localSeedData()
    }
    return request<unknown>('/api/seed', { method: 'POST' })
  },
}

export { ApiError }
