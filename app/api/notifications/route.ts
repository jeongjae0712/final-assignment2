import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/notifications — 알림 목록 (미수신 보충 포함)
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const after = searchParams.get('after') // Realtime 재연결 후 미수신 알림 조회용

  let query = supabase
    .from('notifications')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  if (after) {
    query = query.gt('created_at', after)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const unreadCount = (data ?? []).filter(n => !n.is_read).length

  return NextResponse.json({ notifications: data, unread_count: unreadCount })
}

// PATCH /api/notifications — 읽음 처리 (단건 또는 전체)
export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({}))
  const { id, all } = body as { id?: string; all?: boolean }

  if (all) {
    // 전체 읽음 처리
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: '전체 읽음 처리 완료' })
  }

  if (id) {
    // 단건 읽음 처리
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ message: '읽음 처리 완료' })
  }

  return NextResponse.json({ error: 'id 또는 all이 필요합니다' }, { status: 400 })
}
