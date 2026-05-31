'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Facility, SportCategory, SportsReservation } from '@/lib/types/database'

/* ───── 상수 ───── */
const FACILITY_LABELS: Record<Facility, string> = {
  futsal_a: '풋살장 A', futsal_b: '풋살장 B',
  basketball_a: '농구장 A', basketball_b: '농구장 B',
  tennis_a: '테니스장 A', tennis_b: '테니스장 B', tennis_c: '테니스장 C',
  tennis_d: '테니스장 D', tennis_e: '테니스장 E',
  small_field: '소운동장', main_field: '종합운동장',
}
const SPORT_GROUPS = [
  { label: '전체', value: '' },
  { label: '풋살', value: 'futsal' },
  { label: '농구', value: 'basketball' },
  { label: '테니스', value: 'tennis' },
  { label: '운동장', value: 'field' },
]
const COURT_OPTIONS: Record<string, { value: Facility; label: string }[]> = {
  futsal:     [{ value: 'futsal_a', label: 'A 코트' }, { value: 'futsal_b', label: 'B 코트' }],
  basketball: [{ value: 'basketball_a', label: 'A 코트' }, { value: 'basketball_b', label: 'B 코트' }],
  tennis:     [
    { value: 'tennis_a', label: 'A 코트' }, { value: 'tennis_b', label: 'B 코트' },
    { value: 'tennis_c', label: 'C 코트' }, { value: 'tennis_d', label: 'D 코트' },
    { value: 'tennis_e', label: 'E 코트' },
  ],
  field: [{ value: 'small_field', label: '소운동장' }, { value: 'main_field', label: '종합운동장' }],
}
const FACILITY_ORDER: Facility[] = [
  'futsal_a','futsal_b','basketball_a','basketball_b',
  'tennis_a','tennis_b','tennis_c','tennis_d','tennis_e','small_field','main_field',
]
const SPORT_OPTS: { value: SportCategory; label: string }[] = [
  { value: '풋살', label: '풋살' },
  { value: '농구', label: '농구' },
  { value: '테니스', label: '테니스' },
  { value: '소운동장', label: '소운동장' },
  { value: '종합운동장', label: '종합운동장' },
]
const CBU_RESERVE_URL = 'https://sports.chungbuk.ac.kr/cbnu_facilities3_2'

/* ───── 유틸 ───── */
function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}
function formatTime(t: string) {
  const [hs, ms] = t.split(':')
  const h = parseInt(hs, 10)
  return `${h < 12 ? '오전' : '오후'} ${h === 0 ? 12 : h > 12 ? h-12 : h}:${ms}`
}
function formatDate(d: string) {
  return new Date(d+'T00:00:00').toLocaleDateString('ko-KR',{month:'short',day:'numeric',weekday:'short'})
}

interface Session {
  id: string; organizer_id: string; sport: SportCategory; title: string | null; facility: string | null
  session_date: string; start_time: string; end_time: string
  description: string | null; max_players: number; status: string; created_at: string
  organizer: { id: string; nickname: string }
}

/* ─────────────────────────────────────────────── */
export default function SportsList({ currentUserId }: { currentUserId: string }) {
  const [tab, setTab] = useState<'sessions'|'reservations'>('sessions')

  return (
    <div>
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-xl">
        {([['sessions','매칭 개설'],['reservations','체육시설 예약 현황']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab===v ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'sessions'
        ? <SessionsTab currentUserId={currentUserId} />
        : <ReservationsTab />}
    </div>
  )
}

/* ─── 매칭 개설 탭 ─── */
function SessionsTab({ currentUserId }: { currentUserId: string }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [sport, setSport] = useState<SportCategory|''>('')
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const router = useRouter()

  const fetch_ = useCallback(async () => {
    setIsLoading(true)
    const p = new URLSearchParams()
    if (sport) p.set('sport', sport)
    const res = await fetch('/api/sports/sessions?' + p)
    if (res.ok) { const j = await res.json(); setSessions(j.sessions ?? []) }
    setIsLoading(false)
  }, [sport])

  useEffect(() => { fetch_() }, [fetch_])

  async function handleContact(organizerId: string) {
    const res = await fetch('/api/chat/rooms', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ partner_id: organizerId }),
    })
    if (res.ok) { const j = await res.json(); router.push(`/chat/${j.roomId}`) }
  }

  async function handleCreateTeamChat(sessionId: string) {
    const res = await fetch(`/api/sports/sessions/${sessionId}/team-chat`, { method: 'POST' })
    if (res.ok) { const j = await res.json(); router.push(`/chat/${j.roomId}`) }
    else { alert('팀채팅 생성에 실패했습니다') }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setSport('')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${sport==='' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
            전체
          </button>
          {SPORT_OPTS.map(o => (
            <button key={o.value} onClick={() => setSport(o.value)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${sport===o.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
              {o.label}
            </button>
          ))}
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex-shrink-0 ml-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          + 개설
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : sessions.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">
          <p>개설된 매칭이 없습니다.</p>
          <p className="mt-1 text-xs text-gray-300">+ 개설 버튼으로 새 매칭을 만들어보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(s => (
            <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s.sport}</span>
                    {s.facility && <span className="text-xs text-gray-500">{s.facility}</span>}
                  </div>
                  {s.title && <p className="text-sm font-bold text-gray-900 mb-0.5">{s.title}</p>}
                  <p className="text-sm font-semibold text-gray-900">
                    {formatDate(s.session_date)} · {formatTime(s.start_time)} ~ {formatTime(s.end_time)}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">최대 {s.max_players}명 · 개설자: {s.organizer.nickname}</p>
                  {s.description && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{s.description}</p>}
                </div>
                {s.organizer_id === currentUserId ? (
                  <button onClick={() => handleCreateTeamChat(s.id)}
                    className="flex-shrink-0 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition-colors">
                    팀채팅
                  </button>
                ) : (
                  <button onClick={() => handleContact(s.organizer_id)}
                    className="flex-shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                    문의하기
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && <CreateSessionModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); fetch_() }} />}
    </div>
  )
}

/* ─── 매칭 개설 모달 ─── */
function CreateSessionModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [sport, setSport] = useState<SportCategory>('풋살')
  const [title, setTitle] = useState('')
  const [facility, setFacility] = useState('')
  const [date, setDate] = useState(todayStr())
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [maxPlayers, setMaxPlayers] = useState(4)
  const [description, setDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    if (startTime >= endTime) { setError('종료 시간이 시작 시간보다 늦어야 합니다'); return }
    setIsLoading(true)
    const res = await fetch('/api/sports/sessions', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport, title: title.trim()||null, facility: facility||null, session_date: date, start_time: startTime, end_time: endTime, description: description||null, max_players: maxPlayers }),
    })
    const j = await res.json()
    if (!res.ok) { setError(j.error ?? '개설에 실패했습니다'); setIsLoading(false); return }
    onCreated()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">스포츠 매칭 개설</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">종목</label>
            <div className="flex flex-wrap gap-2">
              {SPORT_OPTS.map(o => (
                <button key={o.value} type="button" onClick={() => setSport(o.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${sport===o.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">제목 <span className="text-gray-400">(선택)</span></label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 풋살 같이해요 (초보환영)" maxLength={50}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">구장/장소 <span className="text-gray-400">(선택)</span></label>
            <input type="text" value={facility} onChange={e => setFacility(e.target.value)} placeholder="예: 풋살장 A" maxLength={50}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">날짜</label>
            <input type="date" value={date} min={todayStr()} onChange={e => setDate(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">시작 시간</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">종료 시간</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">최대 인원: {maxPlayers}명</label>
            <input type="range" min={2} max={30} value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">설명 <span className="text-gray-400">(선택)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={300} rows={3}
              placeholder="실력 수준, 모집 조건 등을 적어주세요"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={isLoading}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {isLoading ? '개설 중...' : '매칭 개설'}
          </button>
        </form>
      </div>
    </div>
  )
}


/* ─── 매칭 수정 모달 ─── */
function EditSessionModal({ session, onClose, onSaved, onDelete }: {
  session: Session; onClose: () => void; onSaved: () => void; onDelete: () => void
}) {
  const [sport, setSport] = useState<SportCategory>(session.sport)
  const [title, setTitle] = useState(session.title ?? '')
  const [facility, setFacility] = useState(session.facility ?? '')
  const [date, setDate] = useState(session.session_date)
  const [startTime, setStartTime] = useState(session.start_time.slice(0,5))
  const [endTime, setEndTime] = useState(session.end_time.slice(0,5))
  const [maxPlayers, setMaxPlayers] = useState(session.max_players)
  const [description, setDescription] = useState(session.description ?? '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    if (startTime >= endTime) { setError('종료 시간이 시작 시간보다 늦어야 합니다'); return }
    setIsLoading(true)
    const res = await fetch(`/api/sports/sessions/${session.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sport, title: title.trim()||null, facility: facility||null, session_date: date, start_time: startTime, end_time: endTime, description: description||null, max_players: maxPlayers }),
    })
    const j = await res.json()
    if (!res.ok) { setError(j.error ?? '수정에 실패했습니다'); setIsLoading(false); return }
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">매칭 수정</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">종목</label>
            <div className="flex flex-wrap gap-2">
              {SPORT_OPTS.map(o => (
                <button key={o.value} type="button" onClick={() => setSport(o.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${sport===o.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">제목 <span className="text-gray-400">(선택)</span></label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 풋살 같이해요 (초보환영)" maxLength={50}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">구장/장소 <span className="text-gray-400">(선택)</span></label>
            <input type="text" value={facility} onChange={e => setFacility(e.target.value)} placeholder="예: 풋살장 A" maxLength={50}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">날짜</label>
            <input type="date" value={date} min={todayStr()} onChange={e => setDate(e.target.value)} required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">시작 시간</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">종료 시간</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">최대 인원: {maxPlayers}명</label>
            <input type="range" min={2} max={30} value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} className="w-full accent-blue-600" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">설명 <span className="text-gray-400">(선택)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={300} rows={3}
              placeholder="실력 수준, 모집 조건 등을 적어주세요"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={onDelete}
              className="rounded-xl border border-red-300 px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              삭제
            </button>
            <button type="submit" disabled={isLoading}
              className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {isLoading ? '저장 중...' : '수정 저장'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
/* ─── 체육시설 예약 현황 탭 ─── */
function ReservationsTab() {
  const [date, setDate] = useState(todayStr())
  const [sport, setSport] = useState('')
  const [court, setCourt] = useState<Facility|''>('')
  const [reservations, setReservations] = useState<SportsReservation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [searched, setSearched] = useState(false)

  const handleSearch = useCallback(async () => {
    setIsLoading(true); setSearched(true)
    const courtOpts = sport ? (COURT_OPTIONS[sport] ?? []).map(o => o.value) : []
    const targets = court ? [court] : courtOpts
    let all: SportsReservation[] = []
    if (targets.length > 0) {
      const results = await Promise.all(
        targets.map(f => fetch(`/api/sports?date=${date}&facility=${f}&status=all`).then(r => r.ok ? r.json() : { reservations: [] }))
      )
      all = results.flatMap((r: { reservations?: SportsReservation[] }) => r.reservations ?? [])
    } else {
      const res = await fetch(`/api/sports?date=${date}&status=all`)
      if (res.ok) { const j = await res.json(); all = j.reservations ?? [] }
    }
    all.sort((a,b) => {
      const ai = FACILITY_ORDER.indexOf(a.facility), bi = FACILITY_ORDER.indexOf(b.facility)
      return ai !== bi ? ai-bi : a.start_time.localeCompare(b.start_time)
    })
    setReservations(all); setIsLoading(false)
  }, [date, sport, court])

  const grouped: [Facility, SportsReservation[]][] = []
  const seen = new Set<Facility>()
  for (const r of reservations) {
    if (!seen.has(r.facility)) { seen.add(r.facility); grouped.push([r.facility, reservations.filter(x => x.facility===r.facility)]) }
  }
  const courtOptions = sport ? (COURT_OPTIONS[sport] ?? []) : []

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">예약 현황 조회</h3>
          <a href={CBU_RESERVE_URL} target="_blank" rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline">
            예약 사이트 →
          </a>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1.5">날짜</label>
          <input type="date" value={date} min={todayStr()} onChange={e => setDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-2">종목</label>
          <div className="flex flex-wrap gap-2">
            {SPORT_GROUPS.map(g => (
              <button key={g.value} onClick={() => { setSport(g.value); setCourt('') }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${sport===g.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                {g.label}
              </button>
            ))}
          </div>
        </div>
        {courtOptions.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">구장</label>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCourt('')}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${court==='' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                전체
              </button>
              {courtOptions.map(o => (
                <button key={o.value} onClick={() => setCourt(o.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${court===o.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <button onClick={handleSearch} disabled={isLoading}
          className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
          {isLoading ? '조회 중...' : '조회하기'}
        </button>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-sm text-gray-400">불러오는 중...</div>
      ) : !searched ? (
        <div className="py-12 text-center text-sm text-gray-400">날짜와 종목을 선택하고 조회하세요.</div>
      ) : grouped.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-400">해당 조건의 예약 정보가 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([facility, slots]) => {
            const available = slots.filter(s => s.status==='available').length
            return (
              <div key={facility} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-gray-900">{FACILITY_LABELS[facility]}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">가능 <span className="font-semibold text-green-600">{available}</span>/{slots.length}</span>
                    <a href={CBU_RESERVE_URL} target="_blank" rel="noopener noreferrer"
                      className="text-xs font-medium text-blue-600 hover:underline">
                      예약하기 →
                    </a>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {slots.map(slot => (
                    <div key={slot.id} className="flex items-center justify-between px-4 py-2.5">
                      <p className="text-sm text-gray-700 tabular-nums">
                        {formatTime(slot.start_time)} ~ {formatTime(slot.end_time)}
                      </p>
                      {slot.status === 'available' ? (
                        <a href={CBU_RESERVE_URL} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-1 rounded-full hover:bg-green-100 transition-colors">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />예약 가능
                        </a>
                      ) : slot.status === 'reserved' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600 bg-red-50 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" />예약 완료
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />운영 중단
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}