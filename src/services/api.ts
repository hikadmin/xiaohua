// ============ 前端 API 服务层 ============
// 统一封装所有 API 调用，提供类型安全的接口
// 前端只通过此模块与后端通信

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
  CycleInfoResponse,
  DashboardResponse,
  CalendarMonthResponse,
  ExportDataResponse,
} from '@/lib/api/types'

// ============ 通用请求封装 ============

class ApiError extends Error {
  status: number
  data: ApiErrorResponse | null

  constructor(message: string, status: number, data: ApiErrorResponse | null = null) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

interface ApiErrorResponse {
  success: false
  error: string
  data: null
  message: null
  timestamp: string
}

async function request<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const { method = 'GET' } = options

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
        json as unknown as ApiErrorResponse
      )
    }

    return json.data as T
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError('网络连接失败，请检查网络后重试', 0)
  }
}

// ============ Periods API ============

export const periodsApi = {
  /** 获取所有经期记录 */
  getAll(): Promise<PeriodItem[]> {
    return request<PeriodItem[]>('/api/periods')
  },

  /** 创建新经期记录 */
  create(data: CreatePeriodRequest): Promise<PeriodItem> {
    return request<PeriodItem>('/api/periods', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /** 更新经期记录 */
  update(id: string, data: UpdatePeriodRequest): Promise<PeriodItem> {
    return request<PeriodItem>(`/api/periods/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /** 删除经期记录 */
  delete(id: string): Promise<void> {
    return request<void>(`/api/periods/${id}`, { method: 'DELETE' })
  },
}

// ============ Records API ============

export const recordsApi = {
  /** 获取所有每日记录 */
  getAll(): Promise<DailyRecordItem[]> {
    return request<DailyRecordItem[]>('/api/records')
  },

  /** 创建或更新每日记录 (Upsert by date) */
  upsert(data: CreateRecordRequest): Promise<DailyRecordItem> {
    return request<DailyRecordItem>('/api/records', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  /** 获取指定日期记录 */
  getByDate(date: string): Promise<DailyRecordItem> {
    return request<DailyRecordItem>(`/api/records/${date}`)
  },

  /** 更新指定日期记录 */
  updateByDate(date: string, data: UpdateRecordRequest): Promise<DailyRecordItem> {
    return request<DailyRecordItem>(`/api/records/${date}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /** 删除指定日期记录 */
  deleteByDate(date: string): Promise<void> {
    return request<void>(`/api/records/${date}`, { method: 'DELETE' })
  },
}

// ============ Profile API ============

export const profileApi = {
  /** 获取用户资料 */
  get(): Promise<UserProfileItem> {
    return request<UserProfileItem>('/api/profile')
  },

  /** 更新用户资料 */
  update(data: UpdateProfileRequest): Promise<UserProfileItem> {
    return request<UserProfileItem>('/api/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },
}

// ============ Settings API ============

export const settingsApi = {
  /** 获取所有设置项 */
  getAll(): Promise<SettingItem[]> {
    return request<SettingItem[]>('/api/settings')
  },

  /** 更新单个设置项 */
  update(data: UpdateSettingRequest): Promise<SettingItem> {
    return request<SettingItem>('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  /** 批量更新设置项 */
  batchUpdate(data: BatchUpdateSettingsRequest): Promise<void> {
    return request<void>('/api/settings', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ============ Feedback API ============

export const feedbackApi = {
  /** 获取所有反馈 */
  getAll(): Promise<FeedbackItem[]> {
    return request<FeedbackItem[]>('/api/feedback')
  },

  /** 提交新反馈 */
  create(data: CreateFeedbackRequest): Promise<FeedbackItem> {
    return request<FeedbackItem>('/api/feedback', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },
}

// ============ Stats API ============

export const statsApi = {
  /** 获取周期统计数据 */
  getCycleStats(): Promise<CycleStatsResponse> {
    return request<CycleStatsResponse>('/api/stats')
  },
}

// ============ Dashboard API ============

export const dashboardApi = {
  /** 获取首页仪表盘数据 */
  get(): Promise<DashboardResponse> {
    return request<DashboardResponse>('/api/dashboard')
  },
}

// ============ Calendar API ============

export const calendarApi = {
  /** 获取指定月份日历数据 */
  getMonth(year: number, month: number): Promise<CalendarMonthResponse> {
    return request<CalendarMonthResponse>(`/api/calendar?year=${year}&month=${month}`)
  },
}

// ============ Export API ============

export const exportApi = {
  /** 导出所有数据 */
  getData(): Promise<ExportDataResponse> {
    return request<ExportDataResponse>('/api/export')
  },
}

// ============ Seed API ============

export const seedApi = {
  /** 初始化种子数据 */
  create(): Promise<unknown> {
    return request<unknown>('/api/seed', { method: 'POST' })
  },
}

// 导出错误类，供前端 catch 使用
export { ApiError }
