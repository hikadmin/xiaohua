import { db } from '@/lib/db'
import { NextRequest } from 'next/server'
import { success, created, badRequest, serverError, parseRequestBody, validateRequired, validateStringLength } from '@/lib/api/response'
import { sendFeedbackNotification } from '@/lib/mail'

// GET /api/feedback - 获取所有反馈
export async function GET() {
  try {
    const feedbacks = await db.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return success(feedbacks)
  } catch (error) {
    console.error('Failed to fetch feedback:', error)
    return serverError('获取反馈列表失败')
  }
}

// POST /api/feedback - 提交新反馈
export async function POST(request: NextRequest) {
  try {
    const { data, error } = await parseRequestBody(request)
    if (error) return error

    // 参数校验
    const requiredError = validateRequired(data, ['content'])
    if (requiredError) return badRequest(requiredError)

    const contentError = validateStringLength((data.content as string).trim(), 500, 'content')
    if (contentError) return badRequest(contentError)

    if (data.contact) {
      const contactError = validateStringLength(data.contact as string, 100, 'contact')
      if (contactError) return badRequest(contactError)
    }

    const validCategories = ['功能建议', '问题反馈', '体验优化', '其他']
    const category = validCategories.includes(data.category as string) ? data.category : '其他'

    const feedback = await db.feedback.create({
      data: {
        category: category as string,
        content: (data.content as string).trim(),
        contact: (data.contact as string)?.trim() || '',
        status: 'pending',
      },
    })

    // Send email notification (async, don't block the response)
    sendFeedbackNotification({
      category: category as string,
      content: (data.content as string).trim(),
      contact: (data.contact as string)?.trim() || '',
      time: new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }),
    }).catch(err => console.error('[Feedback] Mail notification failed:', err))

    return created(feedback, '反馈提交成功，感谢您的意见！')
  } catch (error) {
    console.error('Failed to create feedback:', error)
    return serverError('提交反馈失败')
  }
}
