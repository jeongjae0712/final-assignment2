import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ count: 0 }, { status: 401 })

  const admin = createAdminClient()

  const { data: memberships } = await admin
    .from('chat_room_members')
    .select('room_id, last_read_at')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) {
    return NextResponse.json({ count: 0 })
  }

  const counts = await Promise.all(
    memberships.map(async (m) => {
      const { count } = await admin
        .from('chat_messages')
        .select('*', { count: 'exact', head: true })
        .eq('room_id', m.room_id)
        .neq('sender_id', user.id)
        .gt('created_at', m.last_read_at ?? '1970-01-01T00:00:00Z')
      return count ?? 0
    })
  )

  return NextResponse.json({ count: counts.reduce((a, b) => a + b, 0) })
}
