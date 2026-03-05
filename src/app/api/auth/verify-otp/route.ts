import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { phone, code, name } = await req.json()

  if (!phone || !code) {
    return NextResponse.json({ error: '参数不完整' }, { status: 400 })
  }

  // 查找有效的验证码（未过期、未使用）
  const otp = await prisma.otpCode.findFirst({
    where: {
      phone,
      code,
      used: false,
      expiresAt: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!otp) {
    return NextResponse.json({ error: '验证码错误或已过期' }, { status: 400 })
  }

  // 标记验证码为已使用
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { used: true },
  })

  // 查找或创建用户
  let user = await prisma.user.findUnique({ where: { phone } })

  if (!user) {
    // 新用户注册
    user = await prisma.user.create({
      data: {
        phone,
        name: name || `用户${phone.slice(-4)}`,
        role: 'MEMBER',
      },
    })
  }

  return NextResponse.json({
    success: true,
    userId: user.id,
    isNewUser: !otp, // 用于前端判断是否需要跳转到完善信息页
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
    },
  })
}
