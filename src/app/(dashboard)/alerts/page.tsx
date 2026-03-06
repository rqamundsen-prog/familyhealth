import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
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
    return <div className="p-8 text-center text-gray-400">未加入家庭</div>
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
