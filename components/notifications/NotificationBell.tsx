'use client'

import { useState, useRef, useEffect } from 'react'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification } from '@/lib/types/database'

const TYPE_LABEL: Record<Notification['type'], string> = {
  match_request:  '매칭 신청',
  match_accepted: '매칭 수락',
  match_rejected: '매칭 거절',
  match_cancelled:'매칭 취소',
  user_withdrawn: '계정 탈퇴',
  report_flagged: '신고 처리',
}

interface Props {
  userId: string
}

export default function NotificationBell({ userId }: Props) {
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useNotifications(userId)
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
        aria-label="알림"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 text-gray-600">
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 rounded-xl border border-gray-200 bg-white shadow-lg z-50">
          <div className="flex items-center justify-between border-b px-4 py-3">
            <span className="font-semibold text-sm text-gray-800">알림</span>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">
                모두 읽음
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {isLoading ? (
              <div className="py-8 text-center text-sm text-gray-400">불러오는 중...</div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-400">알림이 없습니다</div>
            ) : (
              notifications.map(n => (
                <NotificationItem key={n.id} notification={n} onRead={markAsRead} />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({ notification: n, onRead }: { notification: Notification; onRead: (id: string) => void }) {
  const formattedDate = new Date(n.created_at).toLocaleString('ko-KR', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  })
  return (
    <button
      onClick={() => !n.is_read && onRead(n.id)}
      className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${n.is_read ? 'opacity-60' : 'bg-blue-50/40'}`}
    >
      <div className="flex items-start gap-2">
        {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
        <div className={!n.is_read ? '' : 'ml-4'}>
          <p className="text-xs font-medium text-blue-700 mb-0.5">{TYPE_LABEL[n.type]}</p>
          <p className="text-sm text-gray-700 leading-snug">{n.content}</p>
          <p className="mt-1 text-xs text-gray-400">{formattedDate}</p>
        </div>
      </div>
    </button>
  )
}
