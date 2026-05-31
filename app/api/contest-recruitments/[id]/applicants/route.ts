import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id: recruitmentId } = await params

  const { data: recruitment } = await supabase
    .from('contest_recruitments')
    .select('organizer_id')
    .eq('id', recruitmentId)
    .single()

  if (!recruitment) return NextResponse.json({ error: '모집 공고를 찾을 수 없습니다' }, { status: 404 })
  if (recruitment.organizer_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })

  const { data, error } = await supabase
    .from('contest_applications')
    .select('*, applicant:users!contest_applications_applicant_id_fkey(id, nickname, department)')
    .eq('recruitment_id', recruitmentId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data ?? [] })
}