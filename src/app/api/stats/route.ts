import { getCycleStats } from '@/lib/api/cycle-service'
import { success, serverError } from '@/lib/api/response'

// GET /api/stats - 获取周期统计数据
export async function GET() {
  try {
    const stats = await getCycleStats()
    return success(stats)
  } catch (error) {
    console.error('Failed to fetch stats:', error)
    return serverError('获取统计数据失败')
  }
}
