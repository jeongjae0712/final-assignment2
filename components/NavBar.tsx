'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import NotificationBell from '@/components/notifications/NotificationBell'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'

interface ChatMsg { id: string; room_id: string; sender_id: string; created_at: string }

function ChatBadge({ userId, pathname }: { userId: string; pathname: string }) {
  const [count, setCount] = useState(0)
  const supabase = createClient()
  const roomIdsRef = useRef<Set<string>>(new Set())

  const fetchCount = useCallback(async () => {
    const res = await fetch('/api/chat/unread')
    if (res.ok) {
      const d = await res.json()
      setCount(d.count ?? 0)
    }
  }, [])

  // 채팅방 멤버십 로드
  useEffect(() => {
    async function loadRooms() {
      const { data } = await supabase
        .from('chat_room_members')
        .select('room_id')
        .eq('user_id', userId)
      if (data) roomIdsRef.current = new Set(data.map(m => m.room_id))
    }
    loadRooms()
    fetchCount()
  }, [userId, fetchCount, supabase])

  // /chat 방문 시 카운트 리셋
  useEffect(() => {
    if (pathname.startsWith('/chat')) {
      setTimeout(fetchCount, 500)
    }
  }, [pathname, fetchCount])

  // 실시간 새 메시지 구독 → 카운트 증가
  useEffect(() => {
    const channel = supabase
      .channel(`nav-chat-unread:${userId}`)
      .on<ChatMsg>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: RealtimePostgresInsertPayload<ChatMsg>) => {
          const msg = payload.new
          if (msg.sender_id === userId) return
          if (!roomIdsRef.current.has(msg.room_id)) return
          if (pathname.startsWith('/chat')) return
          setCount(prev => prev + 1)
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, pathname, supabase])

  if (count === 0) return null
  return (
    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
      {count > 99 ? '99+' : count}
    </span>
  )
}

export default function NavBar({ userId }: { userId: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  async function handleLogout() {
    setIsLoggingOut(true)
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  const NAV_ITEMS = [
    { href: '/', label: '홈', icon: '🏠' },
    { href: '/contests', label: '공모전', icon: '🏆' },
    { href: '/sports', label: '스포츠', icon: '⚽' },
    { href: '/matches', label: '매칭', icon: '🤝' },
    { href: '/chat', label: '채팅', icon: '💬', badge: true },
    { href: '/profile', label: '프로필', icon: '👤' },
  ]

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-blue-600">CBNU 매칭</Link>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')
                    ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {item.label}
                {item.badge && <ChatBadge userId={userId} pathname={pathname} />}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <NotificationBell userId={userId} />
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="hidden sm:block text-xs font-medium text-gray-500 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50">
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={`relative flex-1 py-2 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
              pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')
                ? 'text-blue-600' : 'text-gray-400'
            }`}>
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
            {item.badge && <ChatBadge userId={userId} pathname={pathname} />}
          </Link>
        ))}
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex-1 py-2 flex flex-col items-center gap-0.5 text-xs font-medium text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50">
          <span className="text-base leading-none">🚪</span>
          로그아웃
        </button>
      </nav>
    </>
  )
}
