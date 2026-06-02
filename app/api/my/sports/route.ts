import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  // 내가 만든 스포츠 세션
  const { data: mySessions } = await supabase
    .from('sport_sessions')
    .select('id, sport, title, facility, session_date, start_time, end_time, max_players, description, status, team_chat_id, created_at')
    .eq('organizer_id', user.id)
    .order('session_date', { ascending: false })

  // 내가 신청한 스포츠 세션
  const { data: mySessionApplications } = await supabase
    .from('sport_session_applications')
    .select(`
      id, status, message, created_at, chat_room_id,
      session:sport_sessions(
        id, sport, title, facility, session_date, start_time, end_time, max_players, status, team_chat_id,
        organizer:users!sport_sessions_organizer_id_fkey(id, nickname)
      )
    `)
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false })

  // 파트너 매칭 (matches 테이블, 스포츠 타입)
  const { data: myMatches } = await supabase
    .from('matches')
    .select(`
      id, status, message, created_at, chat_room_id,
      requester:users!matches_requester_id_fkey(id, nickname, avatar_url),
      receiver:users!matches_receiver_id_fkey(id, nickname, avatar_url),
      reservation:sports_reservations(id, facility, reservation_date, start_time, end_time)
    `)
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('type', 'sports')
    .order('created_at', { ascending: false })

  return NextResponse.json({
    mySessions: mySessions ?? [],
    mySessionApplications: mySessionApplications ?? [],
    myMatches: myMatches ?? [],
    currentUserId: user.id,
  })
}
