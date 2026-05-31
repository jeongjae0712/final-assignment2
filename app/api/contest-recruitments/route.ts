import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ContestField } from '@/lib/types/database'

// GET /api/contest-recruitments?contest_id=xxx — 특정 공모전의 모집 공고 목록
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const contestId = new URL(request.url).searchParams.get('contest_id')
  if (!contestId) return NextResponse.json({ error: 'contest_id가 필요합니다' }, { status: 400 })

  const { data, error } = await supabase
    .from('contest_recruitments')
    .select('*, organizer:users!contest_recruitments_organizer_id_fkey(id, nickname, department)')
    .eq('contest_id', contestId)
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recruitments: data ?? [] })
}

// POST /api/contest-recruitments — 모집 공고 작성
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '요청 형식이 올바르지 않습니다' }, { status: 400 })

  const { contest_id, title, description, required_fields, max_members } = body as {
    contest_id: string
    title: string
    description?: string
    required_fields?: ContestField[]
    max_members?: number
  }

  if (!contest_id || !title) {
    return NextResponse.json({ error: '필수 항목이 누락되었습니다' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('contest_recruitments')
    .insert({
      organizer_id: user.id,
      contest_id,
      title: title.trim(),
      description: description?.trim() ?? null,
      required_fields: required_fields ?? [],
      max_members: max_members ?? 4,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recruitment: data }, { status: 201 })
}
