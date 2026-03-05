import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { TasksClient } from './TasksClient'

export default async function TasksPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { email: session.user?.email! },
    include: { family: true },
  })

  if (!user?.family) {
    return <div className="p-8 text-center text-gray-400">未加入家庭</div>
  }

  const tasks = await prisma.task.findMany({
    where: { familyId: user.family.familyId },
    orderBy: [{ completed: 'asc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
  })

  return <TasksClient initialTasks={tasks} familyId={user.family.familyId} />
}
