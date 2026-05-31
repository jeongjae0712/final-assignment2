import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/chat/rooms/[roomId] — 채팅방 나가기
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { data: member } = await supabase
    .from('chat_room_members')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()
  if (!member) return NextResponse.json({ error: '채팅방 멤버가 아닙니다' }, { status: 404 })

  const { error } = await supabase
    .from('chat_room_members')
    .delete()
    .eq('room_id', roomId)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
