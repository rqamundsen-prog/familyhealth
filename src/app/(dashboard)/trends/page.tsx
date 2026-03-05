import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { TrendsClient } from './TrendsClient'

export default async function TrendsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: {
      family: {
        include: {
          family: {
            include: {
              members: true,
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
  const defaultMemberId = user.family.id

  // 获取默认成员最近30天数据
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const records = await prisma.healthRecord.findMany({
    where: {
      memberId: defaultMemberId,
      recordedAt: { gte: thirtyDaysAgo },
    },
    orderBy: { recordedAt: 'asc' },
  })

  const bpData = records
    .filter(r => r.type === 'BLOOD_PRESSURE' && r.systolic && r.diastolic)
    .map(r => ({
      date: format(new Date(r.recordedAt), 'MM/dd'),
      systolic: r.systolic!,
      diastolic: r.diastolic!,
      heartRate: r.heartRate ?? undefined,
    }))

  const glucoseData = records
    .filter(r => r.type === 'GLUCOSE' && r.glucose)
    .map(r => ({
      date: format(new Date(r.recordedAt), 'MM/dd'),
      value: r.glucose!,
      type: r.glucoseType || 'FASTING',
    }))

  const weightData = records
    .filter(r => r.type === 'WEIGHT' && r.weight)
    .map(r => ({
      date: format(new Date(r.recordedAt), 'MM/dd'),
      weight: r.weight!,
    }))

  return (
    <TrendsClient
      members={members}
      defaultMemberId={defaultMemberId}
      initialBPData={bpData}
      initialGlucoseData={glucoseData}
      initialWeightData={weightData}
    />
  )
}
