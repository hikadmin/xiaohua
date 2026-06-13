import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { success, ok, badRequest, serverError, parseRequestBody, validateRequired } from '@/lib/api/response'

// GET /api/settings - 获取所有设置项
export async function GET() {
  try {
    const settings = await db.setting.findMany()
    return success(settings)
  } catch (error) {
    console.error('Failed to fetch settings:', error)
    return serverError('获取设置失败')
  }
}

// PUT /api/settings - 更新单个设置项（Upsert by key）
export async function PUT(request: NextRequest) {
  try {
    const { data, error } = await parseRequestBody(request)
    if (error) return error

    // 单个设置更新
    const requiredError = validateRequired(data, ['key', 'value'])
    if (requiredError) return badRequest(requiredError)

    const setting = await db.setting.upsert({
      where: { key: data.key as string },
      update: { value: data.value as string },
      create: { key: data.key as string, value: data.value as string },
    })

    return success(setting, '设置更新成功')
  } catch (error) {
    console.error('Failed to update setting:', error)
    return serverError('更新设置失败')
  }
}

// POST /api/settings - 批量更新设置项
export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseRequestBody(request)
    if (error) return error

    if (!data.settings || !Array.isArray(data.settings)) {
      return badRequest('settings 必须是数组')
    }

    const results = []
    for (const item of data.settings as Array<{ key: string; value: string }>) {
      if (!item.key || item.value === undefined) {
        return badRequest(`设置项缺少 key 或 value: ${JSON.stringify(item)}`)
      }
      const setting = await db.setting.upsert({
        where: { key: item.key },
        update: { value: item.value },
        create: { key: item.key, value: item.value },
      })
      results.push(setting)
    }

    return ok(`成功更新 ${results.length} 项设置`)
  } catch (error) {
    console.error('Failed to batch update settings:', error)
    return serverError('批量更新设置失败')
  }
}
