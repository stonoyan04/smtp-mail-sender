import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query based on user role
    const where = session.user.role === 'SUPERADMIN'
      ? {}
      : { userId: session.user.id }

    const [emails, total] = await Promise.all([
      prisma.email.findMany({
        where,
        select: {
          id: true,
          from: true,
          to: true,
          cc: true,
          bcc: true,
          subject: true,
          status: true,
          error: true,
          sentAt: true,
          createdAt: true,
          user: {
            select: {
              email: true,
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.email.count({ where })
    ])

    return NextResponse.json({
      emails,
      total,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error fetching email history:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
