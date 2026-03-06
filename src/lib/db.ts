import { PrismaClient } from '@prisma/client'
import { existsSync, copyFileSync } from 'fs'
import path from 'path'

const isVercel = !!process.env.VERCEL
const TMP_DB = '/tmp/familyhealth.db'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
  dbInitialized: boolean | undefined
}

/**
 * 初始化数据库（Vercel 环境）
 * 优先从 GitHub 下载，失败则使用模板
 */
async function initDb(): Promise<void> {
  if (!isVercel || existsSync(TMP_DB)) return
  
  // 尝试从 GitHub 下载
  if (process.env.GITHUB_TOKEN) {
    try {
      const { downloadDbFromGitHub } = await import('./github-db-sync')
      const downloaded = await downloadDbFromGitHub()
      if (downloaded) return
    } catch (e) {
      console.error('GitHub download failed:', e)
    }
  }

  // fallback: 从打包的模板数据库复制
  const templateDb = path.join(process.cwd(), 'prisma', 'prod.db')
  if (existsSync(templateDb)) {
    try {
      copyFileSync(templateDb, TMP_DB)
      console.log('✅ Database copied from template to /tmp')
    } catch (e) {
      console.error('❌ Failed to copy database:', e)
    }
  } else {
    console.error('❌ Template database not found at', templateDb)
  }
}

// 同步初始化（Vercel冷启动时尝试从GitHub下载）
if (isVercel && !existsSync(TMP_DB) && !globalForPrisma.dbInitialized) {
  // 先用模板确保有DB可用
  const templateDb = path.join(process.cwd(), 'prisma', 'prod.db')
  if (existsSync(templateDb)) {
    try {
      copyFileSync(templateDb, TMP_DB)
      console.log('✅ Database copied from template (will async download from GitHub)')
    } catch (e) {
      console.error('❌ Failed to copy template:', e)
    }
  }
  
  // 异步从 GitHub 下载覆盖（下次请求生效）
  if (process.env.GITHUB_TOKEN) {
    import('./github-db-sync').then(mod => {
      mod.downloadDbFromGitHub().then(ok => {
        if (ok) console.log('✅ GitHub DB downloaded, will be used on next cold start or after reconnect')
      })
    }).catch(() => {})
  }
  globalForPrisma.dbInitialized = true
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
    // 静默失败，不影响主流程
  }
}
