'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Contest, ContestField } from '@/lib/types/database'
import MatchRequestModal from '@/components/matches/MatchRequestModal'

const FIELD_LABELS: Record<ContestField, string> = {
  marketing: '마케팅/아이디어',
  video: '영상/UCC/사진',
  design: '디자인',
  literature: '문학/글',
  it: 'IT/소프트웨어',
  arts: '예체능/음악/미술',
  academic: '학술/창업/논술',
}

interface ModalState {
  contestId: string
}

export default function ContestList({ currentUserId }: { currentUserId: string }) {
  const [contests, setContests] = useState<Contest[]>([])
  const [field, setField] = useState<ContestField | ''>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [modal, setModal] = useState<ModalState | null>(null)

  const fetchContests = useCallback(async () => {
    setIsLoading(true)
    const params = new URLSearchParams({ page: String(page) })
    if (field) params.set('field', field)
    const res = await fetch('/api/contests?' + params)
    if (res.ok) {
      const json = await res.json()
      setContests(json.contests ?? [])
      setTotal(json.total ?? 0)
    }
    setIsLoading(false)
  }, [field, page])

  useEffect(() => { fetchContests() }, [fetchContests])

  const totalPages = Math.ceil(total / 12)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => { setField(''); setPage(1) }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${field === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          전체
        </button>
        {(Object.entries(FIELD_LABELS) as [ContestField, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => { setField(key); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${field === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : contests.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">현재 모집 중인 공모전이 없습니다.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {contests.map(contest => (
            <div key={contest.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3">
              <div className="flex-1">
                <span className="inline-block text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-2 py-0.5 mb-1">
                  {FIELD_LABELS[contest.field]}
                </span>
                <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{contest.title}</h3>
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                  {contest.organizer && <p>주최: {contest.organizer}</p>}
                  <p>마감: {contest.end_date}</p>
                  {contest.prize && <p>시상: {contest.prize}</p>}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <a
                  href={contest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 text-center rounded-lg border border-gray-300 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  공모전 보기
                </a>
                <button
                  onClick={() => setModal({ contestId: contest.id })}
                  className="flex-1 rounded-lg bg-blue-600 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  팀원 찾기
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {modal && (
        <TeamFinderModal
          contestId={modal.contestId}
          currentUserId={currentUserId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function TeamFinderModal({
  contestId,
  currentUserId,
  onClose,
}: {
  contestId: string
  currentUserId: string
  onClose: () => void
}) {
  const [profiles, setProfiles] = useState<Array<{
    user_id: string
    nickname: string
    department: string
    fields: ContestField[] | null
    intro: string | null
  }>>([])
  const [selected, setSelected] = useState<{ id: string; nickname: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchProfiles() {
      const res = await fetch('/api/contests/' + contestId + '/applicants')
      if (res.ok) {
        const json = await res.json()
        setProfiles(json.profiles ?? [])
      }
      setIsLoading(false)
    }
    fetchProfiles()
  }, [contestId])

  if (selected) {
    return (
      <MatchRequestModal
        receiverId={selected.id}
        receiverNickname={selected.nickname}
        type="contest"
        contestId={contestId}
        onClose={() => setSelected(null)}
        onSuccess={onClose}
      />
    )
  }

  const others = profiles.filter(p => p.user_id !== currentUserId)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">팀원 찾기</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors" aria-label="닫기">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-8">불러오는 중...</p>
        ) : others.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">이 분야에 관심 있는 사용자가 없습니다.</p>
        ) : (
          <ul className="space-y-3 overflow-y-auto flex-1 pr-1">
            {others.map(p => (
              <li key={p.user_id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-semibold text-gray-900">{p.nickname}</p>
                  <p className="text-xs text-gray-500">{p.department}</p>
                  {p.intro && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.intro}</p>}
                  {p.fields && p.fields.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.fields.map(f => (
                        <span key={f} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">{FIELD_LABELS[f]}</span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setSelected({ id: p.user_id, nickname: p.nickname })}
                  className="flex-shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
                >
                  신청
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
