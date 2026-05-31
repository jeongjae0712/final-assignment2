import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const matchId = new URL(request.url).searchParams.get('match_id')
  if (!matchId) return NextResponse.json({ error: 'match_id가 필요합니다' }, { status: 400 })

  // 해당 매칭의 참여자인지 확인
  const { data: match } = await supabase
    .from('matches')
    .select('id, status, requester_id, receiver_id')
    .eq('id', matchId)
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .single()

  if (!match) return NextResponse.json({ error: '접근 권한이 없습니다' }, { status: 403 })
  if (match.status !== 'accepted') return NextResponse.json({ error: '수락된 매칭에서만 채팅이 가능합니다' }, { status: 403 })

  const { data: messages, error } = await supabase
    .from('messages')
    .select('*, sender:users!messages_sender_id_fkey(id, nickname)')
    .eq('match_id', matchId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ messages })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body?.match_id || !body?.content?.trim()) {
    return NextResponse.json({ error: '내용을 입력해주세요' }, { status: 400 })
  }

  const { data: message, error } = await supabase
    .from('messages')
    .insert({ match_id: body.match_id, sender_id: user.id, content: body.content.trim() })
    .select('*, sender:users!messages_sender_id_fkey(id, nickname)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ message }, { status: 201 })
}
