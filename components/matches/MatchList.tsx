'use client'

import { useState, useEffect, useCallback } from 'react'
import MatchCard from './MatchCard'
import type { MatchWithProfiles } from '@/lib/types/database'

type Direction = 'received' | 'sent'

interface Props {
  currentUserId: string
}

export default function MatchList({ currentUserId }: Props) {
  const [direction, setDirection] = useState<Direction>('received')
  const [matches, setMatches] = useState<MatchWithProfiles[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/matches?direction=${direction}`)
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? '불러오기 실패')
      setMatches(json.matches ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '오류가 발생했습니다')
    } finally {
      setIsLoading(false)
    }
  }, [direction])

  useEffect(() => {
    fetchMatches()
  }, [fetchMatches])

  const pending = matches.filter(m => m.status === 'pending')
  const others  = matches.filter(m => m.status !== 'pending')

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex rounded-xl bg-gray-100 p-1">
        {(['received', 'sent'] as Direction[]).map(d => (
          <button
            key={d}
            onClick={() => setDirection(d)}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              direction === d
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {d === 'received' ? '받은 신청' : '보낸 신청'}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : error ? (
        <div className="py-8 text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button
            onClick={fetchMatches}
            className="text-sm text-blue-600 hover:underline"
          >
            다시 시도
          </button>
        </div>
      ) : matches.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          {direction === 'received' ? '받은 신청이 없습니다' : '보낸 신청이 없습니다'}
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                대기 중 ({pending.length})
              </h3>
              <div className="space-y-3">
                {pending.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    currentUserId={currentUserId}
                    direction={direction}
                    onActionSuccess={fetchMatches}
                  />
                ))}
              </div>
            </section>
          )}
          {others.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                처리된 신청 ({others.length})
              </h3>
              <div className="space-y-3">
                {others.map(m => (
                  <MatchCard
                    key={m.id}
                    match={m}
                    currentUserId={currentUserId}
                    direction={direction}
                    onActionSuccess={fetchMatches}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
