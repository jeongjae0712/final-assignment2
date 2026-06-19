import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SportCategory } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const sport = searchParams.get('sport') as SportCategory | null

  let query = supabase
    .from('sport_sessions')
    .select('*, organizer:users!sport_sessions_organizer_id_fkey(id, nickname)')
    .eq('status', 'open')
    .gte('session_date', new Date().toISOString().split('T')[0])
    .order('session_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(30)

  if (sport) query = query.eq('sport', sport)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const sessionIds = (data ?? []).map(s => s.id)
  let appliedIds = new Set<string>()
  if (sessionIds.length > 0) {
    const { data: apps } = await supabase
      .from('sport_session_applications')
      .select('session_id')
      .eq('applicant_id', user.id)
      .in('session_id', sessionIds)
    appliedIds = new Set((apps ?? []).map((a: { session_id: string }) => a.session_id))
  }

  const sessions = (data ?? []).map(s => ({ ...s, user_applied: appliedIds.has(s.id) }))
  return NextResponse.json({ sessions })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '요청 형식이 올바르지 않습니다' }, { status: 400 })

  const { sport, title, facility, session_date, start_time, end_time, description, max_players } = body as {
    sport: SportCategory
    title?: string
    facility?: string
    session_date: string
    start_time: string
    end_time: string
    description?: string
    max_players?: number
  }

  if (!sport || !session_date || !start_time || !end_time) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
  }

  const admin = createAdminClient()
  await admin.from('users').upsert({
    id: user.id,
    email: user.email!,
    nickname: ((user.user_metadata?.nickname as string | undefined) ?? ('u' + user.id.replace(/-/g, '').slice(0, 9))).slice(0, 10),
    student_id: (user.user_metadata?.student_id as string | undefined) ?? '',
  }, { onConflict: 'id', ignoreDuplicates: true })

  const { data, error } = await supabase
    .from('sport_sessions')
    .insert({
      organizer_id: user.id,
      sport,
      title: title?.trim() ?? null,
      facility: facility ?? null,
      session_date,
      start_time,
      end_time,
      description: description?.trim() ?? null,
      max_players: max_players ?? 2,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data }, { status: 201 })
}