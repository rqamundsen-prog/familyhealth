import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { assessBPRisk, assessGlucoseRisk, checkConsecutiveHighBP } from '@/lib/risk'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const memberId = searchParams.get('memberId')
  const type = searchParams.get('type')
  const days = parseInt(searchParams.get('days') || '30')

  const where: Record<string, unknown> = {}
  if (memberId) where.memberId = memberId
  if (type) where.type = type

  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)
  where.recordedAt = { gte: startDate }

  const records = await prisma.healthRecord.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    take: 200,
  })

  return NextResponse.json(records)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  const body = await req.json()

  // 找到当前用户的家庭成员身份
  const user = await prisma.user.findUnique({
    where: { id: (session.user as any).id },
    include: { family: true },
  })

  if (!user?.family) {
    return NextResponse.json({ error: '未找到家庭成员信息' }, { status: 400 })
  }

  const record = await prisma.healthRecord.create({
    data: {
      memberId: body.memberId || user.family.id,
      type: body.type,
      recordedAt: body.recordedAt ? new Date(body.recordedAt) : new Date(),
      systolic: body.systolic ? parseInt(body.systolic) : undefined,
      diastolic: body.diastolic ? parseInt(body.diastolic) : undefined,
      heartRate: body.heartRate ? parseInt(body.heartRate) : undefined,
      glucose: body.glucose ? parseFloat(body.glucose) : undefined,
      glucoseType: body.glucoseType,
      weight: body.weight ? parseFloat(body.weight) : undefined,
      bmi: body.bmi ? parseFloat(body.bmi) : undefined,
      moodScore: body.moodScore ? parseInt(body.moodScore) : undefined,
      sleptLate: body.sleptLate,
      hadDinner: body.hadDinner,
      exercised: body.exercised,
      note: body.note,
    },
  })

  // 自动检测风险
  if (record.type === 'BLOOD_PRESSURE' && record.systolic && record.diastolic) {
    const { level, type: alertType } = assessBPRisk({
      systolic: record.systolic,
      diastolic: record.diastolic,
    })

    if (level !== 'GREEN' && alertType) {
      // 检查连续高血压
      const recentBP = await prisma.healthRecord.findMany({
        where: { memberId: record.memberId, type: 'BLOOD_PRESSURE' },
        orderBy: { recordedAt: 'desc' },
        take: 5,
        select: { systolic: true, diastolic: true, recordedAt: true },
      })

      const validBP = recentBP.filter(r => r.systolic && r.diastolic) as {
        systolic: number; diastolic: number; recordedAt: Date
      }[]

      if (checkConsecutiveHighBP(validBP, 3)) {
        // 检查是否已有未解决的相同预警
        const existingAlert = await prisma.alert.findFirst({
          where: { memberId: record.memberId, type: alertType, resolved: false },
        })

        if (!existingAlert) {
          await prisma.alert.create({
            data: {
              memberId: record.memberId,
              type: alertType,
              level,
              message: `连续3天血压偏高（收缩压 ${record.systolic} mmHg），建议减少盐分摄入并适当运动`,
            },
          })
        }
      }
    }
  }

  if (record.type === 'GLUCOSE' && record.glucose && record.glucoseType) {
    const { level, type: alertType } = assessGlucoseRisk({
      value: record.glucose,
      type: record.glucoseType as 'FASTING' | 'POST_MEAL',
    })

    if (level === 'RED' && alertType) {
      await prisma.alert.create({
        data: {
          memberId: record.memberId,
          type: alertType,
          level,
          message: `血糖偏高（${record.glucose} mmol/L），建议控制碳水化合物摄入`,
        },
      })
    }
  }

  return NextResponse.json(record)
}
