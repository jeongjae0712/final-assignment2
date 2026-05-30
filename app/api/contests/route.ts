import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ContestField } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const field = searchParams.get('field') as ContestField | null
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = 12
  const offset = (page - 1) * limit

  let query = supabase
    .from('contests')
    .select('*', { count: 'exact' })
    .eq('is_active', true)
    .order('end_date', { ascending: true })
    .range(offset, offset + limit - 1)

  if (field) query = query.eq('field', field)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contests: data, total: count ?? 0, page, limit })
}
