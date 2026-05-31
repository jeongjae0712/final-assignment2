'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { MatchWithProfiles } from '@/lib/types/database'

const STATUS_LABEL: Record<string, { label: string; className: string }> = {
  pending:   { label: '대기 중', className: 'bg-yellow-100 text-yellow-800' },
  accepted:  { label: '수락됨', className: 'bg-green-100 text-green-800' },
  rejected:  { label: '거절됨', className: 'bg-red-100 text-red-800' },
  cancelled: { label: '취소됨', className: 'bg-gray-100 text-gray-600' },
}

const TYPE_LABEL: Record<string, string> = {
  contest: '공모전',
  sports:  '스포츠',
}

interface Props {
  match: MatchWithProfiles
  currentUserId: string
  direction: 'sent' | 'received'
  onActionSuccess?: () => void
}

export default function MatchCard({
  match,
  currentUserId,
  direction,
  onActionSuccess,
}: Props) {
  const [isActing, setIsActing] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [acceptedEmail, setAcceptedEmail] = useState<string | null>(null)
  const [reservationUrl, setReservationUrl] = useState<string | null>(null)

  const statusMeta = STATUS_LABEL[match.status] ?? STATUS_LABEL.pending
  const counterpart = direction === 'sent' ? match.receiver : match.requester
  const formattedDate = new Date(match.created_at).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  async function handleAction(action: 'accept' | 'reject' | 'cancel') {
    setIsActing(true)
    setActionError(null)

    try {
      const res = await fetch(`/api/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      const json = await res.json()

      if (!res.ok) {
        setActionError(json.error ?? '처리에 실패했습니다')
        return
      }

      if (action === 'accept') {
        if (json.requester_email) setAcceptedEmail(json.requester_email)
        if (json.reservation_url) setReservationUrl(json.reservation_url)
        if (json.message) alert(json.message)
      }

      onActionSuccess?.()
    } finally {
      setIsActing(false)
    }
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          {counterpart?.avatar_url ? (
            <img
              src={counterpart.avatar_url}
              alt={counterpart.nickname}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
              {counterpart?.nickname?.[0] ?? '?'}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-900">
              {counterpart?.nickname ?? '알 수 없음'}
            </p>
            <p className="text-xs text-gray-400">{formattedDate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
            {TYPE_LABEL[match.type] ?? match.type}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusMeta.className}`}>
            {statusMeta.label}
          </span>
        </div>
      </div>

      {/* Context info */}
      {match.contest && (
        <p className="text-xs text-gray-500">
          공모전: <span className="font-medium text-gray-700">{match.contest.title}</span>
          {match.contest.field && ` · ${match.contest.field}`}
        </p>
      )}
      {match.reservation && (
        <p className="text-xs text-gray-500">
          시설: <span className="font-medium text-gray-700">{match.reservation.facility}</span>{' '}
          {match.reservation.reservation_date} {match.reservation.start_time}–{match.reservation.end_time}
        </p>
      )}

      {/* Optional message */}
      {match.message && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 italic">
          &ldquo;{match.message}&rdquo;
        </p>
      )}

      {/* Post-accept info */}
      {acceptedEmail && (
        <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 space-y-1">
          <p className="text-xs font-medium text-green-800">매칭이 성사되었습니다!</p>
          <p className="text-sm text-green-700">
            신청자 이메일:{' '}
            <a href={`mailto:${acceptedEmail}`} className="font-medium underline">
              {acceptedEmail}
            </a>
          </p>
          {reservationUrl && (
            <a
              href={reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-blue-600 underline mt-1"
            >
              충북대 시설 예약 시스템 바로가기
            </a>
          )}
        </div>
      )}

      {/* Action error */}
      {actionError && (
        <p className="text-xs text-red-600">{actionError}</p>
      )}

      {/* Action buttons */}
      {match.status === 'accepted' && (
        <div className="flex gap-2 pt-1">
          <Link
            href={`/chat/${(match as unknown as { chat_room_id?: string }).chat_room_id ?? match.id}`}
            className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white text-center hover:bg-green-700 transition-colors"
          >
            채팅하기
          </Link>
        </div>
      )}

      {match.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          {direction === 'received' && (
            <>
              <button
                onClick={() => handleAction('accept')}
                disabled={isActing}
                className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                수락
              </button>
              <button
                onClick={() => handleAction('reject')}
                disabled={isActing}
                className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                거절
              </button>
            </>
          )}
          {direction === 'sent' && (
            <button
              onClick={() => handleAction('cancel')}
              disabled={isActing}
              className="flex-1 rounded-lg border border-red-300 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50 transition-colors"
            >
              취소
            </button>
          )}
        </div>
      )}
    </div>
  )
}
