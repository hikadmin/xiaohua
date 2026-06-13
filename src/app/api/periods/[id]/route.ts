import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { success, ok, notFound, badRequest, serverError, parseRequestBody, validateDateStr } from '@/lib/api/response'

// PUT /api/periods/[id] - 更新经期记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { data, error } = await parseRequestBody(request)
    if (error) return error

    const existing = await db.period.findUnique({ where: { id } })
    if (!existing) return notFound('经期记录不存在')

    // 校验日期格式
    if (data.startDate !== undefined) {
      const dateError = validateDateStr(data.startDate as string, 'startDate')
      if (dateError) return badRequest(dateError)
    }
    if (data.endDate !== undefined && data.endDate !== null) {
      const dateError = validateDateStr(data.endDate as string, 'endDate')
      if (dateError) return badRequest(dateError)
    }

    const period = await db.period.update({
      where: { id },
      data: {
        ...(data.startDate !== undefined && { startDate: data.startDate }),
        ...(data.endDate !== undefined && { endDate: data.endDate as string | null }),
      },
    })

    return success(period, '经期记录更新成功')
  } catch (error) {
    console.error('Failed to update period:', error)
    return serverError('更新经期记录失败')
  }
}

// DELETE /api/periods/[id] - 删除经期记录
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.period.findUnique({ where: { id } })
    if (!existing) return notFound('经期记录不存在')

    await db.period.delete({ where: { id } })

    return ok('经期记录删除成功')
  } catch (error) {
    console.error('Failed to delete period:', error)
    return serverError('删除经期记录失败')
  }
}
