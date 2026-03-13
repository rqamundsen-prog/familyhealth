'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, Heart, Weight, Moon, CheckSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

type RecordType = 'BLOOD_PRESSURE' | 'GLUCOSE' | 'WEIGHT' | 'BEHAVIOR'

const tabs: { type: RecordType; label: string; icon: React.ElementType }[] = [
  { type: 'BLOOD_PRESSURE', label: '血压', icon: Activity },
  { type: 'GLUCOSE', label: '血糖', icon: Heart },
  { type: 'WEIGHT', label: '体重', icon: Weight },
  { type: 'BEHAVIOR', label: '行为', icon: CheckSquare },
]

export default function RecordsPage() {
  const router = useRouter()
  const [activeType, setActiveType] = useState<RecordType>('BLOOD_PRESSURE')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // 血压
  const [systolic, setSystolic] = useState('')
  const [diastolic, setDiastolic] = useState('')
  const [heartRate, setHeartRate] = useState('')

  // 血糖
  const [glucose, setGlucose] = useState('')
  const [glucoseType, setGlucoseType] = useState('FASTING')

  // 体重
  const [weight, setWeight] = useState('')

  // 行为
  const [moodScore, setMoodScore] = useState('3')
  const [sleptLate, setSleptLate] = useState(false)
  const [hadDinner, setHadDinner] = useState(false)
  const [exercised, setExercised] = useState(false)

  const [note, setNote] = useState('')

  const behaviorTemplates = useMemo(() => ({
    anxiety: '焦虑急救：现在最困扰我的想法是____，做完练习后我感觉____。',
    sleep: '睡前降压：今晚我准备在____点放下手机，睡前做____分钟放松。',
    work: '职场复位：今天压力来源是____，我准备先完成____这个最小动作。',
  }), [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const type = params.get('type')
    if (type === 'BEHAVIOR' || type === 'BLOOD_PRESSURE' || type === 'GLUCOSE' || type === 'WEIGHT') {
      setActiveType(type)
    }

    const tpl = params.get('template') as 'anxiety' | 'sleep' | 'work' | null
    if (tpl && behaviorTemplates[tpl]) {
      setActiveType('BEHAVIOR')
      setNote(behaviorTemplates[tpl])
    }
  }, [behaviorTemplates])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setSuccess(false)

    const payload: Record<string, unknown> = { type: activeType, note }

    if (activeType === 'BLOOD_PRESSURE') {
      Object.assign(payload, { systolic, diastolic, heartRate })
    } else if (activeType === 'GLUCOSE') {
      Object.assign(payload, { glucose, glucoseType })
    } else if (activeType === 'WEIGHT') {
      Object.assign(payload, { weight })
    } else if (activeType === 'BEHAVIOR') {
      Object.assign(payload, { moodScore, sleptLate, hadDinner, exercised })
    }

    try {
      const res = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSuccess(true)
        // 重置表单
        setSystolic(''); setDiastolic(''); setHeartRate('')
        setGlucose(''); setWeight(''); setNote('')
        setMoodScore('3'); setSleptLate(false); setHadDinner(false); setExercised(false)
        setTimeout(() => setSuccess(false), 3000)
        router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">数据录入</h1>
        <p className="text-gray-500 mt-1">记录今日健康数据，建立长期趋势档案</p>
      </div>

      {/* 类型选项卡 */}
      <div className="flex gap-2 mb-8">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.type}
              onClick={() => setActiveType(tab.type)}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeType === tab.type
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              )}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* 表单 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* 血压表单 */}
          {activeType === 'BLOOD_PRESSURE' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Activity size={18} className="text-blue-500" />
                血压记录
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    收缩压 <span className="text-gray-400 font-normal">(mmHg)</span>
                  </label>
                  <input
                    type="number"
                    value={systolic}
                    onChange={e => setSystolic(e.target.value)}
                    placeholder="120"
                    min="60" max="250"
                    required
                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    舒张压 <span className="text-gray-400 font-normal">(mmHg)</span>
                  </label>
                  <input
                    type="number"
                    value={diastolic}
                    onChange={e => setDiastolic(e.target.value)}
                    placeholder="80"
                    min="40" max="150"
                    required
                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    心率 <span className="text-gray-400 font-normal">(bpm)</span>
                  </label>
                  <input
                    type="number"
                    value={heartRate}
                    onChange={e => setHeartRate(e.target.value)}
                    placeholder="72"
                    min="40" max="200"
                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              {/* 参考范围 */}
              <div className="flex gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500"></span>正常: &lt;120/80</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-500"></span>注意: 130-139/80-89</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500"></span>高: ≥140/90</span>
              </div>
            </div>
          )}

          {/* 血糖表单 */}
          {activeType === 'GLUCOSE' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Heart size={18} className="text-rose-500" />
                血糖记录
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    血糖值 <span className="text-gray-400 font-normal">(mmol/L)</span>
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={glucose}
                    onChange={e => setGlucose(e.target.value)}
                    placeholder="5.6"
                    min="1" max="30"
                    required
                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">测量时间</label>
                  <select
                    value={glucoseType}
                    onChange={e => setGlucoseType(e.target.value)}
                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="FASTING">空腹</option>
                    <option value="POST_MEAL">餐后2小时</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-4 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500"></span>空腹正常: &lt;6.1</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-yellow-500"></span>糖尿病前期: 6.1-7.0</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-red-500"></span>偏高: ≥7.0</span>
              </div>
            </div>
          )}

          {/* 体重表单 */}
          {activeType === 'WEIGHT' && (
            <div className="space-y-4">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Weight size={18} className="text-purple-500" />
                体重记录
              </h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  体重 <span className="text-gray-400 font-normal">(kg)</span>
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                  placeholder="70.0"
                  min="20" max="300"
                  required
                  className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* 行为表单 */}
          {activeType === 'BEHAVIOR' && (
            <div className="space-y-5">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <CheckSquare size={18} className="text-green-500" />
                今日行为记录
              </h2>

              {/* 情绪评分 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">今日状态</label>
                <div className="flex gap-3">
                  {[
                    { v: '1', emoji: '😞', label: '很差' },
                    { v: '2', emoji: '😕', label: '较差' },
                    { v: '3', emoji: '😐', label: '一般' },
                    { v: '4', emoji: '😊', label: '较好' },
                    { v: '5', emoji: '😄', label: '很好' },
                  ].map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setMoodScore(opt.v)}
                      className={cn(
                        'flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border text-xs transition-colors',
                        moodScore === opt.v
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                      )}
                    >
                      <span className="text-xl">{opt.emoji}</span>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 行为复选 */}
              <div className="space-y-3">
                {[
                  { key: 'exercised', value: exercised, setter: setExercised, label: '今天运动了 30 分钟以上', color: 'green' },
                  { key: 'hadDinner', value: hadDinner, setter: setHadDinner, label: '全家一起吃晚饭', color: 'blue' },
                  { key: 'sleptLate', value: sleptLate, setter: setSleptLate, label: '今天熬夜了（晚于 23:30）', color: 'red' },
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={item.value}
                      onChange={e => item.setter(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{item.label}</span>
                  </label>
                ))}
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-xs text-blue-700">
                快捷入口：
                <span className="mx-1">焦虑急救（5分钟）</span>
                <span className="mx-1">睡前降压（10分钟）</span>
                <span className="mx-1">职场复位（7分钟）</span>
                <span className="block mt-1 text-blue-600">先记录今天状态，再执行一个最小动作，持续7天看趋势。</span>
              </div>
            </div>
          )}

          {/* 备注 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">备注（可选）</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="添加备注信息..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 提交 */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-lg">
              ✓ 数据录入成功！已触发自动风险检测。
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '保存中...' : '保存记录'}
          </button>
        </form>
      </div>
    </div>
  )
}
