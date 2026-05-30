'use client'

import { useCallback, useEffect, useState } from 'react'
import type { Facility, SportsReservation } from '@/lib/types/database'
import MatchRequestModal from '@/components/matches/MatchRequestModal'

const FACILITY_LABELS: Record<Facility, string> = {
  futsal_a: '풋살장 A',
  futsal_b: '풋살장 B',
  basketball_a: '농구장 A',
  basketball_b: '농구장 B',
  tennis_a: '테니스장 A',
  tennis_b: '테니스장 B',
  tennis_c: '테니스장 C',
  tennis_d: '테니스장 D',
  tennis_e: '테니스장 E',
  small_field: '소운동장',
  main_field: '종합운동장',
}

const FACILITY_GROUPS = [
  { label: '전체', value: '' },
  { label: '풋살', value: 'futsal' },
  { label: '농구', value: 'basketball' },
  { label: '테니스', value: 'tennis' },
  { label: '운동장', value: 'field' },
]

interface ModalState {
  reservation: SportsReservation
}

function getFacilityGroup(facility: Facility): string {
  if (facility.startsWith('futsal')) return 'futsal'
  if (facility.startsWith('basketball')) return 'basketball'
  if (facility.startsWith('tennis')) return 'tennis'
  return 'field'
}

export default function SportsList({ currentUserId }: { currentUserId: string }) {
  const [reservations, setReservations] = useState<SportsReservation[]>([])
  const [group, setGroup] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [modal, setModal] = useState<ModalState | null>(null)

  const fetchReservations = useCallback(async () => {
    setIsLoading(true)
    const res = await fetch('/api/sports?status=available')
    if (res.ok) {
      const json = await res.json()
      setReservations(json.reservations ?? [])
    }
    setIsLoading(false)
  }, [])

  useEffect(() => { fetchReservations() }, [fetchReservations])

  const filtered = group
    ? reservations.filter(r => getFacilityGroup(r.facility) === group)
    : reservations

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {FACILITY_GROUPS.map(g => (
          <button
            key={g.value}
            onClick={() => setGroup(g.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${group === g.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            {g.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : filtered.length === 0 ? (
        <div className="py-16 text-center text-sm text-gray-400">예약 가능한 슬롯이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(r => (
            <div
              key={r.id}
              className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900">{FACILITY_LABELS[r.facility]}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.reservation_date} · {r.start_time} ~ {r.end_time}
                </p>
              </div>
              <button
                onClick={() => setModal({ reservation: r })}
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors"
              >
                파트너 신청
              </button>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <SportsPartnerModal
          reservation={modal.reservation}
          currentUserId={currentUserId}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

function SportsPartnerModal({
  reservation,
  currentUserId,
  onClose,
}: {
  reservation: SportsReservation
  currentUserId: string
  onClose: () => void
}) {
  const [profiles, setProfiles] = useState<Array<{
    user_id: string
    nickname: string
    sports: string[] | null
    career_years: number
    is_pro: boolean
    intro: string | null
  }>>([])
  const [selected, setSelected] = useState<{ id: string; nickname: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const sport = FACILITY_LABELS[reservation.facility].split(' ')[0]

  useEffect(() => {
    async function fetchProfiles() {
      const res = await fetch('/api/sports/partners?facility=' + reservation.facility)
      if (res.ok) {
        const json = await res.json()
        setProfiles(json.profiles ?? [])
      }
      setIsLoading(false)
    }
    fetchProfiles()
  }, [reservation.facility])

  if (selected) {
    return (
      <MatchRequestModal
        receiverId={selected.id}
        receiverNickname={selected.nickname}
        type="sports"
        reservationId={reservation.id}
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
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold text-gray-900">파트너 찾기</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 transition-colors" aria-label="닫기">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">
          {FACILITY_LABELS[reservation.facility]} · {reservation.reservation_date} {reservation.start_time}~{reservation.end_time}
        </p>
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-8">불러오는 중...</p>
        ) : others.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">{sport}에 관심 있는 파트너가 없습니다.</p>
        ) : (
          <ul className="space-y-3 overflow-y-auto flex-1 pr-1">
            {others.map(p => (
              <li key={p.user_id} className="flex items-center justify-between rounded-xl border border-gray-200 p-4 hover:bg-gray-50">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm font-semibold text-gray-900">{p.nickname}</p>
                  <p className="text-xs text-gray-500">
                    경력 {p.career_years}년{p.is_pro ? ' · 프로' : ''}
                  </p>
                  {p.intro && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{p.intro}</p>}
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
