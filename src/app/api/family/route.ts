import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  const userId = (session.user as { id?: string }).id
  if (!userId) return NextResponse.json({ error: '用户信息异常' }, { status: 400 })

  const body = await req.json()
  const action = body?.action

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { family: true },
  })

  if (!user) return NextResponse.json({ error: '用户不存在' }, { status: 404 })
  if (user.family) return NextResponse.json({ error: '您已加入家庭' }, { status: 400 })

  if (action === 'create') {
    const familyName = (body?.familyName || `${user.name || '我的'}家庭`).toString().slice(0, 24)

    let code = genCode()
    // 简单重试避免邀请码冲突
    for (let i = 0; i < 5; i++) {
      const exists = await prisma.family.findUnique({ where: { code } })
      if (!exists) break
      code = genCode()
    }

    const family = await prisma.family.create({
      data: {
        name: familyName,
        code,
      },
    })

    await prisma.familyMember.create({
      data: {
        userId: user.id,
        familyId: family.id,
        nickname: user.name || '我',
        role: 'OTHER',
      },
    })

    return NextResponse.json({ success: true, mode: 'create', familyCode: family.code })
  }

  if (action === 'join') {
    const code = (body?.code || '').toString().trim().toUpperCase()
    if (!code) return NextResponse.json({ error: '请输入邀请码' }, { status: 400 })

    const family = await prisma.family.findUnique({ where: { code } })
    if (!family) return NextResponse.json({ error: '邀请码无效，请确认后重试' }, { status: 404 })

    await prisma.familyMember.create({
      data: {
        userId: user.id,
        familyId: family.id,
        nickname: user.name || '我',
        role: 'OTHER',
      },
    })

    return NextResponse.json({ success: true, mode: 'join' })
  }

  return NextResponse.json({ error: '不支持的操作' }, { status: 400 })
}
