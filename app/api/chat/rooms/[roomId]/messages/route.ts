import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
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
  if (!member) return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })

  // last_read_at 업데이트
  await supabase
    .from('chat_room_members')
    .update({ last_read_at: new Date().toISOString() })
    .eq('room_id', roomId)
    .eq('user_id', user.id)

  const { data: messages, error } = await supabase
    .from('chat_messages')
    .select('*, sender:users!chat_messages_sender_id_fkey(id, nickname)')
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(200)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages: messages ?? [] })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ roomId: string }> },
) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.content?.trim()) return NextResponse.json({ error: '내용이 필요합니다' }, { status: 400 })

  const { data: member } = await supabase
    .from('chat_room_members')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()
  if (!member) return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })

  const { data: msg, error } = await supabase
    .from('chat_messages')
    .insert({ room_id: roomId, sender_id: user.id, content: body.content.trim() })
    .select('*, sender:users!chat_messages_sender_id_fkey(id, nickname)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message: msg }, { status: 201 })
}