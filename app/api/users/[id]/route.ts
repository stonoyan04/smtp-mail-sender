import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { serverEnv } from '@/lib/env'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const ALLOWED_DOMAIN = serverEnv.domain;

const updateUserSchema = z.object({
  email: z.string().email().refine(
    (email) => email.endsWith(`@${ALLOWED_DOMAIN}`),
    { message: `Email must end with @${ALLOWED_DOMAIN}` }
  ).optional(),
  password: z.string().min(8).optional(),
  fromAddress: z.string().email().refine(
    (email) => email.endsWith(`@${ALLOWED_DOMAIN}`),
    { message: `From address must end with @${ALLOWED_DOMAIN}` }
  ).optional().nullable(),
})

// PATCH /api/users/[id] - Update user (SUPERADMIN only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = updateUserSchema.parse(body)

    const updateData: any = {}

    if (validatedData.email) {
      // Check if email is already taken
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email }
      })
      if (existingUser && existingUser.id !== params.id) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 400 })
      }
      updateData.email = validatedData.email
    }

    if (validatedData.password) {
      updateData.passwordHash = await bcrypt.hash(validatedData.password, 10)
    }

    if (validatedData.fromAddress !== undefined) {
      updateData.fromAddress = validatedData.fromAddress
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        role: true,
        fromAddress: true,
        createdAt: true,
      }
    })

    return NextResponse.json(user)
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
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/users/[id] - Delete user (SUPERADMIN only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Prevent deleting self
    if (session.user.id === params.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
