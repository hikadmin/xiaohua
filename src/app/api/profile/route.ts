import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { success, created, badRequest, serverError, parseRequestBody, validateIntRange, validateStringLength } from '@/lib/api/response'

// GET /api/profile - 获取用户资料（无则创建默认）
export async function GET() {
  try {
    let profile = await db.userProfile.findFirst()

    if (!profile) {
      profile = await db.userProfile.create({
        data: {
          name: 'Luna',
          cycleLength: 28,
          periodLength: 5,
        },
      })
    }

    return success(profile)
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return serverError('获取用户资料失败')
  }
}

// PUT /api/profile - 更新用户资料
export async function PUT(request: NextRequest) {
  try {
    const { data, error } = await parseRequestBody(request)
    if (error) return error

    // 参数校验
    if (data.name !== undefined) {
      if (typeof data.name !== 'string') return badRequest('name 必须为字符串')
      const nameError = validateStringLength(data.name as string, 20, 'name')
      if (nameError) return badRequest(nameError)
    }

    if (data.cycleLength !== undefined) {
      const cycleError = validateIntRange(data.cycleLength as number, 15, 50, 'cycleLength')
      if (cycleError) return badRequest(cycleError)
    }

    if (data.periodLength !== undefined) {
      const periodError = validateIntRange(data.periodLength as number, 1, 14, 'periodLength')
      if (periodError) return badRequest(periodError)
    }

    if (data.lastPeriodStart !== undefined && data.lastPeriodStart !== null) {
      // 简单日期格式校验
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/
      if (!dateRegex.test(data.lastPeriodStart as string)) {
        return badRequest('lastPeriodStart 格式不正确')
      }
    }

    let profile = await db.userProfile.findFirst()

    if (!profile) {
      profile = await db.userProfile.create({
        data: {
          name: (data.name as string) ?? 'Luna',
          avatar: (data.avatar as string) ?? '',
          cycleLength: (data.cycleLength as number) ?? 28,
          periodLength: (data.periodLength as number) ?? 5,
          lastPeriodStart: (data.lastPeriodStart as string) ?? null,
        },
      })
      return created(profile, '用户资料创建成功')
    } else {
      profile = await db.userProfile.update({
        where: { id: profile.id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.avatar !== undefined && { avatar: data.avatar }),
          ...(data.cycleLength !== undefined && { cycleLength: data.cycleLength }),
          ...(data.periodLength !== undefined && { periodLength: data.periodLength }),
          ...(data.lastPeriodStart !== undefined && { lastPeriodStart: data.lastPeriodStart as string | null }),
        },
      })
      return success(profile, '用户资料更新成功')
    }
  } catch (error) {
    console.error('Failed to update profile:', error)
    return serverError('更新用户资料失败')
  }
}
