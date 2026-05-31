/**
 * 충북대 학내체육시설 예약현황 크롤러 (Playwright 기반)
 * URL: https://sports.chungbuk.ac.kr/cbnu_facilities3_2
 * 실행: npx tsx scripts/crawlers/crawl-sports.ts
 *
 * 환경변수:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY
 *   SPORTS_USERNAME   (충북대 스포츠센터 학번)
 *   SPORTS_PASSWORD
 */

import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'
import type { Facility } from '../../lib/types/database'

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY   = process.env.SUPABASE_SERVICE_KEY!
const USERNAME      = process.env.SPORTS_USERNAME!
const PASSWORD      = process.env.SPORTS_PASSWORD!
const BASE          = 'https://sports.chungbuk.ac.kr'
const RESERVE_URL   = `${BASE}/cbnu_facilities3_2`

if (!SUPABASE_URL || !SERVICE_KEY || !USERNAME || !PASSWORD) {
  console.error('필수 환경변수가 없습니다 (SUPABASE_URL, SERVICE_KEY, SPORTS_USERNAME, SPORTS_PASSWORD)')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

function mapFacility(name: string): Facility | null {
  const n = name.trim()
  if (/풋살/.test(n)) {
    if (/B코트|B\$/i.test(n)) return 'futsal_b'
    return 'futsal_a'
  }
  if (/농구/.test(n)) {
    if (/B코트|B\$/i.test(n)) return 'basketball_b'
    return 'basketball_a'
  }
  if (/테니스/.test(n)) {
    if (/E코트|E\$/i.test(n)) return 'tennis_e'
    if (/D코트|D\$/i.test(n)) return 'tennis_d'
    if (/C코트|C\$/i.test(n)) return 'tennis_c'
    if (/B코트|B\$/i.test(n)) return 'tennis_b'
    return 'tennis_a'
  }
  if (/소운동장/.test(n)) return 'small_field'
  if (/종합운동장|주운동장/.test(n)) return 'main_field'
  return null
}

// 시설 유형 코드 탭 목록 (운동장=1, 풋살=2, 농구=3, 테니스=4)
const FACILITY_TYPE_CODES = ['1', '2', '3', '4']

interface SlotRow {
  facility: Facility
  reservation_date: string
  start_time: string
  end_time: string
  status: 'available' | 'reserved' | 'closed'
  last_crawled_at: string
}

async function run() {
  const browser = await chromium.launch({ headless: true })
  const ctx = await browser.newContext({ locale: 'ko-KR' })
  const page = await ctx.newPage()

  try {
    // 1. 로그인
    console.log('로그인 중...')
    await page.goto(`${BASE}/index.php?mid=home&act=dispMemberLoginForm`, { waitUntil: 'domcontentloaded' })
    await page.fill('input[name="user_id"]', USERNAME)
    await page.fill('input[name="password"]', PASSWORD)
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded' }),
      page.click('input[type="submit"]'),
    ])

    // 로그인 확인
    const isLoggedIn = await page.$('.after_login') !== null
    if (!isLoggedIn) {
      console.error('로그인 실패 — 계정 정보를 확인하세요')
      process.exit(1)
    }
    console.log('로그인 성공')

    // 2. 예약현황 페이지 이동
    await page.goto(RESERVE_URL, { waitUntil: 'domcontentloaded' })

    const now = new Date().toISOString()
    const allSlots: SlotRow[] = []

    // 3. 각 시설 유형 탭 순회
    for (const code of FACILITY_TYPE_CODES) {
      const tabSelector = `li.facility_type[code="${code}"]`
      const tabExists = await page.$(tabSelector)
      if (!tabExists) continue

      await page.click(tabSelector)
      // AJAX 데이터 로드 대기
      await page.waitForTimeout(1500)

      // 시설 목록 파싱
      interface FacData {
        name: string
        dates: string[]
        times: Array<{ start: string; end: string }>
        states: Array<Array<{ date: string; state: number }>>
      }
      const facilities = (await page.evaluate(() => {
        const results: Array<{
          name: string
          dates: string[]
          times: Array<{ start: string; end: string }>
          states: Array<Array<{ date: string; state: number }>>
        }> = []

        document.querySelectorAll('#facilities > li').forEach((li) => {
          const name = li.querySelector('h5')?.textContent?.trim() ?? ''
          const table = li.querySelector('.time_table')
          if (!table) return

          // 날짜 헤더 추출 (텍스트에서 YYYY-MM-DD 파싱)
          const dates: string[] = []
          table.querySelectorAll('thead th').forEach((th) => {
            const m = th.textContent?.match(/(\d{4}-\d{2}-\d{2})/)
            if (m) dates.push(m[1])
          })

          // 시간대 추출 (첫 번째 열)
          const times: Array<{ start: string; end: string }> = []
          table.querySelectorAll('tbody tr').forEach((tr) => {
            const timeTh = tr.querySelector('th span.time')
            if (!timeTh) return
            const [start, end] = (timeTh.textContent ?? '').split('~').map(s => s.trim())
            if (start && end) times.push({ start, end })
          })

          // 각 셀 상태 추출 (0: 없음, 1: 예약가능, 2: 예약완료, disabled)
          const states: Array<Array<{ date: string; state: number }>> = times.map(() => [])
          table.querySelectorAll('tbody tr').forEach((tr, rowIdx) => {
            if (rowIdx >= times.length) return
            let colIdx = 0
            tr.querySelectorAll('td.res, td.disabled').forEach((td) => {
              const date = dates[colIdx] ?? ''
              if (!date) { colIdx++; return }
              const cls = td.className
              const state = cls.includes('state_2') ? 2 : cls.includes('state_1') ? 1 : cls.includes('disabled') ? 0 : 1
              states[rowIdx].push({ date, state })
              colIdx++
            })
          })

          results.push({ name, dates, times, states })
        })
        return results
      })) as FacData[]

      for (const fac of facilities) {
        const facility = mapFacility(fac.name)
        if (!facility) {
          console.warn(`시설 매핑 실패: "${fac.name}"`)
          continue
        }

        fac.times.forEach(({ start, end }: { start: string; end: string }, rowIdx: number) => {
          fac.states[rowIdx]?.forEach(({ date, state }: { date: string; state: number }) => {
            if (!date) return
            const status: SlotRow['status'] = state === 0 ? 'closed' : state === 2 ? 'reserved' : 'available'
            allSlots.push({
              facility,
              reservation_date: date,
              start_time: start,
              end_time: end,
              status,
              last_crawled_at: now,
            })
          })
        })
      }

      console.log(`코드 ${code}: ${facilities.length}개 시설 파싱`)
    }

    // 4. Supabase upsert
    if (allSlots.length === 0) {
      console.log('수집된 슬롯 없음')
    } else {
      const { error } = await supabase
        .from('sports_reservations')
        .upsert(allSlots, { onConflict: 'facility,reservation_date,start_time' })
      if (error) console.error('upsert 오류:', error.message)
      else console.log(`완료: ${allSlots.length}개 슬롯 upsert`)
    }
  } finally {
    await browser.close()
  }
}

run().catch(e => {
  console.error(e)
  process.exit(1)
})
