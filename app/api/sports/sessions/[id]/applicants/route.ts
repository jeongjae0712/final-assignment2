import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: sessionId } = await params
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { data: session } = await supabase
    .from('sport_sessions')
    .select('organizer_id')
    .eq('id', sessionId)
    .single()

  if (!session) return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 })
  if (session.organizer_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })

  const { data, error } = await supabase
    .from('sport_session_applications')
    .select('*, applicant:users!sport_session_applications_applicant_id_fkey(id, nickname, department)')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ applications: data ?? [] })
}