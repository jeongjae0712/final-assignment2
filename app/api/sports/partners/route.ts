import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FACILITY_MAP } from '@/lib/types/database'
import type { Facility } from '@/lib/types/database'

// GET /api/sports/partners?facility=futsal_a — 해당 시설에 관심 있는 스포츠 프로필 목록
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const facility = searchParams.get('facility') as Facility | null

  if (!facility) {
    return NextResponse.json({ error: '시설 정보가 필요합니다' }, { status: 400 })
  }

  // 시설에 대응하는 스포츠 종목 찾기
  const sportValue = Object.values(FACILITY_MAP).find(m =>
    m.facilities.includes(facility),
  )?.sportValue

  if (!sportValue) {
    return NextResponse.json({ error: '알 수 없는 시설입니다' }, { status: 400 })
  }

  const { data: profiles, error } = await supabase
    .from('sports_profiles')
    .select('user_id, sports, career_years, is_pro, intro, users!inner(nickname, is_active)')
    .eq('is_visible', true)
    .contains('sports', [sportValue])
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (profiles ?? [])
    .filter((p: { users: { is_active: boolean } | { is_active: boolean }[] | null }) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users
      return u?.is_active
    })
    .map((p: { user_id: string; sports: string[] | null; career_years: number; is_pro: boolean; intro: string | null; users: { nickname: string } | { nickname: string }[] | null }) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users
      return {
        user_id: p.user_id,
        nickname: u?.nickname ?? '',
        sports: p.sports,
        career_years: p.career_years,
        is_pro: p.is_pro,
        intro: p.intro,
      }
    })

  return NextResponse.json({ profiles: result })
}
