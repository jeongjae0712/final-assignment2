import { NextRequest, NextResponse } from 'next/server'
import { spawn } from 'child_process'
import path from 'path'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 10

// GET /api/contests/crawl — Vercel Cron 또는 수동 트리거로 공모전 크롤링 실행
// Vercel Cron: Authorization: Bearer {CRON_SECRET}
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = request.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: '권한이 없습니다' }, { status: 401 })
    }
  }

  const admin = createAdminClient()

  // 마지막 크롤링 시점 확인 — 2주(14일) 이내면 스킵
  const { data: latest } = await admin
    .from('contests')
    .select('last_crawled_at')
    .order('last_crawled_at', { ascending: false })
    .limit(1)
    .single()

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  if (latest?.last_crawled_at && new Date(latest.last_crawled_at) > twoWeeksAgo) {
    return NextResponse.json({
      skipped: true,
      message: '마지막 크롤링이 2주 이내입니다',
      last_crawled_at: latest.last_crawled_at,
    })
  }

  // 크롤러 스크립트를 별도 프로세스로 실행 (fire-and-forget)
  try {
    const scriptPath = path.join(process.cwd(), 'scripts', 'crawlers', 'crawl-contests.ts')
    const proc = spawn(
      process.platform === 'win32' ? 'node_modules\\.bin\\tsx.cmd' : 'node_modules/.bin/tsx',
      [scriptPath],
      {
        cwd: process.cwd(),
        detached: true,
        stdio: 'ignore',
        env: { ...process.env },
      }
    )
    proc.unref()
  } catch {
    return NextResponse.json({ error: '크롤러 실행에 실패했습니다' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message: '공모전 크롤링이 시작되었습니다',
    started_at: new Date().toISOString(),
  })
}
