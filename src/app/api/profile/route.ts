import { db } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/profile - Get user profile (create default if none exists)
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

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Failed to fetch profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update user profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, avatar, cycleLength, periodLength, lastPeriodStart } = body

    let profile = await db.userProfile.findFirst()

    if (!profile) {
      // Create profile if it doesn't exist
      profile = await db.userProfile.create({
        data: {
          name: name ?? 'Luna',
          cycleLength: cycleLength ?? 28,
          periodLength: periodLength ?? 5,
          lastPeriodStart: lastPeriodStart ?? null,
        },
      })
    } else {
      profile = await db.userProfile.update({
        where: { id: profile.id },
        data: {
          ...(name !== undefined && { name }),
          ...(avatar !== undefined && { avatar }),
          ...(cycleLength !== undefined && { cycleLength }),
          ...(periodLength !== undefined && { periodLength }),
          ...(lastPeriodStart !== undefined && { lastPeriodStart }),
        },
      })
    }

    return NextResponse.json(profile)
  } catch (error) {
    console.error('Failed to update profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
