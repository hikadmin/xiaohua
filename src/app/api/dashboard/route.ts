import { db } from '@/lib/db'
import { getCycleInfo, getCycleStats } from '@/lib/api/cycle-service'
import { success, serverError } from '@/lib/api/response'
import { DAILY_TIPS } from '@/components/luna/shared'

// GET /api/dashboard - 获取首页仪表盘数据（一次性获取所有首页需要的数据）
export async function GET() {
  try {
    const [cycleInfo, cycleStats] = await Promise.all([
      getCycleInfo(),
      getCycleStats(),
    ])

    // 最近3条记录
    const recentRecords = await db.dailyRecord.findMany({
      orderBy: { date: 'desc' },
      take: 3,
    })

    // 今日贴士
    const phaseTips = DAILY_TIPS[cycleInfo.phase] || DAILY_TIPS.follicular
    const t = new Date()
    const tipIndex = (t.getFullYear() * 366 + t.getMonth() * 31 + t.getDate()) % 5

    return success({
      cycleInfo,
      cycleStats,
      recentRecords,
      dailyTip: {
        phase: cycleInfo.phase,
        tip: phaseTips[tipIndex],
        index: tipIndex,
      },
    })
  } catch (error) {
    console.error('Failed to fetch dashboard:', error)
    return serverError('获取仪表盘数据失败')
  }
}
