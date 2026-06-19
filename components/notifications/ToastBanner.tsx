'use client'

import { useEffect, useRef, useMemo, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/lib/types/database'
import type { RealtimePostgresInsertPayload } from '@supabase/supabase-js'

interface Toast {
  id: string
  icon: string
  title: string
  body: string
  link?: string | null
}

const TYPE_LABEL: Record<string, string> = {
  match_request: '매칭 신청',
  match_accepted: '매칭 수락',
  match_rejected: '매칭 거절',
  match_cancelled: '매칭 취소',
  user_withdrawn: '매칭 취소',
  report_flagged: '신고 접수',
  sport_application: '스포츠 신청',
  sport_accepted: '스포츠 수락',
  sport_rejected: '스포츠 거절',
  sport_confirmed: '매치 확정',
  contest_confirmed: '팀 확정',
  contest_application: '팀원 신청',
  contest_accepted: '팀원 수락',
  contest_rejected: '팀원 거절',
}

function getIcon(type: string): string {
  if (type === 'sport_confirmed') return '🎉'
  if (type.startsWith('sport')) return '⚽'
  if (type === 'contest_confirmed') return '🎉'
  if (type.startsWith('contest')) return '🏆'
  if (type === 'match_accepted') return '✅'
  if (type === 'match_rejected') return '❌'
  return '🔔'
}

interface Props {
  userId: string
}

export default function ToastBanner({ userId }: Props) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const router = useRouter()
  // 동일 인스턴스 유지 (매 렌더 재구독 방지)
  const supabase = useMemo(() => createClient(), [])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  const addToast = useCallback((toast: Toast) => {
    setToasts(prev => [...prev.slice(-4), toast])
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id))
      timersRef.current.delete(toast.id)
    }, 4500)
    timersRef.current.set(toast.id, timer)
  }, [])

  const dismiss = useCallback((id: string) => {
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // 알림 구독
  useEffect(() => {
    const channel = supabase
      .channel(`toast-notif:${userId}`)
      .on<Notification>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` },
        (payload: RealtimePostgresInsertPayload<Notification>) => {
          const n = payload.new
          addToast({
            id: `notif-${n.id}`,
            icon: getIcon(n.type),
            title: TYPE_LABEL[n.type] ?? '알림',
            body: n.content,
            link: n.link,
          })
        },
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [userId, supabase, addToast])

  // 채팅 메시지 구독
  useEffect(() => {
    // ref로 관리해 subscription 클로저 안에서 최신값 참조
    const roomIds = new Set<string>()
    const roomNames = new Map<string, string>()
    const nicknameCache = new Map<string, string>()

    // 현재 가입된 방 목록 초기 로드
    supabase
      .from('chat_room_members')
      .select('room_id, room:chat_rooms(name)')
      .eq('user_id', userId)
      .then(({ data }) => {
        if (!data) return
        data.forEach((m: { room_id: string; room: { name: string } | { name: string }[] | null }) => {
          roomIds.add(m.room_id)
          const roomObj = Array.isArray(m.room) ? m.room[0] : m.room
          roomNames.set(m.room_id, roomObj?.name ?? '채팅')
        })
      })

    // 새 채팅방 멤버십 감지 → roomIds에 동적 추가
    const memberChannel = supabase
      .channel(`toast-members:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_room_members',
          filter: `user_id=eq.${userId}`,
        },
        async (payload: RealtimePostgresInsertPayload<{ room_id: string; user_id: string }>) => {
          const newRoomId = payload.new.room_id
          roomIds.add(newRoomId)
          const { data } = await supabase.from('chat_rooms').select('name').eq('id', newRoomId).single()
          roomNames.set(newRoomId, data?.name ?? '채팅')
        },
      )
      .subscribe()

    // 채팅 메시지 수신 → 본인 제외, 내 방의 메시지만 토스트
    const chatChannel = supabase
      .channel(`toast-chat:${userId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        async (payload: RealtimePostgresInsertPayload<{
          id: string; room_id: string; sender_id: string; content: string
        }>) => {
          const msg = payload.new
          if (msg.sender_id === userId) return
          if (!roomIds.has(msg.room_id)) return

          let senderNick = nicknameCache.get(msg.sender_id)
          if (!senderNick) {
            const { data } = await supabase.from('users').select('nickname').eq('id', msg.sender_id).single()
            senderNick = data?.nickname ?? '누군가'
            nicknameCache.set(msg.sender_id, senderNick)
          }

          const preview = msg.content.length > 60 ? msg.content.slice(0, 60) + '…' : msg.content
          addToast({
            id: `chat-${msg.id}`,
            icon: '💬',
            title: roomNames.get(msg.room_id) ?? '새 메시지',
            body: `${senderNick}: ${preview}`,
            link: `/chat/${msg.room_id}`,
          })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(memberChannel)
      supabase.removeChannel(chatChannel)
    }
  }, [userId, supabase, addToast])

  // 언마운트 시 타이머 정리
  useEffect(() => {
    const timers = timersRef.current
    return () => { timers.forEach(t => clearTimeout(t)) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col-reverse gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          role="alert"
          style={{ animation: 'toastSlideIn 0.3s ease-out forwards' }}
          className="pointer-events-auto flex items-start gap-3 bg-white border border-gray-200 rounded-2xl shadow-xl px-4 py-3 w-80"
          onClick={() => {
            if (toast.link) router.push(toast.link)
            dismiss(toast.id)
          }}
        >
          <span className="text-2xl shrink-0 leading-none mt-0.5" aria-hidden="true">
            {toast.icon}
          </span>
          <div className="flex-1 min-w-0" style={{ cursor: toast.link ? 'pointer' : 'default' }}>
            <p className="text-xs font-semibold text-gray-500 mb-0.5">{toast.title}</p>
            <p className="text-sm text-gray-800 leading-snug line-clamp-2">{toast.body}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(toast.id) }}
            className="shrink-0 text-gray-400 hover:text-gray-600 text-xl leading-none mt-0.5"
            aria-label="닫기"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}
