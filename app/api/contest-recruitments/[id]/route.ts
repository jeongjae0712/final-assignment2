import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ContestField } from '@/lib/types/database'

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
    .from('contest_recruitments')
    .select('organizer_id')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: '모집 공고를 찾을 수 없습니다' }, { status: 404 })
  if (existing.organizer_id !== user.id) return NextResponse.json({ error: '권한이 없습니다' }, { status: 403 })

  const updates: Record<string, unknown> = {}
  if ('title' in body) updates.title = (body.title as string)?.trim()
  if ('description' in body) updates.description = (body.description as string)?.trim() || null
  if ('required_fields' in body) updates.required_fields = body.required_fields as ContestField[]
  if ('max_members' in body) updates.max_members = body.max_members as number
  if ('status' in body) updates.status = body.status as string

  const { data, error } = await supabase
    .from('contest_recruitments')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ recruitment: data })
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
    .from('contest_recruitments')
    .delete()
    .eq('id', id)
    .eq('organizer_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}