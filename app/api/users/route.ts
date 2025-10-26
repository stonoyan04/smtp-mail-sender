import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'example.com';

const createUserSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith(`@${ALLOWED_DOMAIN}`),
    { message: `Email must end with @${ALLOWED_DOMAIN}` }
  ),
  password: z.string().min(8),
  fromAddress: z.string().email().refine(
    (email) => email.endsWith(`@${ALLOWED_DOMAIN}`),
    { message: `From address must end with @${ALLOWED_DOMAIN}` }
  ).optional(),
})

// GET /api/users - List all users (SUPERADMIN only)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        fromAddress: true,
        createdAt: true,
        _count: {
          select: { emails: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/users - Create new user (SUPERADMIN only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    })

    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 })
    }

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        passwordHash,
        role: 'USER',
        fromAddress: validatedData.fromAddress,
        createdBy: session.user.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        fromAddress: true,
        createdAt: true,
      }
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0]
      let errorMessage = 'Invalid data'

      if (firstError.path[0] === 'password' && firstError.code === 'too_small') {
        errorMessage = 'Password must be at least 8 characters long'
      } else if (firstError.path[0] === 'email') {
        if (firstError.code === 'invalid_string') {
          errorMessage = 'Invalid email address'
        } else {
          errorMessage = firstError.message || `Email must end with @${ALLOWED_DOMAIN}`
        }
      } else if (firstError.path[0] === 'fromAddress') {
        errorMessage = firstError.message || `From address must end with @${ALLOWED_DOMAIN}`
      } else if (firstError.message) {
        errorMessage = firstError.message
      }

      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
