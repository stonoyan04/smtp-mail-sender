import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const where = session.user.role === 'SUPERADMIN'
      ? {}
      : { userId: session.user.id }

    const [total, sent, failed, pending, rateLimit] = await Promise.all([
      prisma.email.count({ where }),
      prisma.email.count({ where: { ...where, status: 'SENT' } }),
      prisma.email.count({ where: { ...where, status: 'FAILED' } }),
      prisma.email.count({ where: { ...where, status: 'PENDING' } }),
      checkRateLimit(session.user.id),
    ])

    return NextResponse.json({
      total,
      sent,
      failed,
      pending,
      rateLimit: {
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
      }
    })
  } catch (error) {
    console.error('Error fetching email stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
