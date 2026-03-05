import { prisma } from '@/lib/db'
import { NextResponse } from 'next/server'

// 种子数据：创建演示用户、家庭和健康记录
export async function GET() {
  try {
    // 清空现有数据
    await prisma.managerNote.deleteMany()
    await prisma.task.deleteMany()
    await prisma.alert.deleteMany()
    await prisma.healthRecord.deleteMany()
    await prisma.familyMember.deleteMany()
    await prisma.family.deleteMany()
    await prisma.user.deleteMany()

    // 创建管理师
    const manager = await prisma.user.create({
      data: {
        email: 'manager@familyhealth.com',
        name: '李健康',
        password: '123456',
        role: 'MANAGER',
      },
    })

    // 创建家庭用户
    const father = await prisma.user.create({
      data: { email: 'father@demo.com', name: '张伟', password: '123456', role: 'MEMBER' },
    })
    const mother = await prisma.user.create({
      data: { email: 'mother@demo.com', name: '王芳', password: '123456', role: 'MEMBER' },
    })
    const child = await prisma.user.create({
      data: { email: 'child@demo.com', name: '张小明', password: '123456', role: 'MEMBER' },
    })

    // 创建家庭
    const family = await prisma.family.create({
      data: {
        name: '张伟家庭',
        code: 'ZHANG001',
        managerId: manager.id,
      },
    })

    // 添加家庭成员
    const fatherMember = await prisma.familyMember.create({
      data: {
        userId: father.id,
        familyId: family.id,
        nickname: '爸爸',
        role: 'FATHER',
        birthYear: 1978,
        gender: 'MALE',
        hasTripleHigh: true,
      },
    })
    await prisma.familyMember.create({
      data: {
        userId: mother.id,
        familyId: family.id,
        nickname: '妈妈',
        role: 'MOTHER',
        birthYear: 1980,
        gender: 'FEMALE',
        hasTripleHigh: false,
      },
    })
    await prisma.familyMember.create({
      data: {
        userId: child.id,
        familyId: family.id,
        nickname: '小明',
        role: 'CHILD',
        birthYear: 2012,
        gender: 'MALE',
        hasTripleHigh: false,
      },
    })

    // 生成最近30天的血压数据
    const today = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      // 血压数据（带一些波动）
      await prisma.healthRecord.create({
        data: {
          memberId: fatherMember.id,
          type: 'BLOOD_PRESSURE',
          recordedAt: date,
          systolic: 135 + Math.floor(Math.random() * 20 - 5),
          diastolic: 88 + Math.floor(Math.random() * 12 - 4),
          heartRate: 72 + Math.floor(Math.random() * 10 - 3),
        },
      })

      // 血糖数据（每周2次）
      if (i % 3 === 0) {
        await prisma.healthRecord.create({
          data: {
            memberId: fatherMember.id,
            type: 'GLUCOSE',
            recordedAt: date,
            glucose: 6.5 + Math.random() * 1.5 - 0.5,
            glucoseType: 'FASTING',
          },
        })
      }

      // 体重数据（每周）
      if (i % 7 === 0) {
        await prisma.healthRecord.create({
          data: {
            memberId: fatherMember.id,
            type: 'WEIGHT',
            recordedAt: date,
            weight: 78 + Math.random() * 2 - 0.5,
            bmi: 24.2 + Math.random() * 0.5,
          },
        })
      }
    }

    // 创建预警
    await prisma.alert.create({
      data: {
        memberId: fatherMember.id,
        type: 'HIGH_BLOOD_PRESSURE',
        level: 'YELLOW',
        message: '连续3天血压偏高（收缩压 > 135 mmHg），建议减少盐分摄入并适当运动',
      },
    })

    // 创建家庭任务
    const taskDue = new Date()
    taskDue.setDate(taskDue.getDate() + 3)

    await prisma.task.createMany({
      data: [
        {
          familyId: family.id,
          title: '本周家庭晚餐 3 次',
          description: '周二、周四、周日全家一起吃晚饭，减少外卖',
          category: 'FAMILY_DINNER',
          dueDate: taskDue,
          completed: false,
        },
        {
          familyId: family.id,
          title: '爸爸每天步行30分钟',
          description: '饭后散步，有助于控制血压和血糖',
          category: 'EXERCISE',
          dueDate: taskDue,
          completed: true,
          completedAt: new Date(),
        },
        {
          familyId: family.id,
          title: '周末亲子运动',
          description: '周六上午和小明一起打羽毛球或爬山',
          category: 'COMPANIONSHIP',
          dueDate: taskDue,
          completed: false,
        },
        {
          familyId: family.id,
          title: '季度体检',
          description: '预约医院体检，重点检查血压、血糖、血脂三项',
          category: 'CHECKUP',
          dueDate: new Date(today.getFullYear(), today.getMonth() + 1, 15),
          completed: false,
        },
      ],
    })

    // 管理师笔记
    await prisma.managerNote.create({
      data: {
        familyId: family.id,
        authorId: manager.id,
        content: '张伟最近工作压力较大，血压波动明显。建议重点关注睡眠质量，已建议其减少夜间刷手机时间。下周安排一次电话复盘。',
      },
    })

    return NextResponse.json({
      success: true,
      message: '演示数据初始化成功',
      accounts: [
        { email: 'father@demo.com', password: '123456', role: '家庭成员（爸爸）' },
        { email: 'manager@familyhealth.com', password: '123456', role: '健康管理师' },
      ],
    })
  } catch (error) {
    console.error('Seed error:', error)
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  }
}
