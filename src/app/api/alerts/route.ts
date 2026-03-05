import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: { family: true },
  })

  if (!user?.family) return NextResponse.json([])

  const alerts = await prisma.alert.findMany({
    where: { memberId: user.family.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  return NextResponse.json(alerts)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  const { id } = await req.json()

  const alert = await prisma.alert.update({
    where: { id },
    data: { resolved: true, resolvedAt: new Date() },
  })

  return NextResponse.json(alert)
}
