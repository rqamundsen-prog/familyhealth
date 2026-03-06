import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const { uploadDbToGitHub } = await import('@/lib/github-db-sync')
    const ok = await uploadDbToGitHub()
    return NextResponse.json({ synced: ok })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ 
    hasGithubToken: !!process.env.GITHUB_TOKEN,
    hasGithubRepo: !!process.env.GITHUB_REPO,
    repo: process.env.GITHUB_REPO || 'not set',
  })
}
