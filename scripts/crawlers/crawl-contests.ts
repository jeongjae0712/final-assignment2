/**
 * 위비티(wevity.com) 공모전 크롤러
 * 실행: npx tsx scripts/crawlers/crawl-contests.ts
 * 환경변수: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import type { ContestField } from '../../lib/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_KEY가 없습니다')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// 위비티 카테고리 → DB ContestField 매핑
const CATEGORY_MAP: Record<string, ContestField> = {
  '기획/아이디어':  'marketing',
  '마케팅/광고':    'marketing',
  '영상/UCC/사진':  'video',
  '디자인':         'design',
  '문학/수기':      'literature',
  '소프트웨어/IT':  'it',
  'IT/소프트웨어':  'it',
  '예체능':         'arts',
  '학술/논문':      'academic',
  '창업/경영':      'academic',
}

function mapCategory(raw: string): ContestField {
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (raw.includes(key)) return val
  }
  return 'marketing'
}

interface WevityItem {
  title: string
  organizer: string | null
  url: string
  field: ContestField
  end_date: string
  prize: string | null
  thumbnail_url: string | null
}

async function fetchPage(page: number): Promise<WevityItem[]> {
  const listUrl = `https://www.wevity.com/?c=find&s=${page}&gType=1&gbn=1`
  const res = await fetch(listUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; CBU-Matcher/1.0)',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
  })
  if (!res.ok) {
    console.warn(`페이지 ${page} 로드 실패: ${res.status}`)
    return []
  }

  const html = await res.text()
  const items: WevityItem[] = []

  // 위비티 목록 파싱 — li.item 구조
  const itemRegex = /<li[^>]*class="[^"]*item[^"]*"[^>]*>([\s\S]*?)<\/li>/g
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(html)) !== null) {
    const block = match[1]

    const titleMatch = block.match(/class="[^"]*tit[^"]*"[^>]*>([\s\S]*?)<\//)
    const hrefMatch  = block.match(/href="([^"]*wevity\.com[^"]*)"/)
    const dateMatch  = block.match(/(\d{4}[.\-/]\d{2}[.\-/]\d{2})/)
    const orgMatch   = block.match(/class="[^"]*host[^"]*"[^>]*>([\s\S]*?)<\//)
    const catMatch   = block.match(/class="[^"]*cate[^"]*"[^>]*>([\s\S]*?)<\//)
    const prizeMatch = block.match(/class="[^"]*prize[^"]*"[^>]*>([\s\S]*?)<\//)
    const thumbMatch = block.match(/src="(https?:\/\/[^"]*(?:jpg|jpeg|png|gif|webp)[^"]*)"/)

    const title = titleMatch?.[1]?.replace(/<[^>]+>/g, '').trim()
    const href  = hrefMatch?.[1]?.trim()
    if (!title || !href) continue

    const rawDate = dateMatch?.[1]?.replace(/[.\-]/g, '-') ?? ''
    const endDate = rawDate.match(/^\d{4}-\d{2}-\d{2}$/) ? rawDate
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)

    const rawCat = catMatch?.[1]?.replace(/<[^>]+>/g, '').trim() ?? ''
    const field  = mapCategory(rawCat)

    items.push({
      title,
      organizer: orgMatch?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null,
      url:       href,
      field,
      end_date:  endDate,
      prize:     prizeMatch?.[1]?.replace(/<[^>]+>/g, '').trim() ?? null,
      thumbnail_url: thumbMatch?.[1] ?? null,
    })
  }

  return items
}

async function run() {
  const MAX_PAGES = 5
  const now = new Date().toISOString()
  let total = 0

  for (let page = 1; page <= MAX_PAGES; page++) {
    const items = await fetchPage(page)
    if (items.length === 0) break

    // UPSERT — url이 UNIQUE이므로 중복 시 업데이트
    const rows = items.map(item => ({
      ...item,
      source: 'wevity',
      is_active: true,
      last_crawled_at: now,
    }))

    const { error } = await supabase
      .from('contests')
      .upsert(rows, { onConflict: 'url', ignoreDuplicates: false })

    if (error) {
      console.error(`페이지 ${page} upsert 오류:`, error.message)
    } else {
      console.log(`페이지 ${page}: ${items.length}건 upsert`)
      total += items.length
    }

    // 마감 지난 공모전 비활성화
    await supabase
      .from('contests')
      .update({ is_active: false })
      .lt('end_date', now.slice(0, 10))
      .eq('is_active', true)

    await new Promise(r => setTimeout(r, 1000)) // 1초 간격 (서버 부하 방지)
  }

  console.log(`완료: 총 ${total}건 처리`)
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
