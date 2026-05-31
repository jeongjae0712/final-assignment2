import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> },
) {
  const { id: sessionId, appId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const action = body?.action as 'accept' | 'reject'
  if (!action || !['accept', 'reject'].includes(action)) {
    return NextResponse.json({ error: '올바르지 않은 액션입니다' }, { status: 400 })
  }

  const { data: session } = await supabase
    .from('sport_sessions')
    .select('organizer_id, sport, session_date, max_players, status')
    .eq('id', sessionId)
    .single()

  if (!session || session.organizer_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }
  if (session.status === 'closed') {
    return NextResponse.json({ error: '마감된 세션입니다' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('sport_session_applications')
    .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
    .eq('id', appId)
    .eq('session_id', sessionId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // 개설자 닉네임 조회
  const admin = createAdminClient()
  const { data: organizer } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single()
  const organizerNick = organizer?.nickname ?? '개설자'

  if (action === 'accept' && data) {
    // 수락 알림 (팀채팅은 매치 확정 시 생성)
    await admin.from('notifications').insert({
      user_id: data.applicant_id,
      type: 'sport_accepted',
      content: `${organizerNick}님이 스포츠 세션(${session.sport}) 신청을 수락했습니다! 매치 확정 후 팀채팅이 개설됩니다.`,
      link: '/matches',
    })
  } else if (action === 'reject' && data) {
    await admin.from('notifications').insert({
      user_id: data.applicant_id,
      type: 'sport_rejected',
      content: `${organizerNick}님이 스포츠 세션(${session.sport}) 신청을 거절했습니다.`,
      link: '/sports',
    })
  }

  return NextResponse.json({ application: data })
}