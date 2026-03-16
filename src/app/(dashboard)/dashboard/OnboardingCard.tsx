'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function OnboardingCard() {
  const router = useRouter()
  const [familyName, setFamilyName] = useState('家庭空间')
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState<'none' | 'start' | 'create' | 'join'>('none')
  const [msg, setMsg] = useState('')
  const [createdCode, setCreatedCode] = useState('')

  async function startPersonalSpace() {
    setLoading('start')
    setMsg('')
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', familyName: '我的情绪空间' }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMsg(data.error || '开启失败')
        return
      }
      setCreatedCode(data.familyCode || '')
      setMsg('已为你开启个人空间（默认仅自己可见）')
      setTimeout(() => router.refresh(), 500)
    } finally {
      setLoading('none')
    }
  }

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
        <h1 className="text-xl font-bold text-gray-900 mb-2">欢迎来到我的情绪（Within）</h1>
        <p className="text-sm text-gray-500 mb-6">先从你自己开始：默认仅自己可见。需要时再邀请家人一起协作。</p>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <h2 className="font-semibold text-blue-900 mb-2">A. 开始我的情绪（推荐）</h2>
            <p className="text-xs text-blue-700">一键开启个人空间，先记录、理解、照护你自己。</p>
            <button
              onClick={startPersonalSpace}
              disabled={loading !== 'none'}
              className="mt-3 w-full h-10 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
            >
              {loading === 'start' ? '开启中...' : '开始我的情绪'}
            </button>
          </div>

          <div className="rounded-lg border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-2">B. 创建家庭空间（可选）</h2>
            <input
              value={familyName}
              onChange={(e) => setFamilyName(e.target.value)}
              className="w-full h-10 rounded border border-gray-300 px-3 text-sm"
              placeholder="例如：爸爸妈妈的照护空间"
            />
            <button
              onClick={createFamily}
              disabled={loading !== 'none'}
              className="mt-3 w-full h-10 rounded bg-slate-700 text-white text-sm disabled:opacity-50"
            >
              {loading === 'create' ? '创建中...' : '创建家庭空间'}
            </button>
          </div>

          <div className="rounded-lg border border-gray-100 p-4">
            <h2 className="font-semibold text-gray-900 mb-2">C. 我有邀请码</h2>
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
              {loading === 'join' ? '加入中...' : '输入邀请码加入'}
            </button>
          </div>
        </div>

        {createdCode && (
          <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-700">
            邀请码：<span className="font-mono font-semibold">{createdCode}</span>（后续你可发给家人加入）
          </div>
        )}

        <div className="mt-5 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">
          <p>产品以个人为起点；家庭协作是可选增强层。</p>
        </div>

        {msg && <p className="mt-4 text-sm text-gray-700">{msg}</p>}
      </div>
    </div>
  )
}
