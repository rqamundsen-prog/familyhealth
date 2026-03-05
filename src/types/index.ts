export type AlertLevel = 'GREEN' | 'YELLOW' | 'RED'
export type AlertType =
  | 'HIGH_BLOOD_PRESSURE'
  | 'LOW_BLOOD_PRESSURE'
  | 'HIGH_GLUCOSE'
  | 'WEIGHT_INCREASE'
  | 'CONSECUTIVE_LATE_NIGHTS'
  | 'NO_EXERCISE_STREAK'

export type RecordType = 'BLOOD_PRESSURE' | 'GLUCOSE' | 'WEIGHT' | 'MOOD' | 'BEHAVIOR'
export type MemberRole = 'FATHER' | 'MOTHER' | 'CHILD' | 'GRANDPARENT' | 'OTHER'
export type TaskCategory =
  | 'FAMILY_DINNER'
  | 'EXERCISE'
  | 'COMPANIONSHIP'
  | 'MEDICATION'
  | 'CHECKUP'
  | 'OTHER'

export interface HealthSummary {
  memberId: string
  memberName: string
  memberRole: MemberRole
  latestBP?: { systolic: number; diastolic: number; recordedAt: Date }
  latestGlucose?: { value: number; recordedAt: Date }
  latestWeight?: { value: number; recordedAt: Date }
  riskScore: number // 0-100
  alertCount: number
  trend: 'IMPROVING' | 'STABLE' | 'WORSENING'
}

export interface BloodPressureReading {
  date: string
  systolic: number
  diastolic: number
  heartRate?: number
}

export interface GlucoseReading {
  date: string
  value: number
  type: 'FASTING' | 'POST_MEAL'
}

export interface WeightReading {
  date: string
  weight: number
  bmi?: number
}

// 血压正常范围
export const BP_THRESHOLDS = {
  NORMAL: { systolic: 120, diastolic: 80 },
  ELEVATED: { systolic: 130, diastolic: 80 },
  HIGH_STAGE1: { systolic: 140, diastolic: 90 },
  HIGH_STAGE2: { systolic: 180, diastolic: 120 },
} as const

// 血糖正常范围 (mmol/L)
export const GLUCOSE_THRESHOLDS = {
  FASTING: { normal: 6.1, prediabetic: 7.0 },
  POST_MEAL: { normal: 7.8, prediabetic: 11.1 },
} as const
