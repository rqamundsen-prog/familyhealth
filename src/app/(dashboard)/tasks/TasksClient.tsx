'use client'

import { useState } from 'react'
import { CheckSquare, Plus, Utensils, Dumbbell, Heart, Stethoscope, Pill } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import type { Task } from '@prisma/client'

const categoryConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  FAMILY_DINNER: { label: '家庭晚餐', icon: Utensils, color: 'text-orange-600', bg: 'bg-orange-50' },
  EXERCISE: { label: '运动', icon: Dumbbell, color: 'text-green-600', bg: 'bg-green-50' },
  COMPANIONSHIP: { label: '陪伴孩子', icon: Heart, color: 'text-pink-600', bg: 'bg-pink-50' },
  MEDICATION: { label: '服药提醒', icon: Pill, color: 'text-blue-600', bg: 'bg-blue-50' },
  CHECKUP: { label: '体检', icon: Stethoscope, color: 'text-purple-600', bg: 'bg-purple-50' },
  OTHER: { label: '其他', icon: CheckSquare, color: 'text-gray-600', bg: 'bg-gray-50' },
}

export function TasksClient({ initialTasks, familyId }: { initialTasks: Task[]; familyId: string }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newCategory, setNewCategory] = useState('OTHER')
  const [newDueDate, setNewDueDate] = useState('')
  const [adding, setAdding] = useState(false)

  async function toggleTask(id: string, completed: boolean) {
    const res = await fetch('/api/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed }),
    })
    if (res.ok) {
      const updated = await res.json()
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed, completedAt: updated.completedAt } : t))
    }
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault()
    setAdding(true)
    const res = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: newTitle,
        description: newDesc,
        category: newCategory,
        dueDate: newDueDate || undefined,
        familyId,
      }),
    })
    if (res.ok) {
      const task = await res.json()
      setTasks(prev => [task, ...prev])
      setNewTitle(''); setNewDesc(''); setNewCategory('OTHER'); setNewDueDate('')
      setShowAdd(false)
    }
    setAdding(false)
  }

  const pending = tasks.filter(t => !t.completed)
  const completed = tasks.filter(t => t.completed)
  const completionRate = tasks.length > 0 ? Math.round(completed.length / tasks.length * 100) : 0

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">家庭任务</h1>
          <p className="text-gray-500 mt-1">行为任务是改变的载体，不是建议</p>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          新建任务
        </button>
      </div>

      {/* 进度 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">本周完成率</span>
          <span className="text-2xl font-bold text-blue-600">{completionRate}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex gap-4 mt-3 text-xs text-gray-500">
          <span>{completed.length} 已完成</span>
          <span>{pending.length} 待完成</span>
        </div>
      </div>

      {/* 新建表单 */}
      {showAdd && (
        <div className="bg-white rounded-xl border border-blue-200 p-5 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">新建家庭任务</h3>
          <form onSubmit={addTask} className="space-y-4">
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="任务名称"
              required
              className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value)}
                className="h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(categoryConfig).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
              <input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                className="h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <textarea
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="任务描述（可选）"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={adding}
                className="flex-1 h-10 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {adding ? '创建中...' : '创建任务'}
              </button>
              <button
                type="button"
                onClick={() => setShowAdd(false)}
                className="h-10 px-4 border border-gray-300 text-gray-600 rounded-lg text-sm hover:bg-gray-50"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 待完成任务 */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">待完成 · {pending.length}</h2>
          <div className="space-y-2">
            {pending.map(task => {
              const config = categoryConfig[task.category] || categoryConfig.OTHER
              const Icon = config.icon
              return (
                <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
                  <button
                    onClick={() => toggleTask(task.id, true)}
                    className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-gray-300 hover:border-blue-500 transition-colors"
                  />
                  <div className={cn('flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg', config.bg)}>
                    <Icon size={16} className={config.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{task.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={cn('text-xs px-2 py-1 rounded-full', config.bg, config.color)}>
                      {config.label}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-gray-400">
                        {format(new Date(task.dueDate), 'MM/dd', { locale: zhCN })}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 已完成任务 */}
      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">已完成 · {completed.length}</h2>
          <div className="space-y-2">
            {completed.map(task => {
              const config = categoryConfig[task.category] || categoryConfig.OTHER
              return (
                <div key={task.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4 flex items-center gap-4 opacity-70">
                  <button
                    onClick={() => toggleTask(task.id, false)}
                    className="h-6 w-6 flex-shrink-0 rounded-full border-2 border-green-500 bg-green-500 flex items-center justify-center"
                  >
                    <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 line-through">{task.title}</p>
                  </div>
                  <span className="text-xs text-gray-400">{config.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
