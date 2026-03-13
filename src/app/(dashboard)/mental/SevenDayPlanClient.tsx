'use client'

import { useState } from 'react'

type Props = {
  riskLabel: string
}

const dayTemplates: Record<string, string[]> = {
  '高压力风险': [
    '焦虑急救 5 分钟 + 记录触发点',
    '睡前降压 10 分钟（23:00 前）',
    '职场复位 7 分钟（只做最小动作）',
    '焦虑急救 5 分钟 + 晚间少刷30分钟',
    '睡前降压 10 分钟 + 记录入睡时长',
    '职场复位 7 分钟 + 今天完成1件小事',
    '复测并写一条周总结',
  ],
  '中等压力': [
    '焦虑急救 5 分钟',
    '睡前降压 10 分钟',
    '职场复位 7 分钟',
    '焦虑急救 5 分钟',
    '睡前降压 10 分钟',
    '职场复位 7 分钟',
    '复测并写一条周总结',
  ],
  '状态可维持': [
    '睡前降压 10 分钟',
    '焦虑急救 5 分钟',
    '休息日：仅记录状态',
    '职场复位 7 分钟',
    '睡前降压 10 分钟',
    '焦虑急救 5 分钟',
    '复测并写一条周总结',
  ],
}

export default function SevenDayPlanClient({ riskLabel }: Props) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const key = riskLabel.includes('高') ? '高压力风险' : riskLabel.includes('中') ? '中等压力' : '状态可维持'
  const plan = dayTemplates[key]

  async function create7DayPlan() {
    setLoading(true)
    try {
      for (let i = 0; i < 7; i++) {
        const due = new Date()
        due.setDate(due.getDate() + i)
        due.setHours(20, 0, 0, 0)

        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `心理计划 Day${i + 1}`,
            description: plan[i],
            category: 'OTHER',
            dueDate: due.toISOString(),
          }),
        })
      }
      setDone(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">7天计划引擎</h3>
        <button
          type="button"
          disabled={loading || done}
          onClick={create7DayPlan}
          className="text-sm px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
        >
          {done ? '已生成7天计划' : loading ? '生成中...' : '一键生成7天计划'}
        </button>
      </div>

      <ul className="grid md:grid-cols-2 gap-2 text-sm text-gray-700">
        {plan.map((item, idx) => (
          <li key={idx} className="rounded border border-gray-100 px-3 py-2">
            Day {idx + 1}：{item}
          </li>
        ))}
      </ul>
    </div>
  )
}
