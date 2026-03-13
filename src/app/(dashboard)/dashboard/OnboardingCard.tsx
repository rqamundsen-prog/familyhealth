'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingCard() {
  const router = useRouter()
  const [familyName, setFamilyName] = useState('我的家庭')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState<'none' | 'create' | 'join'>('none')
  const [msg, setMsg] = useState('')
  const [createdCode, setCreatedCode] = useState('')

  async function createFamily() {
    setLoading('create')
    setMsg('')
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', familyName }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.error || '创建失败')
        return
      }
      setCreatedCode(data.familyCode || '')
      setMsg('创建成功，已自动加入家庭')
      setTimeout(() => router.refresh(), 500)
    } finally {
      setLoading('none')
    }
  }

  async function joinFamily() {
    setLoading('join')
    setMsg('')
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'join', code: inviteCode }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.error || '加入失败')
        return
      }
      setMsg('加入成功')
      setTimeout(() => router.refresh(), 500)
    } finally {
      setLoading('none')
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-8">
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-2">欢迎使用家健</h1>
        <p className="text-sm text-gray-500 mb-6">你还未加入家庭。先完成下面任意一步，就能开始记录和查看健康数据。</p>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="rounded-lg border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-2">A. 我来创建家庭</h2>
            <input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full h-10 rounded border border-gray-300 px-3 text-sm"
              placeholder="家庭名称"
            />
            <button
              onClick={createFamily}
              disabled={loading !== 'none'}
              className="mt-3 w-full h-10 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
            >
              {loading === 'create' ? '创建中...' : '创建并加入'}
            </button>
            {createdCode && (
              <p className="mt-2 text-xs text-green-700">邀请码：<span className="font-mono font-semibold">{createdCode}</span>（可发给家人加入）</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-2">B. 输入邀请码加入</h2>
            <input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="w-full h-10 rounded border border-gray-300 px-3 text-sm"
              placeholder="例如 A1B2C3"
            />
            <button
              onClick={joinFamily}
              disabled={loading !== 'none'}
              className="mt-3 w-full h-10 rounded bg-emerald-600 text-white text-sm disabled:opacity-50"
            >
              {loading === 'join' ? '加入中...' : '加入家庭'}
            </button>
          </div>
        </div>

        <div className="mt-5 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <p>如果你是管理师，可先创建家庭，再把邀请码发给家属。</p>
        </div>

        {msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
      </div>
    </div>
  )
}
