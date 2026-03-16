import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react'
import { AlertsClient } from './AlertsClient'

export default async function AlertsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: {
      family: {
        include: {
          family: {
            include: {
              members: {
                include: {
                  alerts: {
                    orderBy: { createdAt: 'desc' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  if (!user?.family?.family) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-700 font-medium">你还没有开启个人空间</p>
          <p className="text-sm text-gray-500 mt-1">先回到首页点「开始我的情绪」，再来这里看风险提示。</p>
          <Link href="/dashboard" className="inline-flex mt-4 h-9 items-center px-4 rounded bg-blue-600 text-white text-sm">回到首页开启</Link>
        </div>
      </div>
    )
  }

  const members = user.family.family.members
  const allAlerts = members.flatMap(m =>
    m.alerts.map(a => ({
      ...a,
      memberName: m.nickname,
      memberRole: m.role,
    }))
  ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return <AlertsClient initialAlerts={allAlerts} />
}
