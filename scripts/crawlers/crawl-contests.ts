/**
 * 위비티(wevity.com) 지역 공모전 크롤러 — Playwright 사용
 * 충북 · 충남 · 대전 · 세종 지역 공모전 수집
 * 실행: npm run crawl:contests
 */

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import type { ContestField } from '../../lib/types/database'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_KEY!
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('환경변수 누락: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_KEY')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

// ─── 지역 키워드 ──────────────────────────────────────────────
const REGION_KEYWORDS: Record<string, string[]> = {
  충북: ['충북', '충청북도', '청주', '충주', '제천', '보은', '옥천', '영동', '증평', '진천', '괴산', '음성', '단양', '충북대'],
  충남: ['충남', '충청남도', '천안', '공주', '보령', '아산', '서산', '논산', '계룡', '당진', '금산', '부여', '서천', '청양', '홍성', '예산', '태안'],
  대전: ['대전', '대전광역시', '유성구', '대덕구'],
  세종: ['세종', '세종시', '세종특별자치'],
}
type Region = keyof typeof REGION_KEYWORDS
const REGIONS = Object.keys(REGION_KEYWORDS) as Region[]

function detectRegion(text: string): Region | null {
  for (const r of REGIONS) {
    if (REGION_KEYWORDS[r].some(kw => text.includes(kw))) return r
  }
  return null
}

// ─── 분야 매핑 ────────────────────────────────────────────────
const FIELD_MAP: [string, ContestField][] = [
  ['영상', 'video'], ['UCC', 'video'], ['사진', 'video'],
  ['디자인', 'design'], ['웹툰', 'design'], ['캐릭터', 'design'],
  ['IT', 'it'], ['소프트웨어', 'it'], ['웹/모바일', 'it'], ['게임', 'it'], ['과학', 'it'], ['공학', 'it'],
  ['문학', 'literature'], ['소설', 'literature'], ['시나리오', 'literature'],
  ['예체능', 'arts'], ['미술', 'arts'], ['음악', 'arts'], ['건축', 'arts'],
  ['논문', 'academic'], ['리포트', 'academic'],
  ['광고', 'marketing'], ['마케팅', 'marketing'], ['기획', 'marketing'], ['아이디어', 'marketing'],
]
function mapField(raw: string): ContestField {
  for (const [k, v] of FIELD_MAP) { if (raw.includes(k)) return v }
  return 'marketing'
}

interface ContestRow {
  title: string; organizer: string | null; url: string
  field: ContestField; end_date: string; region: Region
  source: string; is_active: boolean; last_crawled_at: string
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const page    = await browser.newPage()
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'ko-KR,ko;q=0.9' })

  const now   = new Date().toISOString()
  const today = now.slice(0, 10)
  const all   = new Map<string, ContestRow>()

  console.log('위비티 크롤링 시작 (지역: 충북·충남·대전·세종)\n')

  try {
    await page.goto('https://www.wevity.com/?c=find&s=1&gub=1', {
      waitUntil: 'networkidle', timeout: 30000,
    })

    const MAX_PAGES = 20

    for (let pg = 1; pg <= MAX_PAGES; pg++) {
      if (pg > 1) {
        // 다음 페이지 버튼 클릭 또는 URL 직접 이동
        try {
          await page.goto(`https://www.wevity.com/?c=find&s=1&gub=1&gp=${pg}`, {
            waitUntil: 'networkidle', timeout: 20000,
          })
        } catch {
          console.log(`페이지 ${pg} 로드 실패, 중단`)
          break
        }
      }

      // 리스트 항목 추출
      const items = await page.evaluate(() => {
        const rows: { title: string; href: string; organizer: string; field: string; dday: string }[] = []
        document.querySelectorAll('ul.list li:not(.top)').forEach(li => {
          const a = li.querySelector('.tit a') as HTMLAnchorElement | null
          const sub = li.querySelector('.sub-tit')
          const organ = li.querySelector('.organ')
          const day = li.querySelector('.day')
          if (!a) return
          rows.push({
            title:     a.textContent?.trim() ?? '',
            href:      a.href,
            organizer: organ?.textContent?.trim() ?? '',
            field:     sub?.textContent?.trim() ?? '',
            dday:      day?.textContent?.trim() ?? '',
          })
        })
        return rows
      })

      if (items.length === 0) { console.log(`페이지 ${pg}: 항목 없음, 중단`); break }

      let pageRegional = 0
      for (const it of items) {
        if (it.dday.includes('마감완료') || it.dday.includes('종료')) continue

        const region = detectRegion(it.title + ' ' + it.organizer)
        if (!region) continue

        // D-숫자 → 날짜 계산
        const ddayMatch = it.dday.match(/D-(\d+)/)
        const end_date  = ddayMatch
          ? new Date(Date.now() + parseInt(ddayMatch[1]) * 86400000).toISOString().slice(0, 10)
          : new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10)

        const url = it.href.startsWith('http') ? it.href : 'https://www.wevity.com/' + it.href
        if (!all.has(url)) {
          all.set(url, {
            title:     it.title,
            organizer: it.organizer || null,
            url,
            field:     mapField(it.field),
            end_date,
            region,
            source:          'wevity',
            is_active:       true,
            last_crawled_at: now,
          })
          pageRegional++
        }
      }

      const regionCounts = REGIONS.map(r =>
        `${r}:${[...all.values()].filter(i => i.region === r).length}`
      ).join(' ')
      console.log(`페이지 ${pg}: ${items.length}건 중 지역 ${pageRegional}건 | 누적 ${all.size}건 (${regionCounts})`)

      await page.waitForTimeout(800)
    }
  } finally {
    await browser.close()
  }

  if (all.size === 0) {
    console.log('\n지역 공모전을 찾지 못했습니다.')
    process.exit(0)
  }

  const rows = [...all.values()]
  console.log(`\n${rows.length}건 DB 저장 중...`)

  const { error } = await supabase
    .from('contests')
    .upsert(rows, { onConflict: 'url', ignoreDuplicates: false })

  if (error) { console.error('upsert 오류:', error.message); process.exit(1) }

  await supabase
    .from('contests')
    .update({ is_active: false })
    .lt('end_date', today)
    .eq('is_active', true)
    .not('region', 'is', null)

  for (const r of REGIONS) {
    console.log(`  ${r}: ${rows.filter(i => i.region === r).length}건`)
  }
  console.log(`\n완료: 총 ${rows.length}건`)
}

run().catch(e => { console.error(e); process.exit(1) })