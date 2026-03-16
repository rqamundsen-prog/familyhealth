import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function RecordHistoryPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const sessionUser = session.user as { id?: string; email?: string | null; phone?: string | null }
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        sessionUser.id ? { id: sessionUser.id } : undefined,
        sessionUser.email ? { email: sessionUser.email } : undefined,
        sessionUser.phone ? { phone: sessionUser.phone } : undefined,
      ].filter(Boolean) as any,
    },
    include: { family: true },
  })

  if (!user?.family) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">还没有个人空间</h1>
          <p className="text-sm text-gray-500 mb-4">先回到首页开启“开始我的情绪”，即可查看记录。</p>
          <Link href="/dashboard" className="inline-flex h-9 items-center px-4 rounded bg-blue-600 text-white text-sm">回到首页</Link>
        </div>
      </div>
    )
  }

  const records = await prisma.healthRecord.findMany({
    where: { memberId: user.family.id },
    orderBy: { recordedAt: 'desc' },
    take: 100,
  })

  const typeLabel: Record<string, string> = {
    BEHAVIOR: '行为',
    BLOOD_PRESSURE: '血压',
    GLUCOSE: '血糖',
    WEIGHT: '体重',
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">我的记录</h1>
          <p className="text-sm text-gray-500 mt-1">最近 {records.length} 条，按时间倒序</p>
        </div>
        <div className="flex gap-2">
          <Link href="/records" className="inline-flex h-9 items-center px-4 rounded border border-gray-300 text-sm text-gray-700">继续录入</Link>
          <Link href="/trends" className="inline-flex h-9 items-center px-4 rounded bg-blue-600 text-white text-sm">查看趋势</Link>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {records.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无记录，先去录入第一条</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {records.map((r) => (
              <li key={r.id} className="px-5 py-4 text-sm">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-gray-900">{typeLabel[r.type] || r.type}</span>
                  <span className="text-xs text-gray-400">{format(new Date(r.recordedAt), 'MM-dd HH:mm')}</span>
                </div>
                <div className="text-gray-600 text-xs">
                  {r.type === 'BEHAVIOR' && `情绪 ${r.moodScore || '-'} /5；运动 ${r.exercised ? '是' : '否'}；晚睡 ${r.sleptLate ? '是' : '否'}`}
                  {r.type === 'BLOOD_PRESSURE' && `血压 ${r.systolic || '-'} / ${r.diastolic || '-'} mmHg；心率 ${r.heartRate || '-'}`}
                  {r.type === 'GLUCOSE' && `血糖 ${r.glucose ?? '-'} mmol/L（${r.glucoseType === 'POST_MEAL' ? '餐后2小时' : '空腹'}）`}
                  {r.type === 'WEIGHT' && `体重 ${r.weight ?? '-'} kg`}
                </div>
                {r.note && <p className="text-xs text-gray-500 mt-1">备注：{r.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
