'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Mail, Phone } from 'lucide-react'

type LoginMode = 'phone' | 'email'

export default function LoginPage() {
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>('phone')

  // 手机号登录状态
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  // 邮箱登录状态
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 发送验证码
  async function handleSendCode() {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }
    setSendLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }

      // 如果后端返回了验证码（短信未开通时），自动填入
      if (data.code) {
        setCode(data.code)
      }

      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(c => {
          if (c <= 1) { clearInterval(timer); return 0 }
          return c - 1
        })
      }, 1000)
    } finally {
      setSendLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    let res
    if (mode === 'phone') {
      res = await signIn('phone', { phone, code, redirect: false })
    } else {
      res = await signIn('email', { email, password, redirect: false })
    }

    if (res?.error) {
      setError(mode === 'phone' ? '验证码错误或已过期' : '邮箱或密码错误')
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-blue-600 mb-4">
            <Heart className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">家健</h1>
          <p className="text-gray-500 mt-1">家庭慢病行为托管系统</p>
        </div>

        {/* 登录卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">登录账号</h2>

          {/* 登录方式切换 */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => { setMode('phone'); setError('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'phone' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Phone size={15} />
              手机号登录
            </button>
            <button
              onClick={() => { setMode('email'); setError('') }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-all ${
                mode === 'email' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Mail size={15} />
              邮箱登录
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'phone' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                    placeholder="请输入手机号"
                    maxLength={11}
                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">验证码</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6位验证码"
                      maxLength={6}
                      className="flex-1 h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sendLoading || phone.length !== 11 || countdown > 0}
                      className="h-11 px-3 bg-blue-50 text-blue-600 text-sm rounded-lg border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {countdown > 0 ? `${countdown}s` : sendLoading ? '发送中' : '获取验证码'}
                    </button>
                  </div>
                </div>
              </>
            )}

            {mode === 'email' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">邮箱</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••"
                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}

            {error && (
              <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'phone' && code.length !== 6)}
              className="w-full h-11 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 注册入口 */}
          <div className="mt-5 text-center">
            <p className="text-sm text-gray-500">
              没有账号？
              <Link href="/register" className="text-blue-600 hover:underline font-medium ml-1">
                手机号注册 →
              </Link>
            </p>
          </div>

          {/* 演示账号 */}
          <div className="mt-5 p-4 bg-gray-50 rounded-xl">
            <p className="text-xs font-medium text-gray-600 mb-2">演示账号（邮箱登录）</p>
            <div className="space-y-1 text-xs text-gray-500">
              <p>家庭成员：father@demo.com / 123456</p>
              <p>管理师：manager@familyhealth.com / 123456</p>
            </div>
            <button
              onClick={() => fetch('/api/seed').then(() => alert('演示数据已初始化！'))}
              className="mt-2 text-xs text-blue-600 hover:underline"
            >
              初始化演示数据 →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
