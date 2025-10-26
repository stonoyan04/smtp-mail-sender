import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { simpleParser } from 'mailparser';

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get current user's email address
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, fromAddress: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const userEmail = (user.fromAddress || user.email).toLowerCase();

    // Get the uploaded file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const validExtensions = ['.eml', '.msg'];
    const fileName = file.name.toLowerCase();
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));

    if (!hasValidExtension) {
      return NextResponse.json(
        { error: 'Invalid file type. Only .eml and .msg files are supported' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    // Read file content
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse the EML file
    const parsed = await simpleParser(buffer);

    // Helper function to extract addresses from AddressObject
    const extractAddresses = (addressObj: any) => {
      if (!addressObj) return [];
      const value = Array.isArray(addressObj) ? addressObj : [addressObj];
      return value.flatMap(obj => obj.value || []);
    };

    // Extract all recipients
    const toAddresses = extractAddresses(parsed.to);
    const ccAddresses = extractAddresses(parsed.cc);
    const bccAddresses = extractAddresses(parsed.bcc);

    // Combine all recipient emails
    const allRecipients = [
      ...toAddresses.map(addr => addr.address?.toLowerCase() || ''),
      ...ccAddresses.map(addr => addr.address?.toLowerCase() || ''),
      ...bccAddresses.map(addr => addr.address?.toLowerCase() || ''),
    ].filter(Boolean);

    // CRITICAL SECURITY: Validate that the current user was a recipient
    const isRecipient = allRecipients.includes(userEmail);

    if (!isRecipient) {
      console.log(`Security: User ${userEmail} attempted to reply to email they weren't recipient of`);
      return NextResponse.json(
        {
          error: 'You cannot reply to this email. You were not a recipient (To/CC/BCC).',
          code: 'NOT_RECIPIENT'
        },
        { status: 403 }
      );
    }

    // Extract headers
    const messageId = parsed.messageId || '';
    const references = parsed.references || [];
    const inReplyTo = parsed.inReplyTo || '';

    // Format references as space-separated string
    const referencesStr = Array.isArray(references)
      ? references.join(' ')
      : typeof references === 'string'
        ? references
        : '';

    // Extract sender email
    const fromAddresses = extractAddresses(parsed.from);
    const fromEmail = fromAddresses[0]?.address || '';

    // Extract all To recipients
    const toEmails = toAddresses.map(addr => addr.address).filter(Boolean);

    // Extract all CC recipients
    const ccEmails = ccAddresses.map(addr => addr.address).filter(Boolean);

    // Extract all BCC recipients (if available in the parsed email)
    const bccEmails = bccAddresses.map(addr => addr.address).filter(Boolean);

    // Get subject
    let subject = parsed.subject || '';

    // Get body (prefer HTML, fallback to text)
    const html = parsed.html ? String(parsed.html) : '';
    const text = parsed.text || '';

    // Format date
    const date = parsed.date ? new Date(parsed.date).toLocaleString() : '';

    // Extract all headers
    const headers: Record<string, string> = {};
    if (parsed.headers) {
      parsed.headers.forEach((value, key) => {
        headers[key] = String(value);
      });
    }

    // Prepare quoted original message for reply
    const quotedText = text
      .split('\n')
      .map(line => `> ${line}`)
      .join('\n');

    const quotedHtml = html
      ? `<blockquote style="margin: 0 0 0 0.8ex; border-left: 1px solid #ccc; padding-left: 1ex;">${html}</blockquote>`
      : `<blockquote style="margin: 0 0 0 0.8ex; border-left: 1px solid #ccc; padding-left: 1ex;">${quotedText.replace(/\n/g, '<br>')}</blockquote>`;

    return NextResponse.json({
      success: true,
      data: {
        from: fromEmail,
        to: toEmails,
        cc: ccEmails,
        bcc: bccEmails,
        subject: subject,
        messageId: messageId,
        references: referencesStr,
        inReplyTo: inReplyTo || messageId,
        date: date,
        text: text,
        html: html,
        quotedText: quotedText,
        quotedHtml: quotedHtml,
        headers: headers,
      },
    });
  } catch (error) {
    console.error('EML parsing error:', error);
    return NextResponse.json(
      { error: 'Failed to parse EML file', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
