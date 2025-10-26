import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DashboardLayout } from '@/components/DashboardLayout'
import { EmailComposer } from '@/components/EmailComposer'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/login')
  }

  const fromAddress = session.user.fromAddress || session.user.email

  return (
    <DashboardLayout
      userEmail={session.user.email}
      userRole={session.user.role}
    >
      <div className="max-w-4xl">
        <EmailComposer fromAddress={fromAddress} userRole={session.user.role} />
      </div>
    </DashboardLayout>
  )
}
