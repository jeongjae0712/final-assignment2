import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; appId: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id: recruitmentId, appId } = await params
  const body = await request.json().catch(() => null)
  const action = body?.action as 'accept' | 'reject'
  if (!action || !['accept', 'reject'].includes(action)) {
    return NextResponse.json({ error: '올바르지 않은 액션입니다' }, { status: 400 })
  }

  const { data: recruitment } = await supabase
    .from('contest_recruitments')
    .select('organizer_id, contest_id, title, max_members, status')
    .eq('id', recruitmentId)
    .single()

  if (!recruitment || recruitment.organizer_id !== user.id) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }

  if (recruitment.status === 'closed') {
    return NextResponse.json({ error: '마감된 모집 공고입니다' }, { status: 409 })
  }

  const { data, error } = await supabase
    .from('contest_applications')
    .update({ status: action === 'accept' ? 'accepted' : 'rejected' })
    .eq('id', appId).eq('recruitment_id', recruitmentId)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (action === 'accept' && data) {
    const admin = createAdminClient()

    // 팀채팅 생성
    const { data: room } = await admin
      .from('chat_rooms')
      .insert({ type: 'contest_team', name: `공모전 팀채팅: ${recruitment.title}`, ref_id: appId })
      .select('id').single()

    if (room) {
      await admin.from('chat_room_members').insert([
        { room_id: room.id, user_id: recruitment.organizer_id },
        { room_id: room.id, user_id: data.applicant_id },
      ])
      await admin.from('contest_applications').update({ chat_room_id: room.id }).eq('id', appId)
      data.chat_room_id = room.id
    }

    // 수락 인원이 max_members에 도달하면 자동 마감
    // organizer(1명) + accepted 지원자 수 >= max_members → 마감
    const { count: acceptedCount } = await supabase
      .from('contest_applications')
      .select('*', { count: 'exact', head: true })
      .eq('recruitment_id', recruitmentId)
      .eq('status', 'accepted')

    if ((acceptedCount ?? 0) >= recruitment.max_members - 1) {
      await supabase
        .from('contest_recruitments')
        .update({ status: 'closed' })
        .eq('id', recruitmentId)
    }
  }

  return NextResponse.json({ application: data })
}