import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { assessBPRisk, assessGlucoseRisk, calculateHealthScore, scoreToStatus } from '@/lib/risk'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { AlertTriangle, Heart, Activity, Weight, TrendingUp, TrendingDown, Minus, CheckCircle, Bell } from 'lucide-react'
import Link from 'next/link'
import OnboardingCard from './OnboardingCard'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  // 支持手机号和邮箱登录的用户：优先用 id，fallback 用 email
  const sessionUser = session.user as { id?: string; email?: string | null }
  const userId = sessionUser.id
  const userEmail = sessionUser.email

  const user = await prisma.user.findUnique({
    where: userId ? { id: userId } : { email: userEmail! },
    include: {
      family: {
        include: {
          family: {
            include: {
              members: {
                include: {
                  records: {
                    orderBy: { recordedAt: 'desc' },
                    take: 30,
                  },
                  alerts: {
                    where: { resolved: false },
                    orderBy: { createdAt: 'desc' },
                  },
                },
              },
              tasks: {
                orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }],
                take: 4,
              },
            },
          },
        },
      },
    },
  })

  if (!user?.family?.family) {
    return <OnboardingCard />
  }

  const family = user.family.family
  const members = family.members

  // 计算每个成员的健康概览
  const memberSummaries = members.map(member => {
    const bpRecords = member.records.filter(r => r.type === 'BLOOD_PRESSURE' && r.systolic && r.diastolic)
    const glucoseRecords = member.records.filter(r => r.type === 'GLUCOSE' && r.glucose)
    const weightRecords = member.records.filter(r => r.type === 'WEIGHT' && r.weight)

    const latestBP = bpRecords[0]
    const latestGlucose = glucoseRecords[0]
    const latestWeight = weightRecords[0]

    const bpLevel = latestBP
      ? assessBPRisk({ systolic: latestBP.systolic!, diastolic: latestBP.diastolic! }).level
      : 'GREEN'
    const glucoseLevel = latestGlucose && latestGlucose.glucoseType
      ? assessGlucoseRisk({ value: latestGlucose.glucose!, type: latestGlucose.glucoseType as 'FASTING' | 'POST_MEAL' }).level
      : 'GREEN'

    // 最近7天行为记录
    const recentBehavior = member.records.filter(r => {
      const days7Ago = new Date()
      days7Ago.setDate(days7Ago.getDate() - 7)
      return r.type === 'BEHAVIOR' && new Date(r.recordedAt) >= days7Ago
    })
    const recentExercise = recentBehavior.some(r => r.exercised)
    const lateSleepCount = recentBehavior.filter(r => r.sleptLate).length

    const score = calculateHealthScore({ bpLevel, glucoseLevel, recentExercise, recentFamilyDinner: true, lateSleepCount })
    const status = scoreToStatus(score)

    // 血压趋势（对比7天前）
    const recent7 = bpRecords.slice(0, 7)
    const older7 = bpRecords.slice(7, 14)
    let trend: 'IMPROVING' | 'STABLE' | 'WORSENING' = 'STABLE'
    if (recent7.length > 0 && older7.length > 0) {
      const avgRecent = recent7.reduce((s, r) => s + r.systolic!, 0) / recent7.length
      const avgOlder = older7.reduce((s, r) => s + r.systolic!, 0) / older7.length
      if (avgRecent < avgOlder - 3) trend = 'IMPROVING'
      else if (avgRecent > avgOlder + 3) trend = 'WORSENING'
    }

    return {
      member,
      latestBP,
      latestGlucose,
      latestWeight,
      bpLevel,
      glucoseLevel,
      score,
      status,
      trend,
      alertCount: member.alerts.length,
    }
  })

  const totalAlerts = memberSummaries.reduce((s, m) => s + m.alertCount, 0)
  const pendingTasks = family.tasks.filter(t => !t.completed).length
  const completedTasks = family.tasks.filter(t => t.completed).length

  const roleLabels: Record<string, string> = {
    FATHER: '爸爸',
    MOTHER: '妈妈',
    CHILD: '孩子',
    GRANDPARENT: '祖父母',
    OTHER: '成员',
  }

  const levelColors: Record<string, string> = {
    GREEN: 'text-green-600',
    YELLOW: 'text-yellow-600',
    RED: 'text-red-600',
  }

  const levelBg: Record<string, string> = {
    GREEN: 'bg-green-50 border-green-200',
    YELLOW: 'bg-yellow-50 border-yellow-200',
    RED: 'bg-red-50 border-red-200',
  }

  return (
    <div className="p-8">
      {/* 页头 */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{family.name}</h1>
          <p className="text-gray-500 mt-1">
            {format(new Date(), 'yyyy年MM月dd日 EEEE', { locale: zhCN })}
          </p>
        </div>
        <Link
          href="/records"
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + 录入数据
        </Link>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">家庭成员</span>
            <Heart size={18} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{members.length}</p>
          <p className="text-xs text-gray-400 mt-1">
            {members.filter(m => m.hasTripleHigh).length} 位三高成员
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">待处理预警</span>
            <Bell size={18} className={totalAlerts > 0 ? 'text-red-500' : 'text-gray-400'} />
          </div>
          <p className={`text-2xl font-bold ${totalAlerts > 0 ? 'text-red-600' : 'text-gray-900'}`}>
            {totalAlerts}
          </p>
          <Link href="/alerts" className="text-xs text-blue-600 hover:underline mt-1 inline-block">
            查看详情 →
          </Link>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">本周任务</span>
            <CheckCircle size={18} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {completedTasks}/{completedTasks + pendingTasks}
          </p>
          <p className="text-xs text-gray-400 mt-1">已完成</p>
        </div>
      </div>

      {/* 心理支持入口 */}
      <div className="mb-8 rounded-xl border border-purple-200 bg-purple-50 p-5 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-purple-900">心理支持已上线：焦虑 / 睡眠 / 职场压力</h2>
          <p className="text-sm text-purple-700 mt-1">先做3-10分钟小干预，再记录情绪与行为，连续7天看改善。</p>
        </div>
        <Link
          href="/mental"
          className="inline-flex items-center gap-2 bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          进入心理支持
        </Link>
      </div>

      {/* 成员健康卡片 */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">家庭成员健康状态</h2>
      <div className="grid grid-cols-1 gap-4 mb-8 lg:grid-cols-2">
        {memberSummaries.map(({ member, latestBP, latestGlucose, latestWeight, bpLevel, glucoseLevel, score, status, trend, alertCount }) => (
          <div
            key={member.id}
            className={`bg-white rounded-xl border p-6 ${alertCount > 0 ? 'border-red-200' : 'border-gray-200'}`}
          >
            {/* 成员头部 */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-sm">
                  {member.nickname.slice(0, 1)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{member.nickname}</p>
                  <p className="text-xs text-gray-400">{roleLabels[member.role] || member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {alertCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full">
                    <AlertTriangle size={12} />
                    {alertCount} 条预警
                  </span>
                )}
                <div className={`text-center px-3 py-1.5 rounded-lg ${status.bgColor}`}>
                  <p className={`text-xl font-bold ${status.color}`}>{score}</p>
                  <p className={`text-xs ${status.color}`}>{status.label}</p>
                </div>
              </div>
            </div>

            {/* 健康指标 */}
            <div className="grid grid-cols-3 gap-3">
              {/* 血压 */}
              <div className={`rounded-lg border p-3 ${levelBg[bpLevel]}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Activity size={14} className={levelColors[bpLevel]} />
                  <span className="text-xs text-gray-500">血压</span>
                </div>
                {latestBP ? (
                  <>
                    <p className={`text-sm font-bold ${levelColors[bpLevel]}`}>
                      {latestBP.systolic}/{latestBP.diastolic}
                    </p>
                    <p className="text-xs text-gray-400">mmHg</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">暂无数据</p>
                )}
              </div>

              {/* 血糖 */}
              <div className={`rounded-lg border p-3 ${levelBg[glucoseLevel]}`}>
                <div className="flex items-center gap-1.5 mb-2">
                  <Heart size={14} className={levelColors[glucoseLevel]} />
                  <span className="text-xs text-gray-500">血糖</span>
                </div>
                {latestGlucose ? (
                  <>
                    <p className={`text-sm font-bold ${levelColors[glucoseLevel]}`}>
                      {latestGlucose.glucose?.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-400">mmol/L</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">暂无数据</p>
                )}
              </div>

              {/* 体重 */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <Weight size={14} className="text-gray-500" />
                  <span className="text-xs text-gray-500">体重</span>
                </div>
                {latestWeight ? (
                  <>
                    <p className="text-sm font-bold text-gray-700">{latestWeight.weight?.toFixed(1)}</p>
                    <p className="text-xs text-gray-400">kg</p>
                  </>
                ) : (
                  <p className="text-xs text-gray-400">暂无数据</p>
                )}
              </div>
            </div>

            {/* 趋势 */}
            {latestBP && (
              <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                {trend === 'IMPROVING' && <><TrendingDown size={13} className="text-green-500" /><span className="text-green-600">血压趋势改善中</span></>}
                {trend === 'STABLE' && <><Minus size={13} className="text-gray-400" /><span>血压趋势平稳</span></>}
                {trend === 'WORSENING' && <><TrendingUp size={13} className="text-red-500" /><span className="text-red-600">血压有上升趋势，需关注</span></>}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 本周任务 */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4">家庭任务</h2>
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {family.tasks.length === 0 ? (
          <div className="p-8 text-center text-gray-400">暂无任务</div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {family.tasks.map(task => (
              <li key={task.id} className="flex items-center gap-4 px-6 py-4">
                <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${task.completed ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                  {task.completed && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                    {task.title}
                  </p>
                  {task.description && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
                  )}
                </div>
                {task.dueDate && (
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {format(new Date(task.dueDate), 'MM/dd')}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
          <Link href="/tasks" className="text-sm text-blue-600 hover:underline">
            查看全部任务 →
          </Link>
        </div>
      </div>
    </div>
  )
}
