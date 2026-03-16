import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'
import { TrendsClient } from './TrendsClient'

export default async function TrendsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
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
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-700 font-medium">你还没有开启个人空间</p>
          <p className="text-sm text-gray-500 mt-1">先回到首页点「开始我的情绪」，再来这里看趋势。</p>
          <Link href="/dashboard" className="inline-flex mt-4 h-9 items-center px-4 rounded bg-blue-600 text-white text-sm">回到首页开启</Link>
        </div>
      </div>
    )
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
