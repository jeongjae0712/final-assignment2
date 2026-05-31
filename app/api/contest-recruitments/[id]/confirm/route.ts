import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/contest-recruitments/[id]/confirm — 팀 확정 (팀채팅 생성)
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: recruitmentId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { data: recruitment } = await supabase
    .from('contest_recruitments')
    .select('organizer_id, title, team_chat_id')
    .eq('id', recruitmentId)
    .single()

  if (!recruitment) return NextResponse.json({ error: '모집 공고를 찾을 수 없습니다' }, { status: 404 })
  if (recruitment.organizer_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  if (recruitment.team_chat_id) return NextResponse.json({ error: '이미 확정된 팀입니다' }, { status: 409 })

  const { data: accepted } = await supabase
    .from('contest_applications')
    .select('id, applicant_id')
    .eq('recruitment_id', recruitmentId)
    .eq('status', 'accepted')

  if (!accepted || accepted.length === 0) {
    return NextResponse.json({ error: '수락된 신청자가 없습니다' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: room, error: roomError } = await admin
    .from('chat_rooms')
    .insert({ type: 'contest_team', name: `🏆 ${recruitment.title} 팀채팅`, ref_id: recruitmentId })
    .select('id')
    .single()

  if (roomError || !room) return NextResponse.json({ error: '팀채팅 생성에 실패했습니다' }, { status: 500 })

  const members = [
    { room_id: room.id, user_id: user.id },
    ...accepted.map(a => ({ room_id: room.id, user_id: a.applicant_id })),
  ]
  await admin.from('chat_room_members').insert(members)

  await admin
    .from('contest_recruitments')
    .update({ team_chat_id: room.id, status: 'closed' })
    .eq('id', recruitmentId)

  await admin
    .from('contest_applications')
    .update({ chat_room_id: room.id })
    .eq('recruitment_id', recruitmentId)
    .eq('status', 'accepted')

  const { data: organizer } = await supabase.from('users').select('nickname').eq('id', user.id).single()
  const organizerNick = organizer?.nickname ?? '개설자'

  await admin.from('notifications').insert(
    accepted.map(a => ({
      user_id: a.applicant_id,
      type: 'contest_confirmed',
      content: `${organizerNick}님이 "${recruitment.title}" 팀을 확정했습니다! 팀채팅에 참여하세요.`,
      link: `/chat/${room.id}`,
    }))
  )

  return NextResponse.json({ team_chat_id: room.id })
}