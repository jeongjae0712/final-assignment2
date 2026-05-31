import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/sports/sessions/[id]/confirm — 매치 확정 (팀채팅 생성)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { data: session } = await supabase
    .from('sport_sessions')
    .select('organizer_id, sport, session_date, team_chat_id')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 })
  if (session.organizer_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  if (session.team_chat_id) return NextResponse.json({ error: '이미 확정된 매치입니다' }, { status: 409 })

  // 수락된 신청자 목록 조회
  const { data: accepted } = await supabase
    .from('sport_session_applications')
    .select('id, applicant_id')
    .eq('session_id', sessionId)
    .eq('status', 'accepted')

  if (!accepted || accepted.length === 0) {
    return NextResponse.json({ error: '수락된 신청자가 없습니다' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 팀채팅 생성
  const roomName = `⚽ ${session.sport} 팀채팅 (${session.session_date})`
  const { data: room, error: roomError } = await admin
    .from('chat_rooms')
    .insert({ type: 'sports_team', name: roomName, ref_id: sessionId })
    .select('id')
    .single()

  if (roomError || !room) return NextResponse.json({ error: '팀채팅 생성에 실패했습니다' }, { status: 500 })

  // 개설자 + 모든 수락 신청자 채팅방 멤버 추가
  const members = [
    { room_id: room.id, user_id: user.id },
    ...accepted.map(a => ({ room_id: room.id, user_id: a.applicant_id })),
  ]
  await admin.from('chat_room_members').insert(members)

  // sport_sessions에 team_chat_id 저장 + 마감 처리
  await admin
    .from('sport_sessions')
    .update({ team_chat_id: room.id, status: 'closed' })
    .eq('id', sessionId)

  // 모든 수락 신청자의 chat_room_id 업데이트
  await admin
    .from('sport_session_applications')
    .update({ chat_room_id: room.id })
    .eq('session_id', sessionId)
    .eq('status', 'accepted')

  // 개설자 닉네임 조회
  const { data: organizer } = await supabase.from('users').select('nickname').eq('id', user.id).single()
  const organizerNick = organizer?.nickname ?? '개설자'

  // 모든 수락 신청자에게 확정 알림
  await admin.from('notifications').insert(
    accepted.map(a => ({
      user_id: a.applicant_id,
      type: 'sport_confirmed',
      content: `${organizerNick}님이 ${session.sport} 매치를 확정했습니다! 팀채팅에 참여하세요.`,
      link: `/chat/${room.id}`,
    }))
  )

  return NextResponse.json({ team_chat_id: room.id })
}