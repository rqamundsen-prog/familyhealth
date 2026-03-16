import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { TasksClient } from './TasksClient'

export default async function TasksPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const s = session.user as { id?: string; email?: string | null; phone?: string | null }
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        s.id ? { id: s.id } : undefined,
        s.email ? { email: s.email } : undefined,
        s.phone ? { phone: s.phone } : undefined,
      ].filter(Boolean) as any,
    },
    include: { family: true },
  })

  if (!user?.family) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-xl p-6 text-center">
          <p className="text-gray-700 font-medium">你还没有开启个人空间</p>
          <p className="text-sm text-gray-500 mt-1">先回到首页点「开始我的情绪」，再来这里看任务。</p>
          <Link href="/dashboard" className="inline-flex mt-4 h-9 items-center px-4 rounded bg-blue-600 text-white text-sm">回到首页开启</Link>
        </div>
      </div>
    )
  }

  const tasks = await prisma.task.findMany({
    where: { familyId: user.family.familyId },
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  })

  return <TasksClient initialTasks={tasks} familyId={user.family.familyId} />
}
