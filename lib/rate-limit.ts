import { prisma } from './prisma'

const RATE_LIMIT = parseInt(process.env.EMAIL_RATE_LIMIT || '100')
const WINDOW_MS = 60 * 60 * 1000 // 1 hour

export async function checkRateLimit(userId: string): Promise<{
  allowed: boolean
  remaining: number
  resetAt: Date
}> {
  const now = new Date()

  // Get or create rate limit record
  let rateLimitRecord = await prisma.rateLimit.findUnique({
    where: { userId }
  })

  if (!rateLimitRecord) {
    rateLimitRecord = await prisma.rateLimit.create({
      data: {
        userId,
        count: 0,
        windowStart: now
      }
    })
  }

  // Check if window has expired
  const windowStart = new Date(rateLimitRecord.windowStart)
  const windowEnd = new Date(windowStart.getTime() + WINDOW_MS)

  if (now >= windowEnd) {
    // Reset the window
    rateLimitRecord = await prisma.rateLimit.update({
      where: { userId },
      data: {
        count: 0,
        windowStart: now
      }
    })
  }

  const allowed = rateLimitRecord.count < RATE_LIMIT
  const remaining = Math.max(0, RATE_LIMIT - rateLimitRecord.count)

  return {
    allowed,
    remaining,
    resetAt: new Date(rateLimitRecord.windowStart.getTime() + WINDOW_MS)
  }
}

export async function incrementRateLimit(userId: string): Promise<void> {
  await prisma.rateLimit.update({
    where: { userId },
    data: {
      count: {
        increment: 1
      }
    }
  })
}
