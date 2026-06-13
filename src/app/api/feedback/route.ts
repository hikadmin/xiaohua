import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/feedback - Get all feedback
export async function GET() {
  try {
    const feedbacks = await db.feedback.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json(feedbacks)
  } catch (error) {
    console.error('Failed to fetch feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    )
  }
}

// POST /api/feedback - Submit new feedback
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { category, content, contact } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: '反馈内容不能为空' },
        { status: 400 }
      )
    }

    const feedback = await db.feedback.create({
      data: {
        category: category || '其他',
        content: content.trim(),
        contact: contact || '',
        status: 'pending',
      },
    })

    return NextResponse.json(feedback, { status: 201 })
  } catch (error) {
    console.error('Failed to create feedback:', error)
    return NextResponse.json(
      { error: 'Failed to create feedback' },
      { status: 500 }
    )
  }
}
