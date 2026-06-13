import { NextRequest } from 'next/server'
import { generateCalendarDays } from '@/lib/api/cycle-service'
import { success, badRequest, serverError } from '@/lib/api/response'
import { db } from '@/lib/db'

// GET /api/calendar?year=2026&month=3 - 获取指定月份的日历数据
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const yearStr = searchParams.get('year')
    const monthStr = searchParams.get('month')

    if (!yearStr || !monthStr) {
      return badRequest('缺少 year 或 month 参数')
    }

    const year = parseInt(yearStr, 10)
    const month = parseInt(monthStr, 10)

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12 || year < 2000 || year > 2100) {
      return badRequest('year 或 month 参数不合法')
    }

    // 生成日历天数
    const days = await generateCalendarDays(year, month)

    // 周期历史
    const periods = await db.period.findMany({
      orderBy: { startDate: 'desc' },
      take: 5,
    })

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
