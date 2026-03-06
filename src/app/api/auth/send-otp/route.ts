import { prisma, syncDbAfterWrite } from '@/lib/db'
import { sendSms, generateOtpCode } from '@/lib/sms'
import { NextRequest, NextResponse } from 'next/server'

// 手机号格式验证
function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone)
}

export async function POST(req: NextRequest) {
  const { phone } = await req.json()

  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json({ error: '请输入正确的手机号' }, { status: 400 })
  }

  // 频率限制：60秒内只能发送一次
  const recent = await prisma.otpCode.findFirst({
    where: {
      phone,
      createdAt: { gte: new Date(Date.now() - 60 * 1000) },
    },
  })

  if (recent) {
    return NextResponse.json({ error: '发送过于频繁，请60秒后再试' }, { status: 429 })
  }

  // 生成验证码
  const code = generateOtpCode()
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000) // 5分钟有效

  // 存入数据库
  await prisma.otpCode.create({
    data: { phone, code, expiresAt },
  })
  syncDbAfterWrite()

  // 发送短信
  const result = await sendSms(phone, code)

  if (!result.success) {
    return NextResponse.json({ error: result.error || '短信发送失败' }, { status: 500 })
  }

  // 如果短信未启用，返回验证码给前端直接展示（方便用户注册）
  const smsEnabled = process.env.SMS_ENABLED === 'true'

  return NextResponse.json({
    success: true,
    message: smsEnabled
      ? '验证码已发送，5分钟内有效'
      : '验证码已生成',
    ...(!smsEnabled && { code }),
  })
}
