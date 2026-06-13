import { NextResponse } from 'next/server'

// ============ 统一响应格式 ============

export interface ApiResponse<T = unknown> {
  success: boolean
  data: T | null
  error: string | null
  message: string | null
  timestamp: string
}

function createResponse<T>(
  success: boolean,
  data: T | null = null,
  error: string | null = null,
  message: string | null = null,
  status: number = 200
): NextResponse<ApiResponse<T>> {
  return NextResponse.json(
    {
      success,
      data,
      error,
      message,
      timestamp: new Date().toISOString(),
    },
    { status }
  )
}

/** 成功响应 - 返回数据 */
export function success<T>(data: T, message?: string, status: number = 200) {
  return createResponse(true, data, null, message ?? null, status)
}

/** 创建成功响应 - 201 */
export function created<T>(data: T, message?: string) {
  return createResponse(true, data, null, message ?? '创建成功', 201)
}

/** 无数据成功响应 */
export function ok(message?: string) {
  return createResponse(true, null, null, message ?? '操作成功', 200)
}

/** 参数错误 - 400 */
export function badRequest(error: string) {
  return createResponse(false, null, error, null, 400)
}

/** 未找到 - 404 */
export function notFound(error: string = '资源不存在') {
  return createResponse(false, null, error, null, 404)
}

/** 服务器错误 - 500 */
export function serverError(error: string = '服务器内部错误') {
  return createResponse(false, null, error, null, 500)
}

/** 冲突 - 409 */
export function conflict(error: string) {
  return createResponse(false, null, error, null, 409)
}

// ============ 参数校验工具 ============

export function validateRequired(body: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (body[field] === undefined || body[field] === null || body[field] === '') {
      return `缺少必填字段: ${field}`
    }
  }
  return null
}

export function validateDateStr(value: string, fieldName: string = 'date'): string | null {
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

export function validateIntRange(value: number, min: number, max: number, fieldName: string): string | null {
  if (!Number.isInteger(value)) {
    return `${fieldName} 必须是整数`
  }
  if (value < min || value > max) {
    return `${fieldName} 必须在 ${min}-${max} 之间`
  }
  return null
}

export function validateStringLength(value: string, maxLen: number, fieldName: string): string | null {
  if (value.length > maxLen) {
    return `${fieldName} 长度不能超过 ${maxLen} 个字符`
  }
  return null
}

/** 安全解析请求体 JSON */
export async function parseRequestBody(request: Request): Promise<{ data: Record<string, unknown> | null; error: NextResponse | null }> {
  try {
    const data = await request.json()
    return { data, error: null }
  } catch {
    return { data: null, error: badRequest('请求体格式错误，应为有效JSON') }
  }
}
