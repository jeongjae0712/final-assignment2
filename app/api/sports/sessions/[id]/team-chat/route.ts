import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST /api/sports/sessions/[id]/team-chat — 스포츠 매칭 팀채팅 생성 (개설자 전용)
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
    .select('organizer_id, sport, title, session_date')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 })
  if (session.organizer_id !== user.id) return NextResponse.json({ error: '개설자만 팀채팅을 생성할 수 있습니다' }, { status: 403 })

  const admin = createAdminClient()

  // 이미 생성된 팀채팅이 있으면 기존 방 반환
  const { data: existing } = await admin
    .from('chat_rooms')
    .select('id')
    .eq('type', 'sports_team')
    .eq('ref_id', sessionId)
    .single()

  if (existing) return NextResponse.json({ roomId: existing.id })

  // 새 스포츠 팀채팅 생성
  const roomName = `스포츠 팀채팅: ${session.sport} ${session.session_date}`
  const { data: room, error } = await admin
    .from('chat_rooms')
    .insert({ type: 'sports_team', name: roomName, ref_id: sessionId })
    .select('id')
    .single()

  if (error || !room) return NextResponse.json({ error: '팀채팅 생성에 실패했습니다' }, { status: 500 })

  await admin.from('chat_room_members').insert({ room_id: room.id, user_id: user.id })

  return NextResponse.json({ roomId: room.id }, { status: 201 })
}
