import { PrismaClient } from '@prisma/client'
import { existsSync, copyFileSync, writeFileSync } from 'fs'
import path from 'path'

const isVercel = !!process.env.VERCEL
const TMP_DB = '/tmp/familyhealth.db'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbReady: boolean | undefined
}

// 同步从 GitHub 下载数据库（使用 synchronous XMLHttpRequest 的替代方案）
function syncDownloadFromGitHub(): boolean {
  if (!process.env.GITHUB_TOKEN || !process.env.GITHUB_REPO) return false
  
  const repo = process.env.GITHUB_REPO
  const token = process.env.GITHUB_TOKEN
  const url = `https://api.github.com/repos/${repo}/contents/data/familyhealth.db`
  
  try {
    // 使用 child_process.execSync 同步下载
    const { execSync } = require('child_process')
    const result = execSync(
      `curl -s -H "Authorization: Bearer ${token}" -H "Accept: application/vnd.github.v3+json" "${url}"`,
      { timeout: 10000, encoding: 'utf8' }
    )
    const data = JSON.parse(result)
    if (data.content && data.sha) {
      const content = Buffer.from(data.content.replace(/\n/g, ''), 'base64')
      writeFileSync(TMP_DB, content)
      // 存储 SHA 供后续更新使用
      writeFileSync('/tmp/familyhealth-sha.txt', data.sha)
      console.log(`✅ DB synced from GitHub (${content.length} bytes)`)
      return true
    }
  } catch (e) {
    console.error('GitHub sync failed:', e)
  }
  return false
}

// Vercel 冷启动：优先从 GitHub 下载，失败则用模板
if (isVercel && !globalForPrisma.dbReady) {
  let downloaded = false
  if (!existsSync(TMP_DB)) {
    downloaded = syncDownloadFromGitHub()
  }
  
  if (!downloaded && !existsSync(TMP_DB)) {
    const templateDb = path.join(process.cwd(), 'prisma', 'prod.db')
    if (existsSync(templateDb)) {
      try {
        copyFileSync(templateDb, TMP_DB)
        console.log('✅ DB copied from template')
      } catch (e) {
        console.error('❌ Failed to copy template:', e)
      }
    }
  }
  globalForPrisma.dbReady = true
}

const dbUrl = isVercel ? `file:${TMP_DB}` : (process.env.DATABASE_URL || 'file:./prisma/dev.db')

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: { db: { url: dbUrl } },
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

/**
 * 触发数据库同步到 GitHub（写操作后调用）
 */
export async function syncDbAfterWrite(): Promise<void> {
  if (!isVercel || !process.env.GITHUB_TOKEN) return
  try {
    const { scheduleSyncToGitHub } = await import('./github-db-sync')
    scheduleSyncToGitHub()
  } catch (e) {
    // 静默失败
  }
}
