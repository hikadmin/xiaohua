// ============ 前端 API 服务层 — 双模式适配 ============
// 支持两种运行模式：
// 1. Server 模式：通过 fetch() 调用后端 API（开发/网页版）
// 2. Local 模式：使用 IndexedDB 本地存储（Capacitor/Android APK）
//
// 模式切换：检测 Capacitor 环境、localStorage 标记、或自动回退

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

// Local mode API implementations (Capacitor/Android) — uses IndexedDB
import {
  localPeriodsApi,
  localRecordsApi,
  localProfileApi,
  localSettingsApi,
  localFeedbackApi,
  localGetCycleStats,
  localGetDashboard,
  localGetCalendarMonth,
  localExportData,
  localSeedData,
} from './local-api'

// ============ 模式检测 ============

export type ApiMode = 'server' | 'local'

let _mode: ApiMode | null = null  // null = not yet detected

/** 检测是否在 Capacitor/Android 环境 */
function isCapacitorEnv(): boolean {
  if (typeof window === 'undefined') return false
  // Capacitor 全局对象
  if (typeof (window as Record<string, unknown>).Capacitor !== 'undefined') return true
  // 显式标记
  if ((window as Record<string, unknown>).__LUNA_LOCAL_MODE__) return true
  // Capacitor 的自定义 scheme (https:// instead of http://localhost)
  try {
    if (window.location.protocol === 'capacitor:' || window.location.protocol === 'https:') {
      // 在 Android 上 Capacitor 使用 https:// scheme
      // 如果不是 localhost 且不是 file://，大概率是 Capacitor
      const host = window.location.hostname
      if (host && host !== 'localhost' && host !== '127.0.0.1') return true
    }
  } catch {}
  return false
}

/** 获取当前 API 模式（懒检测 + 缓存） */
export function getApiMode(): ApiMode {
  if (_mode) return _mode
  // 首次调用时检测
  _mode = detectMode()
  return _mode
}

/** 设置 API 模式 */
export function setApiMode(mode: ApiMode) {
  _mode = mode
  if (typeof window !== 'undefined') {
    try { localStorage.setItem('luna_api_mode', mode) } catch {}
  }
}

/** 自动检测模式 */
function detectMode(): ApiMode {
  if (typeof window === 'undefined') return 'server'

  // 1. 检查 localStorage 中保存的模式
  try {
    const savedMode = localStorage.getItem('luna_api_mode')
    if (savedMode === 'local') return 'local'
    if (savedMode === 'server') return 'server'
  } catch {}

  // 2. 检查 Capacitor 环境
  if (isCapacitorEnv()) return 'local'

  // 3. 默认 server 模式
  return 'server'
}

/** 强制重新检测模式（在运行时环境变化后调用） */
export function redetectMode(): ApiMode {
  _mode = null
  return getApiMode()
}

// ============ 通用请求封装 (Server 模式) ============

export class ApiError extends Error {
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
  // 运行时重新检测模式（处理 Capacitor 环境下 window 对象延迟加载的情况）
  if (getApiMode() === 'local') {
    throw new ApiError('当前为本地模式，不应调用 server API', 0)
  }

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
    // 网络错误 → 自动回退到 local 模式
    if (isNetworkError(error)) {
      if (getApiMode() === 'server') {
        console.warn('[小桦] Server unavailable, auto-switching to local mode (IndexedDB)')
        setApiMode('local')
      }
      throw new ApiError('服务器不可用，已切换到离线模式，请重试', 0)
    }
    if (error instanceof ApiError) throw error
    throw new ApiError('网络连接失败，请检查网络后重试', 0)
  }
}

/** 判断是否为网络错误 */
function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError) {
    const msg = error.message.toLowerCase()
    return msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')
  }
  return false
}

// ============ 双模式 API 接口 ============

export const periodsApi = {
  getAll(): Promise<PeriodItem[]> {
    return getApiMode() === 'local'
      ? localPeriodsApi.getAll()
      : request<PeriodItem[]>('/api/periods')
  },
  create(data: CreatePeriodRequest): Promise<PeriodItem> {
    return getApiMode() === 'local'
      ? localPeriodsApi.create(data)
      : request<PeriodItem>('/api/periods', { method: 'POST', body: JSON.stringify(data) })
  },
  update(id: string, data: UpdatePeriodRequest): Promise<PeriodItem> {
    return getApiMode() === 'local'
      ? localPeriodsApi.update(id, data)
      : request<PeriodItem>(`/api/periods/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  delete(id: string): Promise<void> {
    return getApiMode() === 'local'
      ? localPeriodsApi.delete(id)
      : request<void>(`/api/periods/${id}`, { method: 'DELETE' })
  },
}

export const recordsApi = {
  getAll(): Promise<DailyRecordItem[]> {
    return getApiMode() === 'local'
      ? localRecordsApi.getAll()
      : request<DailyRecordItem[]>('/api/records')
  },
  upsert(data: CreateRecordRequest): Promise<DailyRecordItem> {
    return getApiMode() === 'local'
      ? localRecordsApi.upsert(data)
      : request<DailyRecordItem>('/api/records', { method: 'POST', body: JSON.stringify(data) })
  },
  getByDate(date: string): Promise<DailyRecordItem> {
    return getApiMode() === 'local'
      ? localRecordsApi.getByDate(date)
      : request<DailyRecordItem>(`/api/records/${date}`)
  },
  updateByDate(date: string, data: UpdateRecordRequest): Promise<DailyRecordItem> {
    return getApiMode() === 'local'
      ? localRecordsApi.updateByDate(date, data)
      : request<DailyRecordItem>(`/api/records/${date}`, { method: 'PUT', body: JSON.stringify(data) })
  },
  deleteByDate(date: string): Promise<void> {
    return getApiMode() === 'local'
      ? localRecordsApi.deleteByDate(date)
      : request<void>(`/api/records/${date}`, { method: 'DELETE' })
  },
}

export const profileApi = {
  get(): Promise<UserProfileItem> {
    return getApiMode() === 'local'
      ? localProfileApi.get()
      : request<UserProfileItem>('/api/profile')
  },
  update(data: UpdateProfileRequest): Promise<UserProfileItem> {
    return getApiMode() === 'local'
      ? localProfileApi.update(data)
      : request<UserProfileItem>('/api/profile', { method: 'PUT', body: JSON.stringify(data) })
  },
}

export const settingsApi = {
  getAll(): Promise<SettingItem[]> {
    return getApiMode() === 'local'
      ? localSettingsApi.getAll()
      : request<SettingItem[]>('/api/settings')
  },
  update(data: UpdateSettingRequest): Promise<SettingItem> {
    return getApiMode() === 'local'
      ? localSettingsApi.update(data)
      : request<SettingItem>('/api/settings', { method: 'PUT', body: JSON.stringify(data) })
  },
  batchUpdate(data: BatchUpdateSettingsRequest): Promise<void> {
    return getApiMode() === 'local'
      ? localSettingsApi.batchUpdate(data)
      : request<void>('/api/settings', { method: 'POST', body: JSON.stringify(data) })
  },
}

export const feedbackApi = {
  getAll(): Promise<FeedbackItem[]> {
    return getApiMode() === 'local'
      ? localFeedbackApi.getAll()
      : request<FeedbackItem[]>('/api/feedback')
  },
  create(data: CreateFeedbackRequest): Promise<FeedbackItem> {
    return getApiMode() === 'local'
      ? localFeedbackApi.create(data)
      : request<FeedbackItem>('/api/feedback', { method: 'POST', body: JSON.stringify(data) })
  },
}

export const statsApi = {
  getCycleStats(): Promise<CycleStatsResponse> {
    return getApiMode() === 'local'
      ? localGetCycleStats()
      : request<CycleStatsResponse>('/api/stats')
  },
}

export const dashboardApi = {
  get(): Promise<DashboardResponse> {
    return getApiMode() === 'local'
      ? localGetDashboard()
      : request<DashboardResponse>('/api/dashboard')
  },
}

export const calendarApi = {
  getMonth(year: number, month: number): Promise<CalendarMonthResponse> {
    return getApiMode() === 'local'
      ? localGetCalendarMonth(year, month)
      : request<CalendarMonthResponse>(`/api/calendar?year=${year}&month=${month}`)
  },
}

export const exportApi = {
  getData(): Promise<ExportDataResponse> {
    return getApiMode() === 'local'
      ? localExportData() as Promise<ExportDataResponse>
      : request<ExportDataResponse>('/api/export')
  },
}

export const seedApi = {
  create(): Promise<unknown> {
    return getApiMode() === 'local'
      ? localSeedData()
      : request<unknown>('/api/seed', { method: 'POST' })
  },
}
