'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'

type TriageResult = {
  level: 'LOW' | 'MID' | 'HIGH'
  label: string
  summary: string
  action: string[]
  riskNote?: string
}

function calcResult(score: number): TriageResult {
  if (score >= 10) {
    return {
      level: 'HIGH',
      label: '高压力风险',
      summary: '你当前压力负荷偏高，先降压稳态，再谈效率提升。',
      action: [
        '今晚执行「睡前降压」10分钟',
        '明天中午做1次「焦虑急救」5分钟',
        '连续7天记录情绪与睡眠，再看趋势',
      ],
      riskNote: '若连续两周明显情绪低落、失眠加重或出现自伤念头，请尽快联系专业机构。',
    }
  }

  if (score >= 6) {
    return {
      level: 'MID',
      label: '中等压力',
      summary: '你处在可逆区间，关键是用小动作持续拉回状态。',
      action: [
        '每天固定1次「焦虑急救」5分钟',
        '每晚减少30分钟信息输入',
        '3天后复测，看分值是否下降',
      ],
    }
  }

  return {
    level: 'LOW',
    label: '状态可维持',
    summary: '当前总体稳定，重点是守住作息和节奏。',
    action: ['每周完成3次轻干预', '保持运动与晚间放松', '出现波动时优先做5分钟急救流程'],
  }
}

export default function MentalPlannerClient() {
  const [answers, setAnswers] = useState<number[]>([1, 1, 1, 1])
  const [generated, setGenerated] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [taskDone, setTaskDone] = useState(false)

  const score = useMemo(() => answers.reduce((s, n) => s + n, 0), [answers])
  const result = useMemo(() => calcResult(score), [score])

  async function createReminderTask() {
    setCreatingTask(true)
    try {
      const due = new Date()
      due.setDate(due.getDate() + 1)
      due.setHours(20, 0, 0, 0)

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: '心理状态复测（5分钟）',
          description: `根据今日分诊结果（${result.label}），明晚固定做一次简短复测与干预。`,
          category: 'OTHER',
          dueDate: due.toISOString(),
        }),
      })
      if (res.ok) setTaskDone(true)
    } finally {
      setCreatingTask(false)
    }
  }

  const questions = [
    '过去3天，你是否经常感到脑子停不下来？',
    '过去3天，你是否明显更容易烦躁或低落？',
    '过去3天，你的入睡是否变难或睡醒仍很累？',
    '过去3天，压力是否影响了你正常做事？',
  ]

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">60秒分诊</h2>
      <p className="text-sm text-gray-500 mb-5">先判断当前压力层级，再给你最小可执行方案。</p>

      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q} className="rounded-lg border border-gray-100 p-4">
            <p className="text-sm text-gray-800 mb-3">{idx + 1}. {q}</p>
            <div className="grid grid-cols-4 gap-2 text-xs">
              {['几乎没有', '偶尔', '经常', '几乎每天'].map((label, v) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => {
                    const next = [...answers]
                    next[idx] = v
                    setAnswers(next)
                  }}
                  className={`px-2 py-2 rounded border transition ${
                    answers[idx] === v
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between">
        <p className="text-sm text-gray-500">当前分值：<span className="font-semibold text-gray-900">{score}</span>/12</p>
        <button
          type="button"
          onClick={() => setGenerated(true)}
          className="bg-purple-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-purple-700"
        >
          生成我的本周方案
        </button>
      </div>

      {generated && (
        <div className="mt-6 rounded-xl border border-purple-200 bg-purple-50 p-4">
          <p className="text-sm text-purple-700">分诊结果：<span className="font-semibold">{result.label}</span></p>
          <p className="text-sm text-purple-900 mt-1">{result.summary}</p>
          <ul className="mt-3 space-y-1 text-sm text-purple-900 list-disc pl-5">
            {result.action.map((a) => <li key={a}>{a}</li>)}
          </ul>
          {result.riskNote && <p className="mt-3 text-xs text-red-600">{result.riskNote}</p>}

          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/records?type=BEHAVIOR&template=anxiety" className="text-xs px-3 py-2 rounded bg-blue-600 text-white">去做焦虑急救</Link>
            <Link href="/records?type=BEHAVIOR&template=sleep" className="text-xs px-3 py-2 rounded bg-indigo-600 text-white">去做睡前降压</Link>
            <button
              type="button"
              onClick={createReminderTask}
              disabled={creatingTask || taskDone}
              className="text-xs px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50"
            >
              {taskDone ? '已创建明日提醒' : creatingTask ? '创建中...' : '创建明日20:00提醒'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
