import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { success, ok, notFound, badRequest, serverError, parseRequestBody, validateDateStr, validateIntRange } from '@/lib/api/response'

// GET /api/records/[date] - 获取指定日期的记录
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params

    const dateError = validateDateStr(date, 'date')
    if (dateError) return badRequest(dateError)

    const record = await db.dailyRecord.findUnique({
      where: { date },
    })

    if (!record) return notFound('该日期暂无记录')

    return success(record)
  } catch (error) {
    console.error('Failed to fetch daily record:', error)
    return serverError('获取每日记录失败')
  }
}

// PUT /api/records/[date] - 更新指定日期的记录（编辑功能）
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params
    const { data, error } = await parseRequestBody(request)
    if (error) return error

    const dateError = validateDateStr(date, 'date')
    if (dateError) return badRequest(dateError)

    const existing = await db.dailyRecord.findUnique({ where: { date } })
    if (!existing) return notFound('该日期暂无记录，请使用 POST 创建')

    if (data.flow !== undefined) {
      const flowError = validateIntRange(data.flow as number, 0, 4, 'flow')
      if (flowError) return badRequest(flowError)
    }
    if (data.mood !== undefined) {
      const moodError = validateIntRange(data.mood as number, 0, 5, 'mood')
      if (moodError) return badRequest(moodError)
    }

    // 序列化 symptoms
    let symptomsStr: string | undefined
    if (data.symptoms !== undefined) {
      symptomsStr = Array.isArray(data.symptoms)
        ? JSON.stringify(data.symptoms)
        : typeof data.symptoms === 'string' ? data.symptoms : '[]'
    }

    const record = await db.dailyRecord.update({
      where: { date },
      data: {
        ...(data.flow !== undefined && { flow: data.flow as number }),
        ...(data.mood !== undefined && { mood: data.mood as number }),
        ...(symptomsStr !== undefined && { symptoms: symptomsStr }),
        ...(data.note !== undefined && { note: data.note as string }),
      },
    })

    return success(record, '记录更新成功')
  } catch (error) {
    console.error('Failed to update daily record:', error)
    return serverError('更新每日记录失败')
  }
}

// DELETE /api/records/[date] - 删除指定日期的记录
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params

    const dateError = validateDateStr(date, 'date')
    if (dateError) return badRequest(dateError)

    const existing = await db.dailyRecord.findUnique({
      where: { date },
    })
    if (!existing) return notFound('该日期暂无记录')

    await db.dailyRecord.delete({ where: { date } })

    return ok('记录删除成功')
  } catch (error) {
    console.error('Failed to delete daily record:', error)
    return serverError('删除每日记录失败')
  }
}
