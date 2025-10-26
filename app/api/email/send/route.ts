import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/email'
import { checkRateLimit, incrementRateLimit } from '@/lib/rate-limit'
import { z } from 'zod'

const sendEmailSchema = z.object({
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).optional().default([]),
  bcc: z.array(z.string().email()).optional().default([]),
  subject: z.string().min(1),
  bodyHtml: z.string().min(1),
  bodyText: z.string().optional(),
  replyTo: z.string().email().optional(),
  attachments: z.array(z.object({
    filename: z.string(),
    content: z.string(),
    encoding: z.string().optional(),
  })).optional(),
  attachmentUrls: z.array(z.object({
    filename: z.string(),
    blobUrl: z.string(),
    mimeType: z.string(),
    size: z.number(),
  })).optional(),
  inReplyTo: z.string().optional(),
  references: z.string().optional(),
  isReply: z.boolean().optional().default(false),
  includeSignature: z.boolean().optional().default(true),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check rate limit
    const rateLimit = await checkRateLimit(session.user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json({
        error: 'Rate limit exceeded',
        resetAt: rateLimit.resetAt,
        remaining: rateLimit.remaining
      }, { status: 429 })
    }

    const body = await request.json()
    const validatedData = sendEmailSchema.parse(body)

    // Determine "from" address
    let fromAddress: string
    let replyTo: string | undefined = validatedData.replyTo

    if (session.user.role === 'SUPERADMIN') {
      // Superadmin uses their email or assigned from address
      fromAddress = session.user.fromAddress || session.user.email
      if (validatedData.replyTo) {
        replyTo = validatedData.replyTo
      }
    } else {
      // Regular users must use their assigned from address
      if (!session.user.fromAddress) {
        return NextResponse.json({
          error: 'No from address assigned. Contact administrator.'
        }, { status: 400 })
      }
      fromAddress = session.user.fromAddress
    }

    // Get user info for signature
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { signatureHtml: true, signatureEnabled: true }
    })

    // Append signature if enabled and requested
    let finalBodyHtml = validatedData.bodyHtml
    if (validatedData.includeSignature && user?.signatureEnabled && user?.signatureHtml) {
      finalBodyHtml += `
        <br><br>
        <div class="email-signature">
          ${user.signatureHtml}
        </div>
      `
    }

    // Process attachments from Vercel Blob URLs
    type Attachment = { filename: string; content: string; encoding?: string } | { filename: string; content: Buffer; contentType: string }
    let attachmentsToSend: Attachment[] = validatedData.attachments || []
    if (validatedData.attachmentUrls && validatedData.attachmentUrls.length > 0) {
      const blobAttachments = await Promise.all(
        validatedData.attachmentUrls.map(async (att) => {
          try {
            const response = await fetch(att.blobUrl)
            const arrayBuffer = await response.arrayBuffer()
            const buffer = Buffer.from(arrayBuffer)
            return {
              filename: att.filename,
              content: buffer,
              contentType: att.mimeType,
            }
          } catch (error) {
            console.error(`Failed to fetch attachment ${att.filename}:`, error)
            return null
          }
        })
      )
      const validBlobAttachments = blobAttachments.filter(a => a !== null) as Attachment[]
      attachmentsToSend = [...attachmentsToSend, ...validBlobAttachments]
    }

    // Create email record
    const emailRecord = await prisma.email.create({
      data: {
        userId: session.user.id,
        from: fromAddress,
        replyTo,
        to: validatedData.to,
        cc: validatedData.cc,
        bcc: validatedData.bcc,
        subject: validatedData.subject,
        bodyHtml: finalBodyHtml,
        bodyText: validatedData.bodyText,
        attachments: validatedData.attachmentUrls ? JSON.stringify(validatedData.attachmentUrls) :
                     validatedData.attachments ? JSON.stringify(validatedData.attachments) : undefined,
        inReplyTo: validatedData.inReplyTo,
        references: validatedData.references,
        isReply: validatedData.isReply,
        status: 'PENDING',
      }
    })

    try {
      // Send email with threading headers
      await sendEmail({
        from: fromAddress,
        replyTo,
        to: validatedData.to,
        cc: validatedData.cc,
        bcc: validatedData.bcc,
        subject: validatedData.subject,
        html: finalBodyHtml,
        text: validatedData.bodyText,
        attachments: attachmentsToSend,
        inReplyTo: validatedData.inReplyTo,
        references: validatedData.references,
      })

      // Update email status
      await prisma.email.update({
        where: { id: emailRecord.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        }
      })

      // Increment rate limit
      await incrementRateLimit(session.user.id)

      // Get updated rate limit to return correct remaining count
      const updatedRateLimit = await checkRateLimit(session.user.id)

      return NextResponse.json({
        success: true,
        emailId: emailRecord.id,
        remaining: updatedRateLimit.remaining,
      })
    } catch (error: any) {
      // Update email status to failed
      await prisma.email.update({
        where: { id: emailRecord.id },
        data: {
          status: 'FAILED',
          error: error.message,
        }
      })

      throw error
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    console.error('Error sending email:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to send email'
    }, { status: 500 })
  }
}
