/**
 * GitHub-backed SQLite persistence for Vercel
 * 
 * 策略：
 * - 冷启动时从 GitHub 下载最新的 SQLite 数据库
 * - 每次写操作后异步上传到 GitHub（防抖 5 秒）
 * - 使用 GitHub Contents API (base64 编码)
 * - 文件大小限制 100MB，对于用户数据库绰绰有余
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const GITHUB_REPO = process.env.GITHUB_REPO || 'rqamundsen-prog/familyhealth'
const DB_PATH_IN_REPO = 'data/familyhealth.db'
const TMP_DB = '/tmp/familyhealth.db'

const API_BASE = `https://api.github.com/repos/${GITHUB_REPO}/contents/${DB_PATH_IN_REPO}`

import { existsSync as shaFileExists, readFileSync as readShaFile } from 'fs'

// 尝试从冷启动时保存的 SHA 文件读取
let currentSha: string | null = (() => {
  try {
    if (shaFileExists('/tmp/familyhealth-sha.txt')) {
      return readShaFile('/tmp/familyhealth-sha.txt', 'utf8').trim()
    }
  } catch {}
  return null
})()
let syncTimer: NodeJS.Timeout | null = null
let isSyncing = false

/**
 * 从 GitHub 下载数据库到 /tmp
 */
export async function downloadDbFromGitHub(): Promise<boolean> {
  if (!GITHUB_TOKEN) {
    console.log('⚠️ GITHUB_TOKEN not set, skipping DB download')
    return false
  }

  try {
    const res = await fetch(API_BASE, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    if (res.status === 404) {
      console.log('📦 No existing DB in GitHub, will use template')
      return false
    }

    if (!res.ok) {
      console.error('❌ GitHub API error:', res.status, await res.text())
      return false
    }

    const data = await res.json()
    currentSha = data.sha

    // GitHub Contents API returns base64 encoded content
    const content = Buffer.from(data.content, 'base64')
    writeFileSync(TMP_DB, content)
    console.log(`✅ DB downloaded from GitHub (${content.length} bytes, sha: ${currentSha?.substring(0, 7)})`)
    return true
  } catch (e) {
    console.error('❌ Failed to download DB from GitHub:', e)
    return false
  }
}

/**
 * 上传数据库到 GitHub
 */
export async function uploadDbToGitHub(): Promise<boolean> {
  if (!GITHUB_TOKEN || isSyncing) return false
  if (!existsSync(TMP_DB)) return false

  isSyncing = true
  try {
    const content = readFileSync(TMP_DB)
    const base64Content = content.toString('base64')

    const body: any = {
      message: `auto: sync database ${new Date().toISOString()}`,
      content: base64Content,
      branch: 'main',
    }

    // If we have the SHA, include it for update (not create)
    if (currentSha) {
      body.sha = currentSha
    }

    const res = await fetch(API_BASE, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const text = await res.text()
      // If SHA mismatch, re-fetch SHA and retry
      if (res.status === 409 || text.includes('sha')) {
        console.log('⚠️ SHA mismatch, re-fetching...')
        await refreshSha()
        isSyncing = false
        return uploadDbToGitHub()
      }
      console.error('❌ GitHub upload error:', res.status, text)
      return false
    }

    const data = await res.json()
    currentSha = data.content?.sha || currentSha
    console.log(`✅ DB uploaded to GitHub (sha: ${currentSha?.substring(0, 7)})`)
    return true
  } catch (e) {
    console.error('❌ Failed to upload DB to GitHub:', e)
    return false
  } finally {
    isSyncing = false
  }
}

/**
 * 刷新文件的 SHA
 */
async function refreshSha(): Promise<void> {
  try {
    const res = await fetch(API_BASE, {
      headers: {
        'Authorization': `Bearer ${GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })
    if (res.ok) {
      const data = await res.json()
      currentSha = data.sha
    }
  } catch (e) {
    console.error('Failed to refresh SHA:', e)
  }
}

/**
 * 防抖同步：写操作后 5 秒内如果没有新写操作，就上传
 */
export function scheduleSyncToGitHub(): void {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = setTimeout(async () => {
    await uploadDbToGitHub()
  }, 5000)
}
