import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// PATCH /api/sports/sessions/[id]/applicants/[appId] — 신청 수락/거절 (개설자 전용)
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

  if (action === 'accept' && data) {
    const admin = createAdminClient()

    // 스포츠 팀채팅 생성
    const roomName = `스포츠 팀채팅: ${session.sport} ${session.session_date}`
    const { data: room } = await admin
      .from('chat_rooms')
      .insert({ type: 'sports_team', name: roomName, ref_id: appId })
      .select('id')
      .single()

    if (room) {
      await admin.from('chat_room_members').insert([
        { room_id: room.id, user_id: session.organizer_id },
        { room_id: room.id, user_id: data.applicant_id },
      ])
      await admin
        .from('sport_session_applications')
        .update({ chat_room_id: room.id })
        .eq('id', appId)

      // 신청자에게 수락 알림
      await admin.from('notifications').insert({
        user_id: data.applicant_id,
        type: 'sport_accepted',
        content: `스포츠 세션(${session.sport}) 신청이 수락되었습니다! 팀채팅을 확인하세요.`,
        link: `/chat/${room.id}`,
      })
    }

    // 수락 인원이 max_players에 도달하면 자동 마감
    const { count: acceptedCount } = await supabase
      .from('sport_session_applications')
      .select('*', { count: 'exact', head: true })
      .eq('session_id', sessionId)
      .eq('status', 'accepted')

    if ((acceptedCount ?? 0) >= session.max_players - 1) {
      await supabase.from('sport_sessions').update({ status: 'closed' }).eq('id', sessionId)
    }
  } else if (action === 'reject' && data) {
    // 신청자에게 거절 알림
    await supabase.from('notifications').insert({
      user_id: data.applicant_id,
      type: 'sport_rejected',
      content: `스포츠 세션(${session.sport}) 신청이 거절되었습니다.`,
      link: '/sports',
    })
  }

  return NextResponse.json({ application: data })
}