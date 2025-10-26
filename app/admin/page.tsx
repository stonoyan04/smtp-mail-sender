'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { UserPlus, Trash2, Edit, Mail, FileSignature } from 'lucide-react'
import { format } from 'date-fns'
import { env } from '@/lib/env'

interface User {
  id: string
  email: string
  role: string
  fromAddress: string | null
  createdAt: string
  _count: {
    emails: number
  }
  signatureEnabled?: boolean
}

export default function AdminPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editingSignatureUser, setEditingSignatureUser] = useState<User | null>(null)
  const [error, setError] = useState('')
  const [signatureError, setSignatureError] = useState('')
  const [signatureSuccess, setSignatureSuccess] = useState('')

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fromAddress: '',
  })

  const [signatureData, setSignatureData] = useState({
    signatureHtml: '',
    signatureEnabled: false,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session?.user?.role !== 'SUPERADMIN') {
      router.push('/dashboard')
    } else {
      fetchUsers()
    }
  }, [session, status, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (err) {
      console.error('Error fetching users:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PATCH' : 'POST'

      const body: any = {
        email: formData.email,
      }

      if (formData.fromAddress) {
        body.fromAddress = formData.fromAddress
      }

      if (!editingUser || formData.password) {
        body.password = formData.password
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save user')
      }

      setIsModalOpen(false)
      setFormData({ email: '', password: '', fromAddress: '' })
      setEditingUser(null)
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleDelete = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return

    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      fetchUsers()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const openEditModal = (user: User) => {
    setEditingUser(user)
    setFormData({
      email: user.email,
      password: '',
      fromAddress: user.fromAddress || '',
    })
    setIsModalOpen(true)
  }

  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({ email: '', password: '', fromAddress: '' })
    setIsModalOpen(true)
  }

  const openSignatureModal = async (user: User) => {
    setEditingSignatureUser(user)
    setSignatureError('')
    setSignatureSuccess('')

    try {
      const response = await fetch(`/api/users/${user.id}/signature`)
      if (response.ok) {
        const result = await response.json()
        setSignatureData({
          signatureHtml: result.data.signatureHtml || '',
          signatureEnabled: result.data.signatureEnabled,
        })
      }
    } catch (err: any) {
      setSignatureError(err.message)
    }

    setIsSignatureModalOpen(true)
  }

  const handleSaveSignature = async (e: React.FormEvent) => {
    e.preventDefault()
    setSignatureError('')
    setSignatureSuccess('')

    if (!editingSignatureUser) return

    try {
      const response = await fetch(`/api/users/${editingSignatureUser.id}/signature`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signatureData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save signature')
      }

      setSignatureSuccess('Signature saved successfully!')
      setTimeout(() => {
        setIsSignatureModalOpen(false)
        setEditingSignatureUser(null)
        setSignatureData({ signatureHtml: '', signatureEnabled: false })
      }, 1500)
    } catch (err: any) {
      setSignatureError(err.message)
    }
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!session || session.user.role !== 'SUPERADMIN') {
    return null
  }

  return (
    <DashboardLayout userEmail={session.user.email} userRole={session.user.role}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <Button onClick={openCreateModal} className="flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Create User
          </Button>
        </div>

        <div className="bg-white shadow-md rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  From Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Emails Sent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.email}
                        </div>
                        {user.role === 'SUPERADMIN' && (
                          <div className="text-xs text-primary-600 font-medium">
                            Super Admin
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 flex items-center gap-1">
                      {user.fromAddress ? (
                        <>
                          <Mail className="h-3 w-3 text-gray-400" />
                          {user.fromAddress}
                        </>
                      ) : (
                        <span className="text-gray-400">Not set</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user._count.emails}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(user.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditModal(user)}
                        title="Edit user"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openSignatureModal(user)}
                        title="Manage signature"
                      >
                        <FileSignature className={`h-4 w-4 ${user.signatureEnabled ? 'text-green-600' : 'text-gray-400'}`} />
                      </Button>
                      {user.role !== 'SUPERADMIN' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id)}
                          title="Delete user"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingUser(null)
          setFormData({ email: '', password: '', fromAddress: '' })
          setError('')
        }}
        title={editingUser ? 'Edit User' : 'Create User'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <Input
              label="Email"
              type="email"
              placeholder={`user@${env.domain}`}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Must end with @{env.domain}
            </p>
          </div>

          <div>
            <Input
              label={editingUser ? 'Password (leave blank to keep current)' : 'Password'}
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required={!editingUser}
              placeholder="Minimum 8 characters"
            />
            {!editingUser && (
              <p className="mt-1 text-xs text-gray-500">
                Password must be at least 8 characters long
              </p>
            )}
          </div>

          <div>
            <Input
              label="From Address (optional)"
              type="email"
              placeholder={`user@${env.domain}`}
              value={formData.fromAddress}
              onChange={(e) => setFormData({ ...formData, fromAddress: e.target.value })}
            />
            <p className="mt-1 text-xs text-gray-500">
              Must end with @{env.domain}
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsModalOpen(false)
                setEditingUser(null)
                setFormData({ email: '', password: '', fromAddress: '' })
                setError('')
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              {editingUser ? 'Update' : 'Create'} User
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false)
          setEditingSignatureUser(null)
          setSignatureData({ signatureHtml: '', signatureEnabled: false })
          setSignatureError('')
          setSignatureSuccess('')
        }}
        title={`Manage Signature - ${editingSignatureUser?.email}`}
      >
        <form onSubmit={handleSaveSignature} className="space-y-4">
          {signatureError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {signatureError}
            </div>
          )}

          {signatureSuccess && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
              {signatureSuccess}
            </div>
          )}

          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <h4 className="text-sm font-semibold">Enable Signature</h4>
              <p className="text-xs text-gray-600">
                Automatically append signature to user&apos;s emails
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={signatureData.signatureEnabled}
                onChange={(e) => setSignatureData({ ...signatureData, signatureEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Signature HTML
            </label>
            <textarea
              value={signatureData.signatureHtml}
              onChange={(e) => setSignatureData({ ...signatureData, signatureHtml: e.target.value })}
              className="w-full h-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Enter signature HTML..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Preview
            </label>
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[100px]">
              {signatureData.signatureHtml ? (
                <div dangerouslySetInnerHTML={{ __html: signatureData.signatureHtml }} />
              ) : (
                <p className="text-gray-400 italic text-sm">Preview will appear here</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsSignatureModalOpen(false)
                setEditingSignatureUser(null)
                setSignatureData({ signatureHtml: '', signatureEnabled: false })
                setSignatureError('')
                setSignatureSuccess('')
              }}
            >
              Cancel
            </Button>
            <Button type="submit">
              Save Signature
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
