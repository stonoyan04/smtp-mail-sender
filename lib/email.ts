import nodemailer from 'nodemailer'

export interface EmailOptions {
  from: string
  replyTo?: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  html: string
  text?: string
  attachments?: Array<{
    filename: string
    content: string | Buffer
    encoding?: string
    contentType?: string
  }>
  inReplyTo?: string
  references?: string
}

// Create reusable transporter
export function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })
}

// Send email function
export async function sendEmail(options: EmailOptions) {
  const transporter = createTransporter()

  try {
    const mailOptions: any = {
      from: options.from,
      replyTo: options.replyTo,
      to: options.to.join(', '),
      cc: options.cc?.join(', '),
      bcc: options.bcc?.join(', '),
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
      headers: {
        // Remove unsubscribe link/button added by email providers
        'List-Unsubscribe': '',
        'X-Report-Abuse': '',
        'Precedence': 'bulk',
      },
    }

    // Add threading headers if this is a reply
    if (options.inReplyTo) {
      mailOptions.inReplyTo = options.inReplyTo
    }
    if (options.references) {
      mailOptions.references = options.references
    }

    const info = await transporter.sendMail(mailOptions)

    return {
      success: true,
      messageId: info.messageId,
    }
  } catch (error) {
    console.error('Error sending email:', error)
    throw error
  }
}

// Verify SMTP connection
export async function verifyConnection() {
  const transporter = createTransporter()
  try {
    await transporter.verify()
    return true
  } catch (error) {
    console.error('SMTP connection failed:', error)
    return false
  }
}
