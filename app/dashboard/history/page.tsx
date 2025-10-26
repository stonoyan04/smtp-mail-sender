'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { format } from 'date-fns'
import { CheckCircle, XCircle, Clock, Mail, TrendingUp } from 'lucide-react'

interface Email {
  id: string
  from: string
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string
  status: string
  error: string | null
  sentAt: string | null
  createdAt: string
  user: {
    email: string
  }
}

interface Stats {
  total: number
  sent: number
  failed: number
  pending: number
  rateLimit: {
    remaining: number
    resetAt: string
  }
}

export default function HistoryPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [emails, setEmails] = useState<Email[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session) {
      fetchData()
    }
  }, [session, status, router])

  const fetchData = async () => {
    try {
      const [emailsRes, statsRes] = await Promise.all([
        fetch('/api/email/history?limit=50'),
        fetch('/api/email/stats'),
      ])

      if (emailsRes.ok) {
        const data = await emailsRes.json()
        setEmails(data.emails)
      }

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SENT':
        return 'Sent'
      case 'FAILED':
        return 'Failed'
      case 'PENDING':
        return 'Pending'
      default:
        return status
    }
  }

  return (
    <DashboardLayout userEmail={session.user.email} userRole={session.user.role}>
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Email History</h1>

        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Emails</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                </div>
                <Mail className="h-8 w-8 text-gray-400" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sent</p>
                  <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Failed</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
                </div>
                <XCircle className="h-8 w-8 text-red-400" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Rate Limit Remaining</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.rateLimit.remaining}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  {session.user.role === 'SUPERADMIN' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sender
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {emails.length === 0 ? (
                  <tr>
                    <td colSpan={session.user.role === 'SUPERADMIN' ? 5 : 4} className="px-6 py-8 text-center text-gray-500">
                      No emails found
                    </td>
                  </tr>
                ) : (
                  emails.map((email) => (
                    <tr key={email.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(email.status)}
                          <span className="text-sm font-medium">
                            {getStatusText(email.status)}
                          </span>
                        </div>
                        {email.error && (
                          <p className="text-xs text-red-600 mt-1">{email.error}</p>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900 max-w-xs truncate">
                          {email.subject}
                        </div>
                        <div className="text-xs text-gray-500">
                          From: {email.from}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {email.to.join(', ')}
                        </div>
                        {(email.cc.length > 0 || email.bcc.length > 0) && (
                          <div className="text-xs text-gray-500">
                            {email.cc.length > 0 && `CC: ${email.cc.join(', ')}`}
                            {email.cc.length > 0 && email.bcc.length > 0 && ' | '}
                            {email.bcc.length > 0 && `BCC: ${email.bcc.length} recipient(s)`}
                          </div>
                        )}
                      </td>
                      {session.user.role === 'SUPERADMIN' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {email.user.email}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {email.sentAt
                          ? format(new Date(email.sentAt), 'MMM d, yyyy h:mm a')
                          : format(new Date(email.createdAt), 'MMM d, yyyy h:mm a')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
