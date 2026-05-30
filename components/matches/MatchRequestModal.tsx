'use client'

import { useState } from 'react'
import type { MatchType } from '@/lib/types/database'

interface Props {
  receiverId: string
  receiverNickname: string
  type: MatchType
  contestId?: string
  reservationId?: string
  onClose: () => void
  onSuccess?: () => void
}

export default function MatchRequestModal({
  receiverId,
  receiverNickname,
  type,
  contestId,
  reservationId,
  onClose,
  onSuccess,
}: Props) {
  const [message, setMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const typeLabel = type === 'contest' ? '공모전 팀원' : '스포츠 파트너'

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (message.length > 200) {
      setError('신청 메시지는 200자 이내여야 합니다')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/matches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          receiver_id: receiverId,
          type,
          contest_id: contestId,
          reservation_id: reservationId,
          message: message.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? '신청에 실패했습니다'); return }
      if (json.mutual) alert(json.message)
      else alert(`${receiverNickname}님께 ${typeLabel} 신청을 보냈습니다.`)
      onSuccess?.()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{typeLabel} 신청</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors" aria-label="닫기">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          <span className="font-medium text-gray-900">{receiverNickname}</span>님께 {typeLabel} 신청을 보냅니다.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              신청 메시지 <span className="text-gray-400 font-normal">(선택, 최대 200자)</span>
            </label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              maxLength={200}
              rows={4}
              placeholder="간단한 자기소개나 신청 이유를 작성해 주세요."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{message.length}/200</p>
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">취소</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isSubmitting ? '신청 중...' : '신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
