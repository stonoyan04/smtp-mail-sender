import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

const ALLOWED_DOMAIN = process.env.NEXT_PUBLIC_DOMAIN || 'example.com';

// POST /api/init - Initialize superadmin (only works if no superadmin exists)
export async function POST() {
  try {
    // Check if superadmin already exists
    const existingSuperadmin = await prisma.user.findFirst({
      where: { role: 'SUPERADMIN' }
    })

    if (existingSuperadmin) {
      return NextResponse.json(
        { error: 'Superadmin already exists' },
        { status: 400 }
      )
    }

    const email = process.env.SUPERADMIN_EMAIL || 'admin@example.com'
    const password = process.env.SUPERADMIN_PASSWORD || 'changeme123'

    // Validate email domain
    if (!email.endsWith(`@${ALLOWED_DOMAIN}`)) {
      return NextResponse.json(
        { error: `Superadmin email must end with @${ALLOWED_DOMAIN}. Current SUPERADMIN_EMAIL: ${email}` },
        { status: 400 }
      )
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const superadmin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'SUPERADMIN',
      },
      select: {
        id: true,
        email: true,
        role: true,
      }
    })

    return NextResponse.json({
      message: 'Superadmin created successfully',
      user: superadmin,
      warning: 'Please change the default password immediately!'
    }, { status: 201 })
  } catch (error) {
    console.error('Error initializing superadmin:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
