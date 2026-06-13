import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { success, created, badRequest, serverError, parseRequestBody, validateRequired, validateDateStr, validateIntRange } from '@/lib/api/response'

// GET /api/records - 获取所有每日记录（按日期倒序）
export async function GET() {
  try {
    const records = await db.dailyRecord.findMany({
      orderBy: { date: 'desc' },
    })
    return success(records)
  } catch (error) {
    console.error('Failed to fetch daily records:', error)
    return serverError('获取每日记录失败')
  }
}

// POST /api/records - 创建或更新每日记录（Upsert by date）
export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseRequestBody(request)
    if (error) return error

    // 参数校验
    const requiredError = validateRequired(data, ['date'])
    if (requiredError) return badRequest(requiredError)

    const dateError = validateDateStr(data.date as string, 'date')
    if (dateError) return badRequest(dateError)

    if (data.flow !== undefined) {
      const flowError = validateIntRange(data.flow as number, 0, 4, 'flow')
      if (flowError) return badRequest(flowError)
    }

    if (data.mood !== undefined) {
      const moodError = validateIntRange(data.mood as number, 0, 5, 'mood')
      if (moodError) return badRequest(moodError)
    }

    // 序列化 symptoms
    let symptomsStr = '[]'
    if (data.symptoms !== undefined) {
      if (Array.isArray(data.symptoms)) {
        symptomsStr = JSON.stringify(data.symptoms)
      } else if (typeof data.symptoms === 'string') {
        symptomsStr = data.symptoms
      }
    }

    const record = await db.dailyRecord.upsert({
      where: { date: data.date as string },
      update: {
        ...(data.flow !== undefined && { flow: data.flow as number }),
        ...(data.mood !== undefined && { mood: data.mood as number }),
        ...(data.symptoms !== undefined && { symptoms: symptomsStr }),
        ...(data.note !== undefined && { note: data.note as string }),
      },
      create: {
        date: data.date as string,
        flow: (data.flow as number) ?? 0,
        mood: (data.mood as number) ?? 0,
        symptoms: symptomsStr,
        note: (data.note as string) ?? '',
      },
    })

    return created(record, '每日记录保存成功')
  } catch (error) {
    console.error('Failed to create/update daily record:', error)
    return serverError('保存每日记录失败')
  }
}
