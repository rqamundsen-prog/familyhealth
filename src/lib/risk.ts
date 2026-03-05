import { BP_THRESHOLDS, GLUCOSE_THRESHOLDS, type AlertLevel, type AlertType } from '@/types'

interface BPReading {
  systolic: number
  diastolic: number
}

interface GlucoseReading {
  value: number
  type: 'FASTING' | 'POST_MEAL'
}

// 评估血压风险等级
export function assessBPRisk(bp: BPReading): { level: AlertLevel; type: AlertType | null } {
  const { systolic, diastolic } = bp

  if (systolic >= BP_THRESHOLDS.HIGH_STAGE2.systolic || diastolic >= BP_THRESHOLDS.HIGH_STAGE2.diastolic) {
    return { level: 'RED', type: 'HIGH_BLOOD_PRESSURE' }
  }
  if (systolic >= BP_THRESHOLDS.HIGH_STAGE1.systolic || diastolic >= BP_THRESHOLDS.HIGH_STAGE1.diastolic) {
    return { level: 'YELLOW', type: 'HIGH_BLOOD_PRESSURE' }
  }
  if (systolic < 90 || diastolic < 60) {
    return { level: 'YELLOW', type: 'LOW_BLOOD_PRESSURE' }
  }
  return { level: 'GREEN', type: null }
}

// 评估血糖风险等级
export function assessGlucoseRisk(reading: GlucoseReading): { level: AlertLevel; type: AlertType | null } {
  const threshold = reading.type === 'FASTING'
    ? GLUCOSE_THRESHOLDS.FASTING
    : GLUCOSE_THRESHOLDS.POST_MEAL

  if (reading.value >= threshold.prediabetic) {
    return { level: 'RED', type: 'HIGH_GLUCOSE' }
  }
  if (reading.value >= threshold.normal) {
    return { level: 'YELLOW', type: 'HIGH_GLUCOSE' }
  }
  return { level: 'GREEN', type: null }
}

// 计算健康评分 (0-100, 越高越好)
export function calculateHealthScore(params: {
  bpLevel: AlertLevel
  glucoseLevel: AlertLevel
  recentExercise: boolean
  recentFamilyDinner: boolean
  lateSleepCount: number // 最近7天熬夜次数
}): number {
  let score = 100

  if (params.bpLevel === 'RED') score -= 30
  else if (params.bpLevel === 'YELLOW') score -= 15

  if (params.glucoseLevel === 'RED') score -= 25
  else if (params.glucoseLevel === 'YELLOW') score -= 12

  if (!params.recentExercise) score -= 10
  if (!params.recentFamilyDinner) score -= 5
  score -= params.lateSleepCount * 5

  return Math.max(0, Math.min(100, score))
}

// 评分对应的颜色和标签
export function scoreToStatus(score: number): {
  label: string
  color: string
  bgColor: string
} {
  if (score >= 80) return { label: '良好', color: 'text-green-600', bgColor: 'bg-green-50' }
  if (score >= 60) return { label: '一般', color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
  return { label: '注意', color: 'text-red-600', bgColor: 'bg-red-50' }
}

// 检查是否需要触发预警（连续N天超标）
export function checkConsecutiveHighBP(
  readings: { systolic: number; diastolic: number; recordedAt: Date }[],
  consecutiveDays = 3
): boolean {
  if (readings.length < consecutiveDays) return false

  const sorted = [...readings].sort((a, b) =>
    new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime()
  )

  const recent = sorted.slice(0, consecutiveDays)
  return recent.every(r => {
    const { level } = assessBPRisk({ systolic: r.systolic, diastolic: r.diastolic })
    return level !== 'GREEN'
  })
}
