'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  ClipboardList,
  TrendingUp,
  AlertTriangle,
  CheckSquare,
  Users,
  LogOut,
  Heart,
  Brain,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: '健康仪表盘', icon: LayoutDashboard },
  { href: '/records', label: '数据录入', icon: ClipboardList },
  { href: '/mental', label: '心理支持', icon: Brain },
  { href: '/trends', label: '趋势分析', icon: TrendingUp },
  { href: '/alerts', label: '风险预警', icon: AlertTriangle },
  { href: '/tasks', label: '家庭任务', icon: CheckSquare },
]

const adminItems = [
  { href: '/admin', label: '管理师后台', icon: Users },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600">
          <Heart className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">家健</p>
          <p className="text-xs text-gray-500">家庭健康托管</p>
        </div>
      </div>

      {/* 主导航 */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-4.5 w-4.5', isActive ? 'text-blue-600' : 'text-gray-400')} size={18} />
              {item.label}
            </Link>
          )
        })}

        {/* 分割线 */}
        <div className="my-3 border-t border-gray-100" />

        {adminItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-purple-50 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              )}
            >
              <Icon className={cn('h-4.5 w-4.5', isActive ? 'text-purple-600' : 'text-gray-400')} size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* 底部退出 */}
      <div className="border-t border-gray-100 px-3 py-4">
        <Link
          href="/api/auth/signout"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        >
          <LogOut size={18} className="text-gray-400" />
          退出登录
        </Link>
      </div>
    </aside>
  )
}
