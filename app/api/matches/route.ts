import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { MatchType } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const direction = searchParams.get('direction') ?? 'received'
  const after = searchParams.get('after')
  const column = direction === 'sent' ? 'requester_id' : 'receiver_id'

  let query = supabase
    .from('matches')
    .select(`
      *,
      requester:users!matches_requester_id_fkey(id, nickname, avatar_url),
      receiver:users!matches_receiver_id_fkey(id, nickname, avatar_url),
      contest:contests(id, title, field),
      reservation:sports_reservations(id, facility, reservation_date, start_time, end_time)
    `)
    .eq(column, user.id)
    .order('created_at', { ascending: false })

  if (after) query = query.gt('created_at', after)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ matches: data })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '요청 형식이 올바르지 않습니다' }, { status: 400 })

  const { receiver_id, type, contest_id, reservation_id, message } = body as {
    receiver_id: string; type: MatchType
    contest_id?: string; reservation_id?: string; message?: string
  }

  if (!receiver_id || !type) return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
  if (receiver_id === user.id) return NextResponse.json({ error: '자기 자신에게는 신청할 수 없습니다' }, { status: 400 })
  if (type === 'contest' && !contest_id) return NextResponse.json({ error: '공모전 정보가 필요합니다' }, { status: 400 })
  if (type === 'sports' && !reservation_id) return NextResponse.json({ error: '예약 슬롯 정보가 필요합니다' }, { status: 400 })
  if (message && message.length > 200) return NextResponse.json({ error: '신청 메시지는 200자 이내여야 합니다' }, { status: 400 })

  const { data: receiver } = await supabase.from('users').select('id, is_active').eq('id', receiver_id).single()
  if (!receiver || !receiver.is_active) return NextResponse.json({ error: '존재하지 않는 사용자입니다' }, { status: 404 })

  const profileTable = type === 'contest' ? 'contest_profiles' : 'sports_profiles'
  const { data: myProfile } = await supabase.from(profileTable).select('id').eq('user_id', user.id).single()
  if (!myProfile) return NextResponse.json({ error: '프로필을 먼저 등록해주세요' }, { status: 400 })

  if (type === 'contest') {
    const { data: contest } = await supabase.from('contests').select('id, is_active').eq('id', contest_id).single()
    if (!contest || !contest.is_active) return NextResponse.json({ error: '마감된 공모전입니다' }, { status: 400 })
  }

  // 상호 매칭 신청 처리
  const { data: existingReverse } = await supabase
    .from('matches').select('id, status')
    .eq('requester_id', receiver_id).eq('receiver_id', user.id)
    .eq('type', type).eq('status', 'pending').maybeSingle()

  if (existingReverse) {
    const { data: accepted, error: acceptError } = await supabase
      .from('matches').update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', existingReverse.id).eq('status', 'pending').select().single()

    if (acceptError || !accepted) return NextResponse.json({ error: '이미 처리된 신청입니다' }, { status: 409 })

    // 상호 매칭 수락 알림
    const admin = createAdminClient()
    const { data: myUser } = await supabase.from('users').select('nickname').eq('id', user.id).single()
    const typeLabel = type === 'sports' ? '스포츠' : '공모전'
    await admin.from('notifications').insert([
      {
        user_id: receiver_id,
        type: 'match_accepted',
        content: `${myUser?.nickname ?? '누군가'}님과 ${typeLabel} 매칭이 성사되었습니다!`,
        link: '/matches',
      },
      {
        user_id: user.id,
        type: 'match_accepted',
        content: `${typeLabel} 매칭이 성사되었습니다!`,
        link: '/matches',
      },
    ])

    return NextResponse.json({ match: accepted, message: '상대방이 먼저 신청을 보낸 상태였습니다. 매칭이 자동으로 성사되었습니다.', mutual: true }, { status: 200 })
  }

  // 신규 매칭 INSERT
  const { data: newMatch, error: insertError } = await supabase
    .from('matches')
    .insert({
      type, requester_id: user.id, receiver_id,
      contest_id: type === 'contest' ? contest_id : null,
      reservation_id: type === 'sports' ? reservation_id : null,
      message: message ?? null, status: 'pending',
    })
    .select().single()

  if (insertError) {
    if (insertError.code === '23505') return NextResponse.json({ error: '이미 신청한 상대입니다' }, { status: 409 })
    if (insertError.code === '23514') return NextResponse.json({ error: '자기 자신에게는 신청할 수 없습니다' }, { status: 400 })
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  // 수신자에게 매칭 신청 알림
  const admin = createAdminClient()
  const { data: myUser } = await supabase.from('users').select('nickname').eq('id', user.id).single()
  const typeLabel = type === 'sports' ? '스포츠' : '공모전'
  await admin.from('notifications').insert({
    user_id: receiver_id,
    type: 'match_request',
    content: `${myUser?.nickname ?? '누군가'}님이 ${typeLabel} 파트너 신청을 보냈습니다.`,
    link: '/matches',
  })

  return NextResponse.json({ match: newMatch }, { status: 201 })
}