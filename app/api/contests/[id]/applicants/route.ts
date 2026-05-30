import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ContestField } from '@/lib/types/database'

// GET /api/contests/[id]/applicants — 해당 공모전 분야에 관심 있는 사용자 목록
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { id: contestId } = await params

  // 공모전 분야 조회
  const { data: contest } = await supabase
    .from('contests')
    .select('field')
    .eq('id', contestId)
    .single()

  if (!contest) {
    return NextResponse.json({ error: '공모전을 찾을 수 없습니다' }, { status: 404 })
  }

  // 해당 분야에 관심 있는 프로필 + 유저 정보 JOIN
  const { data: profiles, error } = await supabase
    .from('contest_profiles')
    .select('user_id, department, fields, intro, users!inner(nickname, is_active)')
    .eq('is_visible', true)
    .contains('fields', [contest.field as ContestField])
    .limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const result = (profiles ?? [])
    .filter((p: { users: { is_active: boolean } | { is_active: boolean }[] | null }) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users
      return u?.is_active
    })
    .map((p: { user_id: string; department: string; fields: ContestField[] | null; intro: string | null; users: { nickname: string } | { nickname: string }[] | null }) => {
      const u = Array.isArray(p.users) ? p.users[0] : p.users
      return {
        user_id: p.user_id,
        nickname: u?.nickname ?? '',
        department: p.department,
        fields: p.fields,
        intro: p.intro,
      }
    })

  return NextResponse.json({ profiles: result })
}
