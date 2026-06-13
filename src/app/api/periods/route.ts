import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { success, created, badRequest, serverError, parseRequestBody, validateRequired, validateDateStr } from '@/lib/api/response'

// GET /api/periods - 获取所有经期记录（按开始日期倒序）
export async function GET() {
  try {
    const periods = await db.period.findMany({
      orderBy: { startDate: 'desc' },
    })
    return success(periods)
  } catch (error) {
    console.error('Failed to fetch periods:', error)
    return serverError('获取经期记录失败')
  }
}

// POST /api/periods - 创建新经期记录
export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseRequestBody(request)
    if (error) return error

    // 参数校验
    const requiredError = validateRequired(data, ['startDate'])
    if (requiredError) return badRequest(requiredError)

    const dateError = validateDateStr(data.startDate as string, 'startDate')
    if (dateError) return badRequest(dateError)

    if (data.endDate) {
      const endDateError = validateDateStr(data.endDate as string, 'endDate')
      if (endDateError) return badRequest(endDateError)

      // 结束日期不能早于开始日期
      if ((data.endDate as string) < (data.startDate as string)) {
        return badRequest('结束日期不能早于开始日期')
      }
    }

    const period = await db.period.create({
      data: {
        startDate: data.startDate as string,
        ...(data.endDate ? { endDate: data.endDate as string } : {}),
      },
    })

    return created(period, '经期记录创建成功')
  } catch (error) {
    console.error('Failed to create period:', error)
    return serverError('创建经期记录失败')
  }
}
