import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MatchStatus } from '@/lib/types/database'

// PATCH /api/matches/[id] — 수락 / 거절 / 취소
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body?.action) {
    return NextResponse.json({ error: '액션이 필요합니다' }, { status: 400 })
  }

  const action: 'accept' | 'reject' | 'cancel' = body.action

  // 현재 매칭 조회
  const { data: match, error: fetchError } = await supabase
    .from('matches')
    .select('*')
    .eq('id', id)
    .single()

  if (fetchError || !match) {
    return NextResponse.json({ error: '매칭을 찾을 수 없습니다' }, { status: 404 })
  }

  // 권한 및 상태 검증
  const isRequester = match.requester_id === user.id
  const isReceiver = match.receiver_id === user.id

  if (!isRequester && !isReceiver) {
    return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })
  }
  if (match.status !== 'pending') {
    return NextResponse.json({ error: '이미 처리된 신청입니다' }, { status: 409 })
  }
  if (action === 'cancel' && !isRequester) {
    return NextResponse.json({ error: '신청자만 취소할 수 있습니다' }, { status: 403 })
  }
  if ((action === 'accept' || action === 'reject') && !isReceiver) {
    return NextResponse.json({ error: '수신자만 수락/거절할 수 있습니다' }, { status: 403 })
  }

  const statusMap: Record<string, MatchStatus> = {
    accept: 'accepted',
    reject: 'rejected',
    cancel: 'cancelled',
  }
  const newStatus = statusMap[action]

  // 조건부 UPDATE (동시성 보호: status='pending' 조건 필수)
  const { data: updated, error: updateError } = await supabase
    .from('matches')
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('status', 'pending')
    .select()
    .single()

  if (updateError || !updated) {
    return NextResponse.json({ error: '이미 처리된 신청입니다' }, { status: 409 })
  }

  // 수락 시 상대방 이메일 일회성 반환 (DB 저장 없음)
  if (action === 'accept') {
    const { data: requesterData } = await supabase
      .from('users')
      .select('email')
      .eq('id', match.requester_id)
      .single()

    const reservationUrl = updated.type === 'sports'
      ? process.env.NEXT_PUBLIC_CBU_RESERVATION_URL
      : null

    return NextResponse.json({
      match: updated,
      requester_email: requesterData?.email ?? null,
      reservation_url: reservationUrl,
      message: updated.type === 'sports'
        ? '매칭이 성사되었습니다. 충북대 시설 예약 시스템에서 직접 예약해주세요.'
        : '매칭이 성사되었습니다.',
    })
  }

  return NextResponse.json({ match: updated })
}
