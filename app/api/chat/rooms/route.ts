import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET: 내 채팅방 목록 (최근 메시지 포함)
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { data: memberships } = await supabase
    .from('chat_room_members')
    .select('room_id, last_read_at, room:chat_rooms(id, type, name, created_at)')
    .eq('user_id', user.id)
    .order('room_id')

  if (!memberships) return NextResponse.json({ rooms: [] })

  const admin = createAdminClient()
  const rooms = await Promise.all(memberships.map(async m => {
    const room = (m.room as unknown) as { id: string; type: string; name: string | null; created_at: string }
    const roomId = room.id

    // 마지막 메시지
    const { data: lastMsg } = await admin
      .from('chat_messages')
      .select('content, created_at, sender:users!chat_messages_sender_id_fkey(nickname)')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // 안읽은 메시지 수
    const { count: unread } = await admin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', roomId)
      .gt('created_at', m.last_read_at)

    // 상대방 정보 (DM의 경우)
    let partnerNickname: string | null = null
    if (room.type === 'dm') {
      const { data: members } = await admin
        .from('chat_room_members')
        .select('user_id, user:users!chat_room_members_user_id_fkey(nickname)')
        .eq('room_id', roomId)
        .neq('user_id', user.id)
        .limit(1)
      partnerNickname = (members?.[0]?.user as unknown as { nickname: string } | null)?.nickname ?? null
    }

    return {
      id: roomId,
      type: room.type,
      name: room.type === 'dm' ? partnerNickname : room.name,
      lastMessage: lastMsg ? { content: (lastMsg as unknown as { content: string }).content, created_at: (lastMsg as unknown as { created_at: string }).created_at } : null,
      unreadCount: unread ?? 0,
    }
  }))

  rooms.sort((a, b) => {
    const ta = a.lastMessage?.created_at ?? ''
    const tb = b.lastMessage?.created_at ?? ''
    return tb.localeCompare(ta)
  })

  return NextResponse.json({ rooms })
}

// POST: DM 채팅방 찾기/생성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const partnerId: string | undefined = body?.partner_id
  if (!partnerId || partnerId === user.id) {
    return NextResponse.json({ error: '유효하지 않은 상대방입니다' }, { status: 400 })
  }

  const admin = createAdminClient()

  // 기존 DM 방 탐색
  const { data: myRooms } = await admin
    .from('chat_room_members')
    .select('room_id')
    .eq('user_id', user.id)

  if (myRooms && myRooms.length > 0) {
    const myRoomIds = myRooms.map(r => r.room_id)
    const { data: sharedRooms } = await admin
      .from('chat_room_members')
      .select('room_id')
      .eq('user_id', partnerId)
      .in('room_id', myRoomIds)

    if (sharedRooms && sharedRooms.length > 0) {
      const { data: dmRoom } = await admin
        .from('chat_rooms')
        .select('id')
        .eq('type', 'dm')
        .in('id', sharedRooms.map(r => r.room_id))
        .limit(1)
        .single()
      if (dmRoom) return NextResponse.json({ roomId: dmRoom.id })
    }
  }

  // 새 DM 방 생성
  const { data: room, error } = await admin
    .from('chat_rooms')
    .insert({ type: 'dm' })
    .select()
    .single()
  if (error || !room) return NextResponse.json({ error: '채팅방 생성에 실패했습니다' }, { status: 500 })

  await admin.from('chat_room_members').insert([
    { room_id: room.id, user_id: user.id },
    { room_id: room.id, user_id: partnerId },
  ])

  return NextResponse.json({ roomId: room.id }, { status: 201 })
}