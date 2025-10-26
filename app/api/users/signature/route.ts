import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Force dynamic rendering for this route
export const dynamic = 'force-dynamic';

const signatureSchema = z.object({
  signatureHtml: z.string().optional(),
  signatureEnabled: z.boolean().optional(),
});

// GET /api/users/signature - Get current user's signature
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
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
        signatureHtml: user.signatureHtml || '',
        signatureEnabled: user.signatureEnabled,
      },
    });
  } catch (error) {
    console.error('Error fetching signature:', error);
    return NextResponse.json(
      { error: 'Failed to fetch signature' },
      { status: 500 }
    );
  }
}

// PUT /api/users/signature - Update current user's signature
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = signatureSchema.parse(body);

    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        signatureHtml: validatedData.signatureHtml,
        signatureEnabled: validatedData.signatureEnabled,
      },
      select: {
        signatureHtml: true,
        signatureEnabled: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
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
    console.error('Error updating signature:', error);
    return NextResponse.json(
      { error: 'Failed to update signature' },
      { status: 500 }
    );
  }
}
