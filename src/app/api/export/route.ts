import { db } from '@/lib/db'
import { success, serverError } from '@/lib/api/response'
import { formatDateStr } from '@/lib/api/cycle-service'
import { FLOW_LABELS, MOOD_LABELS } from '@/components/luna/shared'

// GET /api/export - 导出所有用户数据（JSON格式，供前端生成CSV/下载）
export async function GET() {
  try {
    const [records, periods, profile] = await Promise.all([
      db.dailyRecord.findMany({ orderBy: { date: 'desc' } }),
      db.period.findMany({ orderBy: { startDate: 'desc' } }),
      db.userProfile.findFirst(),
    ])

    // CSV 格式化记录
    const csvHeaders = ['日期', '流量', '情绪', '症状', '备注']
    const csvRows = records.map(r => {
      const symptoms = JSON.parse(r.symptoms || '[]')
      return [
        r.date,
        FLOW_LABELS[r.flow] || '',
        MOOD_LABELS[r.mood] || '',
        symptoms.join(';'),
        `"${(r.note || '').replace(/"/g, '""')}"`,
      ]
    })
    const csvContent = [csvHeaders.join(','), ...csvRows.map(r => r.join(','))].join('\n')

    return success({
      records,
      periods,
      profile,
      csvContent,
      exportedAt: formatDateStr(new Date()),
    })
  } catch (error) {
    console.error('Failed to export data:', error)
    return serverError('导出数据失败')
  }
}
