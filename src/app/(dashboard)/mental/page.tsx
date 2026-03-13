import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Brain, Moon, Briefcase, Wind, ArrowRight, AlertTriangle } from 'lucide-react'
import MentalPlannerClient from './MentalPlannerClient'
import SevenDayPlanClient from './SevenDayPlanClient'
import CommunityFlywheelTemplates from './CommunityFlywheelTemplates'

function planByState(avgMood: number, lateSleepDays: number) {
  if (avgMood <= 2.6 || lateSleepDays >= 4) {
    return {
      level: '重点干预',
      text: '本周建议先稳睡眠，再做情绪恢复。每天固定1个10分钟睡前降压流程，连续7天。',
      color: 'text-red-600 bg-red-50 border-red-200',
      riskLabel: '高压力风险',
    }
  }

  if (avgMood <= 3.4 || lateSleepDays >= 2) {
    return {
      level: '温和优化',
      text: '当前状态可改善。建议每天1次5分钟焦虑急救+晚间减少信息刺激。',
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200',
      riskLabel: '中等压力',
    }
  }

  return {
    level: '维持良好',
    text: '状态整体稳定。保持规律作息，每周复盘一次情绪波动触发点即可。',
    color: 'text-green-700 bg-green-50 border-green-200',
    riskLabel: '状态可维持',
  }
}

export default async function MentalSupportPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const sessionUser = session.user as { id?: string; email?: string | null }
  const user = await prisma.user.findUnique({
    where: sessionUser.id ? { id: sessionUser.id } : { email: sessionUser.email! },
    include: { family: true },
  })

  if (!user?.family) {
    return <div className="p-8 text-gray-500">未找到家庭成员信息</div>
  }

  const days14Ago = new Date()
  days14Ago.setDate(days14Ago.getDate() - 14)
  const days7Ago = new Date()
  days7Ago.setDate(days7Ago.getDate() - 7)

  const behaviors = await prisma.healthRecord.findMany({
    where: {
      memberId: user.family.id,
      type: 'BEHAVIOR',
      recordedAt: { gte: days14Ago },
    },
    orderBy: { recordedAt: 'desc' },
    take: 40,
  })

  const familyTasks = await prisma.task.findMany({
    where: {
      familyId: user.family.familyId,
      createdAt: { gte: days7Ago },
      OR: [
        { title: { contains: '心理' } },
        { title: { contains: '焦虑' } },
        { title: { contains: '复测' } },
      ],
    },
    orderBy: { createdAt: 'desc' },
  })

  const validMood = behaviors.filter((b) => typeof b.moodScore === 'number')
  const avgMood = validMood.length
    ? validMood.reduce((s, b) => s + (b.moodScore || 0), 0) / validMood.length
    : 3

  const recent7 = validMood.filter((b) => b.recordedAt >= days7Ago)
  const prev7 = validMood.filter((b) => b.recordedAt < days7Ago)

  const avgRecent7 = recent7.length ? recent7.reduce((s, b) => s + (b.moodScore || 0), 0) / recent7.length : avgMood
  const avgPrev7 = prev7.length ? prev7.reduce((s, b) => s + (b.moodScore || 0), 0) / prev7.length : avgMood
  const delta = avgRecent7 - avgPrev7

  const lateSleepDays = behaviors.filter((b) => b.sleptLate).length
  const exercisedDays = behaviors.filter((b) => b.exercised).length

  const weeklyPlan = planByState(avgMood, lateSleepDays)

  const taskTotal = familyTasks.length
  const taskDone = familyTasks.filter((t) => t.completed).length
  const completionRate = taskTotal ? Math.round((taskDone / taskTotal) * 100) : 0

  const highRisk = avgMood <= 2.3 || lateSleepDays >= 6

  const scenarios = [
    {
      title: '焦虑急救（5分钟）',
      desc: '适合临时焦虑、脑子停不下来、心跳快的时候。',
      icon: Wind,
      href: '/records?type=BEHAVIOR&template=anxiety',
      tone: 'bg-blue-50 border-blue-200 text-blue-700',
    },
    {
      title: '睡前降压（10分钟）',
      desc: '适合睡前思绪过载、入睡困难、容易熬夜。',
      icon: Moon,
      href: '/records?type=BEHAVIOR&template=sleep',
      tone: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    },
    {
      title: '职场复位（7分钟）',
      desc: '适合工作耗竭、注意力分散、情绪波动。',
      icon: Briefcase,
      href: '/records?type=BEHAVIOR&template=work',
      tone: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    },
  ]

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Brain className="text-purple-600" size={24} />
          心理支持中心
        </h1>
        <p className="text-gray-500 mt-1">从记录升级为干预：先分诊，再执行，再复盘。</p>
      </div>

      <MentalPlannerClient />

      {/* P0 结果指标面板 */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">近7天情绪均值</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{avgRecent7.toFixed(1)} / 5</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">较前7天变化</p>
          <p className={`text-2xl font-bold mt-1 ${delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>{delta >= 0 ? '+' : ''}{delta.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">近7天计划完成率</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{completionRate}%</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-500">近14天熬夜次数</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{lateSleepDays}</p>
        </div>
      </div>

      <div className={`rounded-xl border p-4 mb-8 ${weeklyPlan.color}`}>
        <p className="font-semibold mb-1">本周建议：{weeklyPlan.level}</p>
        <p className="text-sm">{weeklyPlan.text}</p>
      </div>

      {highRisk && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 mb-8">
          <p className="text-sm font-semibold text-red-700 flex items-center gap-2"><AlertTriangle size={16} />高风险转介提示</p>
          <p className="text-sm text-red-700 mt-1">如果连续两周明显低落、睡眠严重受损，或出现自伤念头，请尽快联系线下精神心理专科/心理咨询机构，不要独自扛。</p>
          <ul className="text-xs text-red-600 mt-2 list-disc pl-5">
            <li>优先联系本地三甲医院心理科/精神科</li>
            <li>与家人同步当前状态，避免独处升级</li>
            <li>保留近7天情绪与睡眠记录，便于专业评估</li>
          </ul>
        </div>
      )}

      <h2 className="text-lg font-semibold text-gray-800 mb-4">高频场景入口</h2>
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {scenarios.map((s) => {
          const Icon = s.icon
          return (
            <Link key={s.title} href={s.href} className={`rounded-xl border p-5 block transition hover:shadow-sm ${s.tone}`}>
              <div className="flex items-center justify-between mb-3">
                <Icon size={20} />
                <ArrowRight size={16} />
              </div>
              <h3 className="font-semibold text-base">{s.title}</h3>
              <p className="text-sm mt-2 opacity-90">{s.desc}</p>
            </Link>
          )
        })}
      </div>

      <SevenDayPlanClient riskLabel={weeklyPlan.riskLabel} />

      {/* 周报 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
        <h3 className="text-base font-semibold text-gray-900 mb-3">本周报告（自动摘要）</h3>
        <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
          <li>近7天情绪均值：{avgRecent7.toFixed(1)}（前7天：{avgPrev7.toFixed(1)}）</li>
          <li>心理计划任务：已完成 {taskDone}/{taskTotal || 0}（完成率 {completionRate}%）</li>
          <li>近14天熬夜 {lateSleepDays} 次，运动 {exercisedDays} 天</li>
          <li>下周优先动作：{weeklyPlan.riskLabel === '高压力风险' ? '先睡眠后效率' : '保持连续小干预'}</li>
        </ul>
      </div>

      <CommunityFlywheelTemplates />
    </div>
  )
}
