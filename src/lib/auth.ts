import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma, syncDbAfterWrite } from '@/lib/db'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
  },
  providers: [
    // 邮箱密码登录（演示/管理员）
    CredentialsProvider({
      id: 'email',
      name: '邮箱登录',
      credentials: {
        email: { label: '邮箱', type: 'email' },
        password: { label: '密码', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user || !user.password) return null
        if (credentials.password !== user.password) return null

        return { id: user.id, email: user.email ?? undefined, name: user.name, role: user.role }
      },
    }),

    // 手机号验证码登录（主要登录方式）
    CredentialsProvider({
      id: 'phone',
      name: '手机号登录',
      credentials: {
        phone: { label: '手机号', type: 'text' },
        code: { label: '验证码', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) return null

        // 查找有效验证码
        const otp = await prisma.otpCode.findFirst({
          where: {
            phone: credentials.phone,
            code: credentials.code,
            used: false,
            expiresAt: { gte: new Date() },
          },
          orderBy: { createdAt: 'desc' },
        })

        if (!otp) return null

        // 标记已使用
        await prisma.otpCode.update({
          where: { id: otp.id },
          data: { used: true },
        })

        // 查找或创建用户
        let user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
        })

        if (!user) {
          user = await prisma.user.create({
            data: {
              phone: credentials.phone,
              name: `用户${credentials.phone.slice(-4)}`,
              role: 'MEMBER',
            },
          })
          // 新用户注册，同步数据库到 GitHub
          syncDbAfterWrite()
        }

        return {
          id: user.id,
          email: user.email ?? undefined,
          name: user.name,
          phone: user.phone,
          role: user.role,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role
        token.id = user.id
        token.phone = (user as { phone?: string }).phone
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        const u = session.user as { id?: string; role?: string; phone?: string }
        u.id = token.id as string
        u.role = token.role as string
        u.phone = token.phone as string
      }
      return session
    },
  },
}
