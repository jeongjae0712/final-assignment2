import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { MatchStatus } from '@/lib/types/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body?.action) return NextResponse.json({ error: '액션이 필요합니다' }, { status: 400 })

  const action: 'accept' | 'reject' | 'cancel' = body.action

  const { data: match, error: fetchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !match) return NextResponse.json({ error: '매칭을 찾을 수 없습니다' }, { status: 404 })

  const isRequester = match.requester_id === user.id
  const isReceiver = match.receiver_id === user.id

  if (!isRequester && !isReceiver) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  if (match.status !== 'pending') return NextResponse.json({ error: '이미 처리된 신청입니다' }, { status: 409 })
  if (action === 'cancel' && !isRequester) return NextResponse.json({ error: '신청자만 취소할 수 있습니다' }, { status: 403 })
  if ((action === 'accept' || action === 'reject') && !isReceiver) return NextResponse.json({ error: '수신자만 수락/거절할 수 있습니다' }, { status: 403 })

  const statusMap: Record<string, MatchStatus> = { accept: 'accepted', reject: 'rejected', cancel: 'cancelled' }
  const newStatus = statusMap[action]

  const { data: updated, error: updateError } = await supabase
    .from('matches')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id).eq('status', 'pending')
    .select().single()

  if (updateError || !updated) return NextResponse.json({ error: '이미 처리된 신청입니다' }, { status: 409 })

  // 수락 시 팀채팅 생성
  if (action === 'accept') {
    const admin = createAdminClient()

    // 팀채팅 방 생성
    const chatName = match.type === 'sports' ? '스포츠 팀채팅' : '공모전 팀채팅'
    const { data: room } = await admin
      .from('chat_rooms')
      .insert({ type: 'sports_team', name: chatName, ref_id: match.id })
      .select('id').single()

    if (room) {
      await admin.from('chat_room_members').insert([
        { room_id: room.id, user_id: match.requester_id },
        { room_id: room.id, user_id: match.receiver_id },
      ])
      // 채팅방 ID 저장
      await admin.from('matches').update({ chat_room_id: room.id }).eq('id', id)
      updated.chat_room_id = room.id
    }

    const { data: requesterData } = await supabase.from('users').select('email').eq('id', match.requester_id).single()

    return NextResponse.json({
      match: updated,
      chat_room_id: updated.chat_room_id,
      requester_email: requesterData?.email ?? null,
      message: '매칭이 성사되었습니다! 팀채팅에서 대화를 시작하세요.',
    })
  }

  return NextResponse.json({ match: updated })
}