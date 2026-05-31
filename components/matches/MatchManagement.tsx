'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  open:      { label: '모집 중',  cls: 'bg-blue-100 text-blue-700' },
  closed:    { label: '마감',     cls: 'bg-gray-100 text-gray-600' },
  cancelled: { label: '취소됨',   cls: 'bg-red-100 text-red-600' },
  pending:   { label: '검토 중',  cls: 'bg-yellow-100 text-yellow-700' },
  accepted:  { label: '수락됨',   cls: 'bg-green-100 text-green-700' },
  rejected:  { label: '거절됨',   cls: 'bg-red-100 text-red-600' },
}
function Badge({ status }: { status: string }) {
  const b = STATUS_BADGE[status] ?? { label: status, cls: 'bg-gray-100 text-gray-600' }
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${b.cls}`}>{b.label}</span>
}
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{children}</h3>
}
function EmptyState({ text }: { text: string }) {
  return <p className="py-6 text-center text-sm text-gray-400">{text}</p>
}

function EditRecruitmentModal({
  recruitment, onClose, onSaved,
}: {
  recruitment: { id: string; title: string; description: string | null; max_members: number }
  onClose: () => void; onSaved: () => void
}) {
  const [title, setTitle] = useState(recruitment.title)
  const [description, setDescription] = useState(recruitment.description ?? '')
  const [maxMembers, setMaxMembers] = useState(recruitment.max_members)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const res = await fetch(`/api/contest-recruitments/${recruitment.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description: description || null, max_members: maxMembers }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? '수정에 실패했습니다') }
      else { onSaved(); onClose() }
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">모집 공고 수정</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">제목 *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">최대 팀원 수 *</label>
            <input type="number" min={2} max={10} value={maxMembers} onChange={e => setMaxMembers(Number(e.target.value))} required
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">취소</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? '저장 중...' : '저장'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
function EditSessionModal({
  session, onClose, onSaved,
}: {
  session: { id: string; sport: string; title: string | null; facility: string | null; session_date: string; start_time: string; end_time: string; max_players: number; description: string | null }
  onClose: () => void; onSaved: () => void
}) {
  const SPORTS = ['배드민턴', '테니스', '탁구', '축구', '농구', '야구', '배구', '수영', '헬스', '기타']
  const [sport, setSport] = useState(session.sport)
  const [title, setTitle] = useState(session.title ?? '')
  const [facility, setFacility] = useState(session.facility ?? '')
  const [date, setDate] = useState(session.session_date)
  const [startTime, setStartTime] = useState(session.start_time.slice(0, 5))
  const [endTime, setEndTime] = useState(session.end_time.slice(0, 5))
  const [maxPlayers, setMaxPlayers] = useState(session.max_players)
  const [description, setDescription] = useState(session.description ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError('')
    try {
      const res = await fetch(`/api/sports/sessions/${session.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sport, title: title || null, facility: facility || null, session_date: date, start_time: startTime, end_time: endTime, max_players: maxPlayers, description: description || null }),
      })
      if (!res.ok) { const d = await res.json(); setError(d.error ?? '수정에 실패했습니다') }
      else { onSaved(); onClose() }
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-bold text-gray-900">스포츠 세션 수정</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">종목 *</label>
            <select value={sport} onChange={e => setSport(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">제목</label>
            <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">장소</label>
            <input value={facility} onChange={e => setFacility(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">날짜 *</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">시작 시간 *</label>
              <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">종료 시간 *</label>
              <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">최대 인원 *</label>
            <input type="number" min={2} max={20} value={maxPlayers} onChange={e => setMaxPlayers(Number(e.target.value))} required className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">설명</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">취소</button>
            <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">{saving ? '저장 중...' : '저장'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
type ContestApplicant = {
  id: string; status: string; intro: string; chat_room_id: string | null
  applicant: { id: string; nickname: string; department: string | null } | null
}
type ContestRecruitmentData = {
  id: string; title: string; description: string | null; status: string
  max_members: number; team_chat_id: string | null; created_at: string
  contest: { id: string; title: string; field: string; end_date: string } | null
  applications: Array<{ id: string; status: string }>
}

function ContestRecruitmentCard({ r, onRefresh }: { r: ContestRecruitmentData; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [applicants, setApplicants] = useState<ContestApplicant[] | null>(null)
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function loadApplicants() {
    if (applicants !== null) return
    setLoadingApplicants(true)
    const res = await fetch(`/api/contest-recruitments/${r.id}/applicants`)
    if (res.ok) { const d = await res.json(); setApplicants(d.applications ?? []) }
    setLoadingApplicants(false)
  }

  async function toggleExpand() {
    if (!expanded) await loadApplicants()
    setExpanded(v => !v)
  }

  async function handleAction(appId: string, action: 'accept' | 'reject') {
    setActionLoading(appId)
    await fetch(`/api/contest-recruitments/${r.id}/applicants/${appId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setApplicants(null)
    await loadApplicants()
    setActionLoading(null)
    onRefresh()
  }

  async function handleConfirm() {
    if (!confirm('팀을 확정하시겠습니까? 수락된 모든 신청자와 팀채팅이 생성됩니다.')) return
    setConfirming(true)
    const res = await fetch(`/api/contest-recruitments/${r.id}/confirm`, { method: 'POST' })
    if (!res.ok) { const d = await res.json(); alert(d.error ?? '팀 확정에 실패했습니다') }
    setConfirming(false)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm('이 모집 공고를 삭제하시겠습니까?')) return
    setDeleting(true)
    await fetch(`/api/contest-recruitments/${r.id}`, { method: 'DELETE' })
    onRefresh()
  }

  const accepted = r.applications.filter(a => a.status === 'accepted').length
  const total = r.applications.length
  const canConfirm = !r.team_chat_id && accepted > 0

  return (
    <>
      {editing && <EditRecruitmentModal recruitment={r} onClose={() => setEditing(false)} onSaved={onRefresh} />}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
            {r.contest && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">{r.contest.title} · 마감 {r.contest.end_date}</p>
            )}
          </div>
          <Badge status={r.status} />
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs text-gray-500">
          <span>신청 {total}명 · 수락 {accepted}/{r.max_members - 1}명</span>
          {r.team_chat_id && (
            <Link href={`/chat/${r.team_chat_id}`}
              className="ml-auto flex items-center gap-1 px-3 py-1 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700">
              🎉 팀채팅 입장
            </Link>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={toggleExpand} className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            {expanded ? '접기' : `신청자 보기${total > 0 ? ` (${total})` : ''}`}
          </button>
          {canConfirm && (
            <button onClick={handleConfirm} disabled={confirming}
              className="text-xs px-2.5 py-1 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50">
              {confirming ? '확정 중...' : '✅ 팀 확정'}
            </button>
          )}
          {!r.team_chat_id && (
            <>
              <button onClick={() => setEditing(true)} className="text-xs px-2.5 py-1 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50">수정</button>
              <button onClick={handleDelete} disabled={deleting} className="text-xs px-2.5 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50">{deleting ? '...' : '삭제'}</button>
            </>
          )}
        </div>

        {expanded && (
          <div className="border-t border-gray-100 pt-3 space-y-2">
            {loadingApplicants ? (
              <p className="text-xs text-center text-gray-400 py-2">불러오는 중...</p>
            ) : !applicants || applicants.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-2">신청자가 없습니다</p>
            ) : applicants.map(a => (
              <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800">
                    {a.applicant?.nickname ?? '알 수 없음'}
                    {a.applicant?.department && <span className="ml-1 text-gray-400 font-normal">· {a.applicant.department}</span>}
                  </p>
                  {a.intro && <p className="text-xs text-gray-500 truncate mt-0.5">{a.intro}</p>}
                </div>
                <Badge status={a.status} />
                {a.status === 'pending' && !r.team_chat_id && (
                  <div className="flex gap-1 ml-1">
                    <button onClick={() => handleAction(a.id, 'accept')} disabled={actionLoading === a.id}
                      className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">수락</button>
                    <button onClick={() => handleAction(a.id, 'reject')} disabled={actionLoading === a.id}
                      className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50">거절</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
function ContestTab() {
  const [data, setData] = useState<{
    myRecruitments: ContestRecruitmentData[]
    myApplications: Array<{
      id: string; status: string; created_at: string; chat_room_id: string | null
      recruitment: { id: string; title: string; max_members: number; status: string; organizer: { id: string; nickname: string }; contest: { id: string; title: string; field: string } | null } | null
    }>
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const res = await fetch('/api/my/contest')
    if (res.ok) setData(await res.json())
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  if (isLoading) return <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-500">데이터를 불러올 수 없습니다</div>

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>내가 만든 모집 공고 ({data.myRecruitments.length})</SectionTitle>
        {data.myRecruitments.length === 0 ? (
          <EmptyState text="만든 모집 공고가 없습니다" />
        ) : (
          <div className="space-y-3">
            {data.myRecruitments.map(r => <ContestRecruitmentCard key={r.id} r={r} onRefresh={load} />)}
          </div>
        )}
      </section>
      <section>
        <SectionTitle>내가 신청한 공모전 모집 ({data.myApplications.length})</SectionTitle>
        {data.myApplications.length === 0 ? (
          <EmptyState text="신청한 공모전 모집이 없습니다" />
        ) : (
          <div className="space-y-3">
            {data.myApplications.map(a => (
              <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{a.recruitment?.title ?? '(삭제된 공고)'}</p>
                    {a.recruitment?.contest && <p className="text-xs text-gray-500 mt-0.5 truncate">{a.recruitment.contest.title}</p>}
                    {a.recruitment?.organizer && <p className="text-xs text-gray-400">팀장: {a.recruitment.organizer.nickname}</p>}
                  </div>
                  <Badge status={a.status} />
                </div>
                {a.status === 'accepted' && !a.chat_room_id && (
                  <p className="text-xs text-blue-600 bg-blue-50 rounded-lg px-3 py-1.5">팀장이 팀을 확정하면 팀채팅이 개설됩니다</p>
                )}
                {a.status === 'accepted' && a.chat_room_id && (
                  <Link href={`/chat/${a.chat_room_id}`} className="block w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white text-center hover:bg-green-700 transition-colors">
                    팀채팅 입장
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
type SportApplicant = {
  id: string; status: string; message: string | null; chat_room_id: string | null
  applicant: { id: string; nickname: string; department: string | null } | null
}
type SportSessionData = {
  id: string; sport: string; title: string | null; facility: string | null
  session_date: string; start_time: string; end_time: string
  max_players: number; description: string | null; status: string
  team_chat_id: string | null; created_at: string
}

function SportSessionCard({ s, onRefresh }: { s: SportSessionData; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const [applicants, setApplicants] = useState<SportApplicant[] | null>(null)
  const [loadingApplicants, setLoadingApplicants] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function loadApplicants() {
    if (applicants !== null) return
    setLoadingApplicants(true)
    const res = await fetch(`/api/sports/sessions/${s.id}/applicants`)
    if (res.ok) { const d = await res.json(); setApplicants(d.applications ?? []) }
    setLoadingApplicants(false)
  }

  async function toggleExpand() {
    if (!expanded) await loadApplicants()
    setExpanded(v => !v)
  }

  async function handleAction(appId: string, action: 'accept' | 'reject') {
    setActionLoading(appId)
    await fetch(`/api/sports/sessions/${s.id}/applicants/${appId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    setApplicants(null)
    await loadApplicants()
    setActionLoading(null)
    onRefresh()
  }

  async function handleConfirm() {
    if (!confirm('매치를 확정하시겠습니까? 수락된 모든 신청자와 팀채팅이 생성됩니다.')) return
    setConfirming(true)
    const res = await fetch(`/api/sports/sessions/${s.id}/confirm`, { method: 'POST' })
    if (!res.ok) { const d = await res.json(); alert(d.error ?? '매치 확정에 실패했습니다') }
    setConfirming(false)
    onRefresh()
  }

  async function handleDelete() {
    if (!confirm('이 스포츠 세션을 삭제하시겠습니까?')) return
    setDeleting(true)
    await fetch(`/api/sports/sessions/${s.id}`, { method: 'DELETE' })
    onRefresh()
  }

  function fmt(t: string) {
    const h = parseInt(t.split(':')[0], 10)
    return `${h < 12 ? '오전' : '오후'} ${h === 0 ? 12 : h > 12 ? h - 12 : h}:${t.slice(3, 5)}`
  }
  function fmtDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
  }

  const acceptedCount = applicants ? applicants.filter(a => a.status === 'accepted').length : 0
  const canConfirm = !s.team_chat_id && applicants !== null && acceptedCount > 0

  return (
    <>
      {editing && <EditSessionModal session={s} onClose={() => setEditing(false)} onSaved={onRefresh} />}
      <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s.sport}</span>
              {s.facility && <span className="text-xs text-gray-400">{s.facility}</span>}
            </div>
            {s.title && <p className="text-sm font-semibold text-gray-900">{s.title}</p>}
            <p className="text-xs text-gray-600">{fmtDate(s.session_date)} · {fmt(s.start_time)} ~ {fmt(s.end_time)}</p>
            <p className="text-xs text-gray-400">최대 {s.max_players}명</p>
          </div>
          <Badge status={s.status} />
        </div>

        {s.team_chat_id && (
          <Link href={`/chat/${s.team_chat_id}`} className="flex items-center justify-center gap-1 w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors">
            🎉 팀채팅 입장
          </Link>
        )}

        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={toggleExpand} className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50">
            {expanded ? '접기' : '신청자 보기'}
          </button>
          {canConfirm && (
            <button onClick={handleConfirm} disabled={confirming}
              className="text-xs px-2.5 py-1 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50">
              {confirming ? '확정 중...' : '✅ 매치 확정'}
            </button>
          )}
          {!s.team_chat_id && (
            <>
              <button onClick={() => setEditing(true)} className="text-xs px-2.5 py-1 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50">수정</button>
              <button onClick={handleDelete} disabled={deleting} className="text-xs px-2.5 py-1 rounded-lg border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-50">{deleting ? '...' : '삭제'}</button>
            </>
          )}
        </div>

        {expanded && (
          <div className="border-t border-gray-100 pt-3 space-y-2">
            {loadingApplicants ? (
              <p className="text-xs text-center text-gray-400 py-2">불러오는 중...</p>
            ) : !applicants || applicants.length === 0 ? (
              <p className="text-xs text-center text-gray-400 py-2">신청자가 없습니다</p>
            ) : applicants.map(a => (
              <div key={a.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-800">
                    {a.applicant?.nickname ?? '알 수 없음'}
                    {a.applicant?.department && <span className="ml-1 text-gray-400 font-normal">· {a.applicant.department}</span>}
                  </p>
                  {a.message && <p className="text-xs text-gray-500 truncate mt-0.5 italic">"{a.message}"</p>}
                </div>
                <Badge status={a.status} />
                {a.status === 'pending' && !s.team_chat_id && (
                  <div className="flex gap-1 ml-1">
                    <button onClick={() => handleAction(a.id, 'accept')} disabled={actionLoading === a.id}
                      className="text-xs px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">수락</button>
                    <button onClick={() => handleAction(a.id, 'reject')} disabled={actionLoading === a.id}
                      className="text-xs px-2 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50">거절</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
function SportsTab() {
  const [data, setData] = useState<{
    mySessions: SportSessionData[]
    myMatches: Array<{
      id: string; status: string; message: string | null; created_at: string; chat_room_id: string | null
      requester: { id: string; nickname: string; avatar_url: string | null } | null
      receiver: { id: string; nickname: string; avatar_url: string | null } | null
      reservation: { id: string; facility: string; reservation_date: string; start_time: string; end_time: string } | null
    }>
    currentUserId: string
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const load = useCallback(async () => {
    setIsLoading(true)
    const res = await fetch('/api/my/sports')
    if (res.ok) setData(await res.json())
    setIsLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleMatchAction(matchId: string, action: 'accept' | 'reject' | 'cancel') {
    await fetch(`/api/matches/${matchId}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    load()
  }

  if (isLoading) return <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-500">데이터를 불러올 수 없습니다</div>

  const { mySessions, myMatches, currentUserId } = data

  function formatTime(t: string) {
    const h = parseInt(t.split(':')[0], 10)
    return `${h < 12 ? '오전' : '오후'} ${h === 0 ? 12 : h > 12 ? h - 12 : h}:${t.slice(3, 5)}`
  }
  function formatDate(d: string) {
    return new Date(d + 'T00:00:00').toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
  }

  const pendingReceived = myMatches.filter(m => m.status === 'pending' && m.receiver?.id === currentUserId)
  const pendingSent = myMatches.filter(m => m.status === 'pending' && m.requester?.id === currentUserId)
  const resolved = myMatches.filter(m => m.status !== 'pending')

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle>내가 만든 세션 ({mySessions.length})</SectionTitle>
        {mySessions.length === 0 ? <EmptyState text="만든 스포츠 세션이 없습니다" /> : (
          <div className="space-y-3">
            {mySessions.map(s => <SportSessionCard key={s.id} s={s} onRefresh={load} />)}
          </div>
        )}
      </section>

      {pendingReceived.length > 0 && (
        <section>
          <SectionTitle>받은 파트너 신청 ({pendingReceived.length})</SectionTitle>
          <div className="space-y-3">
            {pendingReceived.map(m => <MatchRow key={m.id} match={m} currentUserId={currentUserId} onAction={handleMatchAction} formatDate={formatDate} formatTime={formatTime} />)}
          </div>
        </section>
      )}
      {pendingSent.length > 0 && (
        <section>
          <SectionTitle>보낸 파트너 신청 ({pendingSent.length})</SectionTitle>
          <div className="space-y-3">
            {pendingSent.map(m => <MatchRow key={m.id} match={m} currentUserId={currentUserId} onAction={handleMatchAction} formatDate={formatDate} formatTime={formatTime} />)}
          </div>
        </section>
      )}
      {resolved.length > 0 && (
        <section>
          <SectionTitle>처리된 파트너 신청 ({resolved.length})</SectionTitle>
          <div className="space-y-3">
            {resolved.map(m => <MatchRow key={m.id} match={m} currentUserId={currentUserId} onAction={handleMatchAction} formatDate={formatDate} formatTime={formatTime} />)}
          </div>
        </section>
      )}
      {myMatches.length === 0 && mySessions.length === 0 && <EmptyState text="스포츠 내역이 없습니다" />}
    </div>
  )
}

function MatchRow({
  match, currentUserId, onAction, formatDate, formatTime,
}: {
  match: {
    id: string; status: string; message: string | null; chat_room_id: string | null
    requester: { id: string; nickname: string; avatar_url: string | null } | null
    receiver: { id: string; nickname: string; avatar_url: string | null } | null
    reservation: { facility: string; reservation_date: string; start_time: string; end_time: string } | null
  }
  currentUserId: string
  onAction: (id: string, action: 'accept' | 'reject' | 'cancel') => void
  formatDate: (d: string) => string; formatTime: (t: string) => string
}) {
  const isReceiver = match.receiver?.id === currentUserId
  const counterpart = isReceiver ? match.requester : match.receiver

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
            {counterpart?.nickname?.[0] ?? '?'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">{counterpart?.nickname ?? '알 수 없음'}</p>
            <p className="text-xs text-gray-400">{isReceiver ? '신청자' : '수신자'}</p>
          </div>
        </div>
        <Badge status={match.status} />
      </div>
      {match.reservation && (
        <p className="text-xs text-gray-500">{match.reservation.facility} · {formatDate(match.reservation.reservation_date)} {formatTime(match.reservation.start_time)}~{formatTime(match.reservation.end_time)}</p>
      )}
      {match.message && <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 italic">"{match.message}"</p>}
      {match.status === 'accepted' && match.chat_room_id && (
        <Link href={`/chat/${match.chat_room_id}`} className="block w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white text-center hover:bg-green-700 transition-colors">팀채팅 입장</Link>
      )}
      {match.status === 'pending' && (
        <div className="flex gap-2">
          {isReceiver ? (
            <>
              <button onClick={() => onAction(match.id, 'accept')} className="flex-1 rounded-lg bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">수락</button>
              <button onClick={() => onAction(match.id, 'reject')} className="flex-1 rounded-lg border border-gray-300 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">거절</button>
            </>
          ) : (
            <button onClick={() => onAction(match.id, 'cancel')} className="flex-1 rounded-lg border border-red-300 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">신청 취소</button>
          )}
        </div>
      )}
    </div>
  )
}

export default function MatchManagement() {
  const [tab, setTab] = useState<'contest' | 'sports'>('contest')
  return (
    <div className="space-y-4">
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
        {([['contest', '🏆 공모전'], ['sports', '⚽ 스포츠']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${tab === v ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'contest' ? <ContestTab /> : <SportsTab />}
    </div>
  )
}