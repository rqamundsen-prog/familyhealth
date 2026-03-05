'use client'

import { useState, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Heart, Phone, Shield, ChevronRight } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()

  const [step, setStep] = useState<'phone' | 'verify'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [devCode, setDevCode] = useState('') // 开发模式显示验证码

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

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

      if (!res.ok) {
        setError(data.error || '发送失败')
        return
      }

      // 如果后端返回了验证码（短信未开通时），自动填入
      if (data.code) {
        setDevCode(data.code)
        setCode(data.code)
      }

      setCountdown(60)
      setStep('verify')
    } finally {
      setSendLoading(false)
    }
  }

  // 验证码登录/注册
  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (code.length !== 6) {
      setError('请输入6位验证码')
      return
    }
    setLoading(true)
    setError('')

    const res = await signIn('phone', {
      phone,
      code,
      redirect: false,
    })

    if (res?.error) {
      setError('验证码错误或已过期，请重新获取')
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

        {/* 卡片 */}
        <div className="bg-white rounded-2xl shadow-lg p-8">

          {/* 步骤1：输入手机号 */}
          {step === 'phone' && (
            <>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">手机号注册/登录</h2>
              <p className="text-sm text-gray-400 mb-6">未注册的手机号将自动创建账号</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Phone size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 11))}
                      placeholder="请输入手机号"
                      maxLength={11}
                      className="w-full h-11 rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  onClick={handleSendCode}
                  disabled={sendLoading || phone.length !== 11}
                  className="w-full h-11 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                >
                  {sendLoading ? '发送中...' : '获取验证码'}
                  {!sendLoading && <ChevronRight size={16} />}
                </button>
              </div>
            </>
          )}

          {/* 步骤2：输入验证码 */}
          {step === 'verify' && (
            <>
              <button
                onClick={() => { setStep('phone'); setCode(''); setError('') }}
                className="text-sm text-blue-600 hover:underline mb-4 flex items-center gap-1"
              >
                ← 修改手机号
              </button>

              <h2 className="text-lg font-semibold text-gray-900 mb-1">输入验证码</h2>
              {devCode ? (
                <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 mb-4">
                  <p className="text-sm text-green-700">
                    ✅ 验证码已自动填入，点击下方按钮即可完成注册
                  </p>
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-6">
                  已发送到 {phone.slice(0, 3)}****{phone.slice(-4)}
                </p>
              )}

              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    6位验证码
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <Shield size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={code}
                      onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="请输入验证码"
                      maxLength={6}
                      autoFocus
                      className="w-full h-11 rounded-lg border border-gray-300 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 tracking-widest font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    昵称（可选）
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="如：张爸爸"
                    maxLength={20}
                    className="w-full h-11 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length !== 6}
                  className="w-full h-11 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {loading ? '验证中...' : '登录 / 注册'}
                </button>

                {/* 重发验证码 */}
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-gray-400">{countdown}秒后可重新发送</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendCode}
                      disabled={sendLoading}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      重新发送验证码
                    </button>
                  )}
                </div>
              </form>
            </>
          )}

          {/* 底部提示 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              注册即同意
              <span className="text-blue-500 cursor-pointer"> 用户协议 </span>
              和
              <span className="text-blue-500 cursor-pointer"> 隐私政策</span>
            </p>
          </div>
        </div>

        {/* 登录入口 */}
        <p className="text-center text-sm text-gray-500 mt-4">
          已有账号？
          <Link href="/login" className="text-blue-600 hover:underline font-medium">
            邮箱登录
          </Link>
        </p>
      </div>
    </div>
  )
}
