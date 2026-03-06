import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

/**
 * 获取当前登录用户（支持手机号和邮箱登录）
 * 优先用 JWT 中的 id 查找，fallback 用 email
 */
export async function getCurrentUser() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const sessionUser = session.user as { id?: string; email?: string | null; phone?: string }
  
  if (sessionUser.id) {
    return prisma.user.findUnique({ where: { id: sessionUser.id } })
  }
  if (sessionUser.email) {
    return prisma.user.findUnique({ where: { email: sessionUser.email } })
  }
  return null
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) throw new Error('Unauthorized')
  return user
}
