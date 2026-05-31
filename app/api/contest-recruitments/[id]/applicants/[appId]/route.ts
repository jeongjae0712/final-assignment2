import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id: recruitmentId, appId } = await params
  const body = await request.json().catch(() => null)
  const action = body?.action as 'accept' | 'reject'
  if (!action || !['accept', 'reject'].includes(action)) {
    return NextResponse.json({ error: '올바르지 않은 액션입니다' }, { status: 400 })
  }

  const { data: recruitment } = await supabase
    .from('contest_recruitments')
    .select('organizer_id, contest_id, title, max_members, status')
    .eq('id', recruitmentId)
    .single()

  if (!recruitment || recruitment.organizer_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }
  if (recruitment.status === 'closed') {
    return NextResponse.json({ error: '마감된 모집 공고입니다' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('contest_applications')
    .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
    .eq('id', appId).eq('recruitment_id', recruitmentId)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 개설자 닉네임 조회 + admin 클라이언트 (RLS 우회)
  const admin = createAdminClient()
  const { data: organizer } = await supabase
    .from('users').select('nickname').eq('id', user.id).single()
  const organizerNick = organizer?.nickname ?? '개설자'

  if (action === 'accept' && data) {
    // 수락 알림 (팀채팅은 팀 확정 시 생성)
    await admin.from('notifications').insert({
      user_id: data.applicant_id,
      type: 'contest_accepted',
      content: `${organizerNick}님이 "${recruitment.title}" 팀원 신청을 수락했습니다! 팀 확정 후 팀채팅이 개설됩니다.`,
      link: '/matches',
    })
  } else if (action === 'reject' && data) {
    await admin.from('notifications').insert({
      user_id: data.applicant_id,
      type: 'contest_rejected',
      content: `${organizerNick}님이 "${recruitment.title}" 팀원 신청을 거절했습니다.`,
      link: '/contests',
    })
  }

  return NextResponse.json({ application: data })
}