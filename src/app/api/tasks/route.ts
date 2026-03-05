import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const familyId = searchParams.get('familyId')

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: { family: true },
  })

  const fid = familyId || user?.family?.familyId

  if (!fid) return NextResponse.json([])

  const tasks = await prisma.task.findMany({
    where: { familyId: fid },
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  })

  return NextResponse.json(tasks)
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  const body = await req.json()

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: { family: true },
  })

  if (!user?.family) return NextResponse.json({ error: '未找到家庭' }, { status: 400 })

  const task = await prisma.task.create({
    data: {
      familyId: user.family.familyId,
      title: body.title,
      description: body.description,
      category: body.category || 'OTHER',
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    },
  })

  return NextResponse.json(task)
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: '未授权' }, { status: 401 })

  const { id, completed } = await req.json()

  const task = await prisma.task.update({
    where: { id },
    data: {
      completed,
      completedAt: completed ? new Date() : null,
    },
  })

  return NextResponse.json(task)
}
