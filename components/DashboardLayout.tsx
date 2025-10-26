'use client'

import { ReactNode } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from './ui/Button'
import { Mail, Users, History, LogOut, Shield, FileSignature } from 'lucide-react'
import { clsx } from 'clsx'

interface DashboardLayoutProps {
  children: ReactNode
  userEmail: string
  userRole: string
}

export function DashboardLayout({ children, userEmail, userRole }: DashboardLayoutProps) {
  const pathname = usePathname()

  const navigation = [
    { name: 'Compose', href: '/dashboard', icon: Mail },
    { name: 'History', href: '/dashboard/history', icon: History },
    { name: 'Signature', href: '/dashboard/signature', icon: FileSignature },
  ]

  if (userRole === 'SUPERADMIN') {
    navigation.push({ name: 'Admin', href: '/admin', icon: Shield })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Mail className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-gray-900">
                  Email Sender
                </span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={clsx(
                        'inline-flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
                        isActive
                          ? 'bg-primary-50 text-primary-700'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm">
                <p className="text-gray-900 font-medium">{userEmail}</p>
                <p className="text-gray-500 text-xs">
                  {userRole === 'SUPERADMIN' ? 'Super Admin' : 'User'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
