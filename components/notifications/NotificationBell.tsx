'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BellIcon } from '@heroicons/react/24/outline'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification } from '@/lib/types/database'

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
  contest_application: '팀원 신청',
  contest_accepted: '팀원 수락',
  contest_rejected: '팀원 거절',
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
        <BellIcon className="w-6 h-6 text-gray-600" />
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
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:underline"
              >
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
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onRead={markAsRead}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NotificationItem({
  notification: n,
  onRead,
  onClose,
}: {
  notification: Notification
  onRead: (id: string) => void
  onClose: () => void
}) {
  const router = useRouter()

  const formattedDate = new Date(n.created_at).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  function handleClick() {
    if (!n.is_read) onRead(n.id)
    if (n.link) {
      onClose()
      router.push(n.link)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 transition-colors hover:bg-gray-50 ${
        n.is_read ? 'opacity-60' : 'bg-blue-50/40'
      } ${n.link ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start gap-2">
        {!n.is_read && (
          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        )}
        <div className={!n.is_read ? '' : 'ml-4'}>
          <p className="text-xs font-medium text-blue-700 mb-0.5">
            {TYPE_LABEL[n.type] ?? n.type}
          </p>
          <p className="text-sm text-gray-700 leading-snug">{n.content}</p>
          <p className="mt-1 text-xs text-gray-400">{formattedDate}</p>
        </div>
      </div>
    </button>
  )
}