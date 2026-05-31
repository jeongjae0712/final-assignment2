import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  // 내가 만든 모집 공고 + 신청자 수
  const { data: myRecruitments } = await supabase
    .from('contest_recruitments')
    .select(`
      id, title, description, status, max_members, team_chat_id, created_at, contest_id,
      contest:contests(id, title, field, end_date),
      applications:contest_applications(id, status)
    `)
    .eq('organizer_id', user.id)
    .order('created_at', { ascending: false })

  // 내가 신청한 공모전 모집
  const { data: myApplications } = await supabase
    .from('contest_applications')
    .select(`
      id, status, created_at, chat_room_id,
      recruitment:contest_recruitments(
        id, title, max_members, status,
        organizer:users!contest_recruitments_organizer_id_fkey(id, nickname),
        contest:contests(id, title, field)
      )
    `)
    .eq('applicant_id', user.id)
    .order('created_at', { ascending: false })

  return NextResponse.json({
    myRecruitments: myRecruitments ?? [],
    myApplications: myApplications ?? [],
  })
}