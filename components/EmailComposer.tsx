'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { EmailEditor } from './EmailEditor'
import { Send, X, Reply, Upload } from 'lucide-react'

interface EmailComposerProps {
  fromAddress: string
  userRole: string
  onSendSuccess?: () => void
}

interface ReplyData {
  to: string
  subject: string
  inReplyTo: string
  references: string
  quotedHtml: string
}

export function EmailComposer({ fromAddress, userRole, onSendSuccess }: EmailComposerProps) {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCc, setShowCc] = useState(false)
  const [showBcc, setShowBcc] = useState(false)
  const [isReplyMode, setIsReplyMode] = useState(false)
  const [replyData, setReplyData] = useState<ReplyData | null>(null)
  const [parsingEml, setParsingEml] = useState(false)
  const emlInputRef = useRef<HTMLInputElement>(null)

  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    bodyHtml: '',
    replyTo: '',
  })

  const handleEmlUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setParsingEml(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/email/parse-eml', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to parse EML file')
      }

      const result = await response.json()
      const parsed = result.data

      // Set reply mode with parsed data
      const subject = parsed.subject.startsWith('Re: ') ? parsed.subject : `Re: ${parsed.subject}`
      const references = parsed.references ? `${parsed.references} ${parsed.messageId}` : parsed.messageId

      // Build "Reply All" recipient lists
      // To: original sender
      const replyTo = parsed.from

      // CC: all original To recipients (except current user) + all original CC recipients (except current user)
      const allOriginalRecipients = [
        ...(Array.isArray(parsed.to) ? parsed.to : [parsed.to]),
        ...(Array.isArray(parsed.cc) ? parsed.cc : [])
      ].filter(Boolean)

      // Get current user's email (use fromAddress prop which is the actual sending email)
      const currentUserEmail = fromAddress.toLowerCase()

      // Remove current user and original sender from CC list
      const ccList = allOriginalRecipients
        .filter(email => {
          if (!email) return false
          const emailLower = email.toLowerCase()
          return emailLower !== currentUserEmail && emailLower !== parsed.from.toLowerCase()
        })

      setReplyData({
        to: replyTo,
        subject,
        inReplyTo: parsed.inReplyTo,
        references,
        quotedHtml: parsed.quotedHtml,
      })

      setFormData({
        to: replyTo,
        cc: ccList.join(', '),
        bcc: '',
        subject,
        bodyHtml: '',
        replyTo: '',
      })

      // Show CC field if there are CC recipients
      if (ccList.length > 0) {
        setShowCc(true)
      }

      setIsReplyMode(true)
    } catch (err: any) {
      setError(err.message || 'Failed to parse EML file')
    } finally {
      setParsingEml(false)
      if (emlInputRef.current) {
        emlInputRef.current.value = ''
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setSuccess('')

    try {
      // Parse email addresses
      const to = formData.to.split(',').map(e => e.trim()).filter(Boolean)
      const cc = formData.cc.split(',').map(e => e.trim()).filter(Boolean)
      const bcc = formData.bcc.split(',').map(e => e.trim()).filter(Boolean)

      if (to.length === 0) {
        setError('Please enter at least one recipient')
        setIsLoading(false)
        return
      }

      // Prepare body HTML with quoted message for replies
      let finalBodyHtml = formData.bodyHtml
      if (isReplyMode && replyData?.quotedHtml) {
        finalBodyHtml = `${formData.bodyHtml}<br><br>${replyData.quotedHtml}`
      }

      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to,
          cc,
          bcc,
          subject: formData.subject,
          bodyHtml: finalBodyHtml,
          replyTo: formData.replyTo || undefined,
          inReplyTo: isReplyMode ? replyData?.inReplyTo : undefined,
          references: isReplyMode ? replyData?.references : undefined,
          isReply: isReplyMode,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send email')
      }

      setSuccess('Email sent successfully!')

      // Reset form
      setFormData({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        bodyHtml: '',
        replyTo: '',
      })
      setShowCc(false)
      setShowBcc(false)
      setIsReplyMode(false)
      setReplyData(null)

      onSendSuccess?.()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Compose Email</h2>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => emlInputRef.current?.click()}
            isLoading={parsingEml}
            className="flex items-center gap-2"
          >
            <Reply className="h-4 w-4" />
            Reply to EML
          </Button>
          <input
            ref={emlInputRef}
            type="file"
            accept=".eml,.msg"
            onChange={handleEmlUpload}
            className="hidden"
          />
        </div>
      </div>

      {isReplyMode && replyData && (
        <div className="mb-4 bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg flex items-start">
          <Reply className="h-5 w-5 mr-2 mt-0.5" />
          <span className="flex-1">
            Replying to: <strong>{replyData.to}</strong>
          </span>
          <button onClick={() => {
            setIsReplyMode(false)
            setReplyData(null)
            setFormData({
              to: '',
              cc: '',
              bcc: '',
              subject: '',
              bodyHtml: '',
              replyTo: '',
            })
          }}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start">
          <span className="flex-1">{error}</span>
          <button onClick={() => setError('')}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-start">
          <span className="flex-1">{success}</span>
          <button onClick={() => setSuccess('')}>
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="bg-gray-50 p-3 rounded-lg">
          <p className="text-sm text-gray-600">
            From: <span className="font-medium text-gray-900">{fromAddress}</span>
          </p>
        </div>

        <Input
          label="To"
          type="text"
          placeholder="recipient@example.com, another@example.com"
          value={formData.to}
          onChange={(e) => setFormData({ ...formData, to: e.target.value })}
          disabled={isReplyMode}
          required
        />

        <div className="flex gap-2">
          {!showCc && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowCc(true)}
            >
              Add Cc
            </Button>
          )}
          {!showBcc && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowBcc(true)}
            >
              Add Bcc
            </Button>
          )}
        </div>

        {showCc && (
          <div>
            <Input
              label="Cc"
              type="text"
              placeholder="cc@example.com, another@example.com"
              value={formData.cc}
              onChange={(e) => setFormData({ ...formData, cc: e.target.value })}
            />
            {isReplyMode && (
              <p className="mt-1 text-xs text-gray-500">
                Add additional CC recipients (optional)
              </p>
            )}
          </div>
        )}

        {showBcc && (
          <div>
            <Input
              label="Bcc"
              type="text"
              placeholder="bcc@example.com, another@example.com"
              value={formData.bcc}
              onChange={(e) => setFormData({ ...formData, bcc: e.target.value })}
            />
            {isReplyMode && (
              <p className="mt-1 text-xs text-gray-500">
                Add additional BCC recipients (optional)
              </p>
            )}
          </div>
        )}

        {userRole === 'SUPERADMIN' && (
          <Input
            label="Reply-To (optional)"
            type="email"
            placeholder="reply@example.com"
            value={formData.replyTo}
            onChange={(e) => setFormData({ ...formData, replyTo: e.target.value })}
          />
        )}

        <Input
          label="Subject"
          type="text"
          placeholder="Email subject"
          value={formData.subject}
          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
          disabled={isReplyMode}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message
          </label>
          <EmailEditor
            content={formData.bodyHtml}
            onChange={(html) => setFormData({ ...formData, bodyHtml: html })}
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            isLoading={isLoading}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send Email
          </Button>
        </div>
      </form>
    </div>
  )
}
