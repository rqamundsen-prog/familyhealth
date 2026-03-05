'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts'

interface BPData {
  date: string
  systolic: number
  diastolic: number
  heartRate?: number
}

export function BloodPressureChart({ data }: { data: BPData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        暂无血压数据
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#d1d5db" />
        <YAxis domain={[60, 180]} tick={{ fontSize: 11 }} stroke="#d1d5db" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any, name: any) => [
            `${value} mmHg`,
            name === 'systolic' ? '收缩压' : name === 'diastolic' ? '舒张压' : '心率',
          ]}
        />
        <Legend
          formatter={(value) =>
            value === 'systolic' ? '收缩压' : value === 'diastolic' ? '舒张压' : '心率'
          }
          wrapperStyle={{ fontSize: 12 }}
        />
        <ReferenceLine y={140} stroke="#ef4444" strokeDasharray="4 2" label={{ value: '高血压线 140', fontSize: 11, fill: '#ef4444' }} />
        <ReferenceLine y={120} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: '正常上限 120', fontSize: 11, fill: '#f59e0b' }} />
        <Line
          type="monotone"
          dataKey="systolic"
          stroke="#3b82f6"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
        <Line
          type="monotone"
          dataKey="diastolic"
          stroke="#8b5cf6"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface GlucoseData {
  date: string
  value: number
  type: string
}

export function GlucoseChart({ data }: { data: GlucoseData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        暂无血糖数据
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#d1d5db" />
        <YAxis domain={[3, 14]} tick={{ fontSize: 11 }} stroke="#d1d5db" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${Number(value).toFixed(1)} mmol/L`, '血糖']}
        />
        <ReferenceLine y={7.0} stroke="#ef4444" strokeDasharray="4 2" label={{ value: '糖尿病线 7.0', fontSize: 11, fill: '#ef4444' }} />
        <ReferenceLine y={6.1} stroke="#f59e0b" strokeDasharray="4 2" label={{ value: '正常上限 6.1', fontSize: 11, fill: '#f59e0b' }} />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#f97316"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

interface WeightData {
  date: string
  weight: number
}

export function WeightChart({ data }: { data: WeightData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        暂无体重数据
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="#d1d5db" />
        <YAxis tick={{ fontSize: 11 }} stroke="#d1d5db" />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={(value: any) => [`${Number(value).toFixed(1)} kg`, '体重']}
        />
        <Line
          type="monotone"
          dataKey="weight"
          stroke="#10b981"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
