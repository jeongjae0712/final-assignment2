import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id: recruitmentId } = await params
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '요청 형식이 올바르지 않습니다' }, { status: 400 })

  const { intro, background } = body as { intro: string; background?: string }
  if (!intro?.trim()) return NextResponse.json({ error: '자기소개를 입력해주세요' }, { status: 400 })

  const { data: recruitment } = await supabase
    .from('contest_recruitments')
    .select('organizer_id, status, title')
    .eq('id', recruitmentId)
    .single()

  if (!recruitment) return NextResponse.json({ error: '모집 공고를 찾을 수 없습니다' }, { status: 404 })
  if (recruitment.status !== 'open') return NextResponse.json({ error: '마감된 모집입니다' }, { status: 400 })
  if (recruitment.organizer_id === user.id) return NextResponse.json({ error: '본인이 작성한 모집에는 신청할 수 없습니다' }, { status: 400 })

  const { data, error } = await supabase
    .from('contest_applications')
    .insert({
      recruitment_id: recruitmentId,
      applicant_id: user.id,
      intro: intro.trim(),
      background: background?.trim() ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: '이미 신청하였습니다' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 개설자에게 알림 (admin 클라이언트로 RLS 우회)
  const admin = createAdminClient()
  const { data: applicant } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single()

  await admin.from('notifications').insert({
    user_id: recruitment.organizer_id,
    type: 'contest_application',
    content: `${applicant?.nickname ?? '누군가'}님이 "${recruitment.title}" 팀원 모집에 신청했습니다.`,
    link: '/matches',
  })

  return NextResponse.json({ application: data }, { status: 201 })
}
