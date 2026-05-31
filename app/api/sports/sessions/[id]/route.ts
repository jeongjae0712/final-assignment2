import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '요청 형식이 올바르지 않습니다' }, { status: 400 })

  const { data: existing } = await supabase
    .from('sport_sessions')
    .select('organizer_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: '세션을 찾을 수 없습니다' }, { status: 404 })
  if (existing.organizer_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })

  const allowed = ['title','facility','session_date','start_time','end_time','description','max_players','status'] as const
  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }
  if ('title' in updates && typeof updates.title === 'string') updates.title = (updates.title as string).trim() || null
  if ('description' in updates && typeof updates.description === 'string') updates.description = (updates.description as string).trim() || null

  const { data, error } = await supabase
    .from('sport_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ session: data })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const { id } = await params
  const { error } = await supabase
    .from('sport_sessions')
    .delete()
    .eq('id', id)
    .eq('organizer_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}