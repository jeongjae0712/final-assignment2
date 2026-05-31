import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import ChatRoom from '@/components/chat/ChatRoom'

export default async function ChatRoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const admin = createAdminClient()

  const { data: room } = await admin
    .from('chat_rooms')
    .select('id, type, name')
    .eq('id', roomId)
    .single()
  if (!room) notFound()

  const { data: member } = await admin
    .from('chat_room_members')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('user_id', user.id)
    .single()
  if (!member) redirect('/chat')

  let displayName = room.name ?? '채팅방'
  if (room.type === 'dm') {
    const { data: members } = await admin
      .from('chat_room_members')
      .select('user:users!chat_room_members_user_id_fkey(nickname)')
      .eq('room_id', roomId)
      .neq('user_id', user.id)
      .limit(1)
    displayName = (members?.[0]?.user as unknown as { nickname: string } | null)?.nickname ?? '상대방'
  }

  return (
    <div className="max-w-2xl mx-auto h-[calc(100vh-56px)] flex flex-col">
      <ChatRoom
        roomId={roomId}
        currentUserId={user.id}
        roomName={displayName}
        roomType={room.type}
      />
    </div>
  )
}