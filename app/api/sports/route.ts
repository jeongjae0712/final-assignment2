import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { Facility } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const facility = searchParams.get('facility') as Facility | null
  const date = searchParams.get('date') // YYYY-MM-DD
  const status = searchParams.get('status') ?? 'available'

  let query = supabase
    .from('sports_reservations')
    .select('*')
    .order('reservation_date', { ascending: true })
    .order('start_time', { ascending: true })
    .limit(50)

  if (facility) query = query.eq('facility', facility)
  if (date) query = query.eq('reservation_date', date)
  if (status !== 'all') query = query.eq('status', status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ reservations: data })
}
