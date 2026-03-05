'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle, Bell, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface Alert {
  id: string
  type: string
  level: string
  message: string
  resolved: boolean
  createdAt: Date | string
  resolvedAt?: Date | string | null
  memberName: string
  memberRole: string
}

const levelConfig: Record<string, { label: string; bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
  RED: { label: '危险', bg: 'bg-red-50', border: 'border-red-200', icon: AlertTriangle, iconColor: 'text-red-500' },
  YELLOW: { label: '注意', bg: 'bg-yellow-50', border: 'border-yellow-200', icon: AlertCircle, iconColor: 'text-yellow-500' },
  GREEN: { label: '正常', bg: 'bg-green-50', border: 'border-green-200', icon: CheckCircle, iconColor: 'text-green-500' },
}

const typeLabels: Record<string, string> = {
  HIGH_BLOOD_PRESSURE: '血压偏高',
  LOW_BLOOD_PRESSURE: '血压偏低',
  HIGH_GLUCOSE: '血糖偏高',
  WEIGHT_INCREASE: '体重增加',
  CONSECUTIVE_LATE_NIGHTS: '连续熬夜',
  NO_EXERCISE_STREAK: '长期缺乏运动',
}

const roleLabels: Record<string, string> = {
  FATHER: '爸爸', MOTHER: '妈妈', CHILD: '孩子', GRANDPARENT: '祖父母', OTHER: '成员',
}

export function AlertsClient({ initialAlerts }: { initialAlerts: Alert[] }) {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [filter, setFilter] = useState<'ALL' | 'UNRESOLVED' | 'RESOLVED'>('UNRESOLVED')

  async function resolveAlert(id: string) {
    const res = await fetch('/api/alerts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setAlerts(prev =>
        prev.map(a => a.id === id ? { ...a, resolved: true, resolvedAt: new Date() } : a)
      )
    }
  }

  const filtered = alerts.filter(a => {
    if (filter === 'UNRESOLVED') return !a.resolved
    if (filter === 'RESOLVED') return a.resolved
    return true
  })

  const unresolvedCount = alerts.filter(a => !a.resolved).length

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            风险预警
            {unresolvedCount > 0 && (
              <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-red-500 text-white text-xs font-bold">
                {unresolvedCount}
              </span>
            )}
          </h1>
          <p className="text-gray-500 mt-1">系统自动检测异常，及时干预</p>
        </div>

        {/* 筛选 */}
        <div className="flex rounded-lg border border-gray-300 overflow-hidden">
          {[
            { key: 'ALL', label: '全部' },
            { key: 'UNRESOLVED', label: '待处理' },
            { key: 'RESOLVED', label: '已解决' },
          ].map(opt => (
            <button
              key={opt.key}
              onClick={() => setFilter(opt.key as typeof filter)}
              className={cn(
                'px-4 py-2 text-sm transition-colors',
                filter === opt.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-16 text-center">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <p className="text-gray-500">
            {filter === 'UNRESOLVED' ? '暂无待处理预警，状态良好！' : '暂无预警记录'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => {
            const config = levelConfig[alert.level] || levelConfig.YELLOW
            const Icon = config.icon
            return (
              <div
                key={alert.id}
                className={cn(
                  'bg-white rounded-xl border p-5 transition-opacity',
                  alert.resolved ? 'opacity-60' : '',
                  !alert.resolved ? config.border : 'border-gray-200'
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full', config.bg)}>
                    <Icon size={20} className={config.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900">
                        {alert.memberName} · {roleLabels[alert.memberRole] || alert.memberRole}
                      </span>
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full',
                        alert.level === 'RED' ? 'bg-red-100 text-red-700' :
                        alert.level === 'YELLOW' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      )}>
                        {config.label}
                      </span>
                      <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {typeLabels[alert.type] || alert.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{alert.message}</p>
                    <p className="text-xs text-gray-400 mt-2">
                      {format(new Date(alert.createdAt), 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                      {alert.resolved && alert.resolvedAt && (
                        <> · 已于 {format(new Date(alert.resolvedAt), 'MM月dd日 HH:mm')} 解决</>
                      )}
                    </p>
                  </div>
                  {!alert.resolved && (
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="flex-shrink-0 flex items-center gap-1.5 text-sm text-green-600 hover:text-green-700 bg-green-50 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <CheckCircle size={15} />
                      已处理
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
