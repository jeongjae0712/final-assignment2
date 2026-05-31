import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const metadata = { title: '채팅 | CBNU 매칭' }

export default async function ChatListPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  const { data: memberships } = await admin
    .from('chat_room_members')
    .select('room_id, last_read_at, room:chat_rooms!inner(id, type, name)')
    .eq('user_id', user.id)

  if (!memberships || memberships.length === 0) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">채팅</h1>
        <p className="text-sm text-gray-400 text-center py-16">아직 채팅방이 없습니다.</p>
      </main>
    )
  }

  const rooms = await Promise.all(memberships.map(async m => {
    const room = m.room as unknown as { id: string; type: string; name: string | null }
    const { data: lastMsg } = await admin
      .from('chat_messages')
      .select('content, created_at')
      .eq('room_id', room.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    const { count: unread } = await admin
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('room_id', room.id)
      .gt('created_at', m.last_read_at ?? '1970-01-01')

    let displayName = room.name
    if (room.type === 'dm') {
      const { data: members } = await admin
        .from('chat_room_members')
        .select('user:users!chat_room_members_user_id_fkey(nickname)')
        .eq('room_id', room.id)
        .neq('user_id', user.id)
        .limit(1)
      displayName = (members?.[0]?.user as unknown as { nickname: string } | null)?.nickname ?? 'DM'
    }

    const typeLabelMap: Record<string, string> = {
      dm: '개인',
      sports_team: '스포츠 팀',
      contest_team: '공모전 팀',
    }

    return {
      id: room.id,
      type: room.type,
      typeLabel: typeLabelMap[room.type] ?? '',
      displayName: displayName ?? '채팅방',
      lastContent: (lastMsg as unknown as { content: string } | null)?.content ?? null,
      lastAt: (lastMsg as unknown as { created_at: string } | null)?.created_at ?? null,
      unread: unread ?? 0,
    }
  }))

  rooms.sort((a, b) => (b.lastAt ?? '').localeCompare(a.lastAt ?? ''))

  function formatAt(iso: string | null) {
    if (!iso) return ''
    const d = new Date(iso)
    const now = new Date()
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: true })
    }
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">채팅</h1>
      <div className="space-y-1">
        {rooms.map(room => (
          <Link key={room.id} href={`/chat/${room.id}`}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-gray-50 transition-colors">
            <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">{room.type === 'dm' ? '💬' : room.type === 'sports_team' ? '⚽' : '🏆'}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 truncate">{room.displayName}</p>
                <span className="text-xs text-gray-400 ml-2 flex-shrink-0">{formatAt(room.lastAt)}</span>
              </div>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-gray-500 truncate">{room.lastContent ?? '대화를 시작하세요'}</p>
                {room.unread > 0 && (
                  <span className="ml-2 flex-shrink-0 min-w-[18px] h-[18px] rounded-full bg-blue-600 text-white text-xs flex items-center justify-center px-1">
                    {room.unread > 99 ? '99+' : room.unread}
                  </span>
                )}
              </div>
              <span className="text-xs text-gray-300">{room.typeLabel}</span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}