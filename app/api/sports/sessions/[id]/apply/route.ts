import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const message: string | undefined = body?.message

  const { data: session } = await supabase
    .from('sport_sessions')
    .select('organizer_id, sport, session_date, status, max_players')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 })
  if (session.status !== 'open') return NextResponse.json({ error: '마감된 세션입니다' }, { status: 400 })
  if (session.organizer_id === user.id) return NextResponse.json({ error: '본인이 개설한 세션에는 신청할 수 없습니다' }, { status: 400 })

  const { data, error } = await supabase
    .from('sport_session_applications')
    .insert({
      session_id: sessionId,
      applicant_id: user.id,
      message: message?.trim() ?? null,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: '이미 신청하였습니다' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // 개설자에게 알림 (admin 클라이언트로 RLS 우회)
  const admin = createAdminClient()
  const { data: applicant } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single()

  await admin.from('notifications').insert({
    user_id: session.organizer_id,
    type: 'sport_application',
    content: `${applicant?.nickname ?? '누군가'}님이 스포츠 세션(${session.sport})에 신청했습니다.`,
    link: '/matches',
  })

  return NextResponse.json({ application: data }, { status: 201 })
}
