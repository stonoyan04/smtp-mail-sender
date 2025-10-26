import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const signatureSchema = z.object({
  signatureHtml: z.string().optional(),
  signatureEnabled: z.boolean().optional(),
});

// GET /api/users/[id]/signature - Get user's signature (SUPERADMIN only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. SUPERADMIN access required.' },
        { status: 403 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        signatureHtml: true,
        signatureEnabled: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        signatureHtml: user.signatureHtml || '',
        signatureEnabled: user.signatureEnabled,
      },
    });
  } catch (error) {
    console.error('Error fetching user signature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user signature' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id]/signature - Update user's signature (SUPERADMIN only)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'SUPERADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. SUPERADMIN access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = signatureSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        signatureHtml: validatedData.signatureHtml,
        signatureEnabled: validatedData.signatureEnabled,
      },
      select: {
        id: true,
        email: true,
        signatureHtml: true,
        signatureEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        signatureHtml: updatedUser.signatureHtml || '',
        signatureEnabled: updatedUser.signatureEnabled,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating user signature:', error);
    return NextResponse.json(
      { error: 'Failed to update user signature' },
      { status: 500 }
    );
  }
}
