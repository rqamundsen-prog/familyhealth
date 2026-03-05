import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { scoreToStatus, assessBPRisk } from '@/lib/risk'
import Link from 'next/link'
import { AlertTriangle, Users, TrendingUp, MessageSquare } from 'lucide-react'

export default async function AdminPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
  })

  if (!user || (user.role !== 'MANAGER' && user.role !== 'ADMIN')) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">此页面仅限健康管理师访问</p>
        <Link href="/dashboard" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          返回仪表盘
        </Link>
      </div>
    )
  }

  const families = await prisma.family.findMany({
    where: { managerId: user.id },
    include: {
      members: {
        include: {
          alerts: { where: { resolved: false } },
          records: {
            orderBy: { recordedAt: 'desc' },
            take: 10,
          },
        },
      },
      notes: {
        orderBy: { createdAt: 'desc' },
        take: 1,
        include: { author: true },
      },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // 计算每个家庭的风险分数
  const familyRisks = families.map(family => {
    let maxAlerts = 0
    let redCount = 0
    let tripleHighCount = 0

    for (const member of family.members) {
      maxAlerts += member.alerts.length
      redCount += member.alerts.filter(a => a.level === 'RED').length
      if (member.hasTripleHigh) tripleHighCount++
    }

    const riskLevel = redCount > 0 ? 'RED' : maxAlerts > 0 ? 'YELLOW' : 'GREEN'
    return { family, maxAlerts, redCount, tripleHighCount, riskLevel }
  }).sort((a, b) => {
    // 红色 > 黄色 > 绿色
    const lvl = { RED: 3, YELLOW: 2, GREEN: 1 }
    return lvl[b.riskLevel as keyof typeof lvl] - lvl[a.riskLevel as keyof typeof lvl]
  })

  const totalFamilies = families.length
  const totalAlerts = familyRisks.reduce((s, f) => s + f.maxAlerts, 0)
  const redFamilies = familyRisks.filter(f => f.riskLevel === 'RED').length

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">管理师后台</h1>
        <p className="text-gray-500 mt-1">你好，{user.name}。以下是你负责的家庭健康状况。</p>
      </div>

      {/* 概览 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Users size={18} className="text-blue-500" />
            <span className="text-sm text-gray-500">管理家庭数</span>
          </div>
          <p className="text-3xl font-bold text-gray-900">{totalFamilies}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={18} className="text-yellow-500" />
            <span className="text-sm text-gray-500">待处理预警</span>
          </div>
          <p className="text-3xl font-bold text-yellow-600">{totalAlerts}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp size={18} className="text-red-500" />
            <span className="text-sm text-gray-500">红色预警家庭</span>
          </div>
          <p className="text-3xl font-bold text-red-600">{redFamilies}</p>
        </div>
      </div>

      {/* 家庭风险列表 */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">家庭风险排序</h2>
      <div className="space-y-4">
        {familyRisks.map(({ family, maxAlerts, redCount, tripleHighCount, riskLevel }) => (
          <div
            key={family.id}
            className={`bg-white rounded-xl border p-5 ${
              riskLevel === 'RED' ? 'border-red-200' :
              riskLevel === 'YELLOW' ? 'border-yellow-200' :
              'border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-gray-900">{family.name}</h3>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    riskLevel === 'RED' ? 'bg-red-100 text-red-700' :
                    riskLevel === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {riskLevel === 'RED' ? '需要立即跟进' : riskLevel === 'YELLOW' ? '需要关注' : '状态良好'}
                  </span>
                </div>
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>{family.members.length} 名成员</span>
                  <span>{tripleHighCount} 名三高患者</span>
                  {maxAlerts > 0 && (
                    <span className={redCount > 0 ? 'text-red-600 font-medium' : 'text-yellow-600'}>
                      {maxAlerts} 条未解决预警
                      {redCount > 0 && ` (${redCount} 条红色)`}
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right">
                {family.notes[0] && (
                  <div className="text-xs text-gray-400 max-w-xs text-right">
                    <MessageSquare size={12} className="inline mr-1" />
                    {family.notes[0].content.slice(0, 40)}...
                  </div>
                )}
              </div>
            </div>

            {/* 成员血压速览 */}
            <div className="mt-4 flex gap-3">
              {family.members.filter(m => m.hasTripleHigh).map(member => {
                const latestBP = member.records.find(r => r.type === 'BLOOD_PRESSURE' && r.systolic)
                const bpRisk = latestBP
                  ? assessBPRisk({ systolic: latestBP.systolic!, diastolic: latestBP.diastolic! })
                  : null

                return (
                  <div
                    key={member.id}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                      bpRisk?.level === 'RED' ? 'bg-red-50' :
                      bpRisk?.level === 'YELLOW' ? 'bg-yellow-50' :
                      'bg-gray-50'
                    }`}
                  >
                    <span className="font-medium text-gray-700">{member.nickname}</span>
                    {latestBP ? (
                      <span className={`font-mono text-xs ${
                        bpRisk?.level === 'RED' ? 'text-red-600' :
                        bpRisk?.level === 'YELLOW' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {latestBP.systolic}/{latestBP.diastolic}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-400">无记录</span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {families.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-16 text-center text-gray-400">
            暂无管理家庭
          </div>
        )}
      </div>
    </div>
  )
}
