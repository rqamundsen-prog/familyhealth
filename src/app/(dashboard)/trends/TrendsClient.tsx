'use client'

import { useState } from 'react'
import { BloodPressureChart, GlucoseChart, WeightChart } from '@/components/charts/HealthCharts'
import { Activity, Heart, Weight } from 'lucide-react'
import type { FamilyMember } from '@prisma/client'

interface Props {
  members: FamilyMember[]
  defaultMemberId: string
  initialBPData: { date: string; systolic: number; diastolic: number; heartRate?: number }[]
  initialGlucoseData: { date: string; value: number; type: string }[]
  initialWeightData: { date: string; weight: number }[]
}

const roleLabels: Record<string, string> = {
  FATHER: '爸爸',
  MOTHER: '妈妈',
  CHILD: '孩子',
  GRANDPARENT: '祖父母',
  OTHER: '成员',
}

export function TrendsClient({
  members,
  defaultMemberId,
  initialBPData,
  initialGlucoseData,
  initialWeightData,
}: Props) {
  const [selectedMember, setSelectedMember] = useState(defaultMemberId)
  const [days, setDays] = useState('30')
  const [bpData, setBPData] = useState(initialBPData)
  const [glucoseData, setGlucoseData] = useState(initialGlucoseData)
  const [weightData, setWeightData] = useState(initialWeightData)
  const [loading, setLoading] = useState(false)

  async function loadData(memberId: string, daysN: string) {
    setLoading(true)
    try {
      const [bpRes, glucoseRes, weightRes] = await Promise.all([
        fetch(`/api/records?memberId=${memberId}&type=BLOOD_PRESSURE&days=${daysN}`),
        fetch(`/api/records?memberId=${memberId}&type=GLUCOSE&days=${daysN}`),
        fetch(`/api/records?memberId=${memberId}&type=WEIGHT&days=${daysN}`),
      ])
      const [bp, glucose, weight] = await Promise.all([bpRes.json(), glucoseRes.json(), weightRes.json()])

      setBPData(bp.filter((r: { systolic?: number }) => r.systolic).map((r: { recordedAt: string; systolic: number; diastolic: number; heartRate?: number }) => ({
        date: new Date(r.recordedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace('/', '/'),
        systolic: r.systolic,
        diastolic: r.diastolic,
        heartRate: r.heartRate,
      })))

      setGlucoseData(glucose.filter((r: { glucose?: number }) => r.glucose).map((r: { recordedAt: string; glucose: number; glucoseType: string }) => ({
        date: new Date(r.recordedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace('/', '/'),
        value: r.glucose,
        type: r.glucoseType,
      })))

      setWeightData(weight.filter((r: { weight?: number }) => r.weight).map((r: { recordedAt: string; weight: number }) => ({
        date: new Date(r.recordedAt).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }).replace('/', '/'),
        weight: r.weight,
      })))
    } finally {
      setLoading(false)
    }
  }

  function handleMemberChange(id: string) {
    setSelectedMember(id)
    loadData(id, days)
  }

  function handleDaysChange(d: string) {
    setDays(d)
    loadData(selectedMember, d)
  }

  return (
    <div className="p-8">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">趋势分析</h1>
          <p className="text-gray-500 mt-1">长期数据趋势，洞察健康规律</p>
        </div>

        {/* 控制器 */}
        <div className="flex items-center gap-3">
          <select
            value={selectedMember}
            onChange={e => handleMemberChange(e.target.value)}
            className="h-9 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {members.map(m => (
              <option key={m.id} value={m.id}>
                {m.nickname} ({roleLabels[m.role] || m.role})
              </option>
            ))}
          </select>

          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            {['7', '30', '90'].map(d => (
              <button
                key={d}
                onClick={() => handleDaysChange(d)}
                className={`px-3 py-1.5 text-sm transition-colors ${
                  days === d ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {d}天
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-4 text-gray-400 text-sm">加载中...</div>
      )}

      <div className="space-y-6">
        {/* 血压趋势 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Activity size={18} className="text-blue-500" />
            血压趋势
          </h2>
          <BloodPressureChart data={bpData} />
        </div>

        {/* 血糖趋势 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Heart size={18} className="text-rose-500" />
            血糖趋势
          </h2>
          <GlucoseChart data={glucoseData} />
        </div>

        {/* 体重趋势 */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Weight size={18} className="text-purple-500" />
            体重变化
          </h2>
          <WeightChart data={weightData} />
        </div>
      </div>
    </div>
  )
}
