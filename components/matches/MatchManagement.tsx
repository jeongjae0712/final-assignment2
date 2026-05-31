'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

/* ── 상태 배지 ── */
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

/* ── 공모전 탭 ── */
function ContestTab() {
  const [data, setData] = useState<{
    myRecruitments: Array<{
      id: string; title: string; status: string; max_members: number; created_at: string
      contest: { id: string; title: string; field: string; end_date: string } | null
      applications: Array<{ id: string; status: string }>
    }>
    myApplications: Array<{
      id: string; status: string; created_at: string; chat_room_id: string | null
      recruitment: {
        id: string; title: string; max_members: number; status: string
        organizer: { id: string; nickname: string }
        contest: { id: string; title: string; field: string } | null
      } | null
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

  const { myRecruitments, myApplications } = data

  return (
    <div className="space-y-8">
      {/* 내가 만든 모집 공고 */}
      <section>
        <SectionTitle>내가 만든 모집 공고 ({myRecruitments.length})</SectionTitle>
        {myRecruitments.length === 0 ? (
          <EmptyState text="만든 모집 공고가 없습니다" />
        ) : (
          <div className="space-y-3">
            {myRecruitments.map(r => {
              const accepted = r.applications.filter(a => a.status === 'accepted').length
              const total = r.applications.length
              return (
                <div key={r.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{r.title}</p>
                      {r.contest && (
                        <p className="text-xs text-gray-500 mt-0.5 truncate">
                          {r.contest.title} · 마감 {r.contest.end_date}
                        </p>
                      )}
                    </div>
                    <Badge status={r.status} />
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                      신청자 {total}명 · 수락 {accepted}명 / 최대 {r.max_members - 1}명
                    </p>
                    {r.contest && (
                      <Link
                        href={`/contests?highlight=${r.contest.id}`}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        공모전 보기 →
                      </Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* 내가 신청한 공모전 모집 */}
      <section>
        <SectionTitle>내가 신청한 공모전 모집 ({myApplications.length})</SectionTitle>
        {myApplications.length === 0 ? (
          <EmptyState text="신청한 공모전 모집이 없습니다" />
        ) : (
          <div className="space-y-3">
            {myApplications.map(a => (
              <div key={a.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {a.recruitment?.title ?? '(삭제된 공고)'}
                    </p>
                    {a.recruitment?.contest && (
                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                        {a.recruitment.contest.title}
                      </p>
                    )}
                    {a.recruitment?.organizer && (
                      <p className="text-xs text-gray-400">
                        팀장: {a.recruitment.organizer.nickname}
                      </p>
                    )}
                  </div>
                  <Badge status={a.status} />
                </div>
                {a.status === 'accepted' && a.chat_room_id && (
                  <Link
                    href={`/chat/${a.chat_room_id}`}
                    className="block w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white text-center hover:bg-green-700 transition-colors"
                  >
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

/* ── 스포츠 탭 ── */
function SportsTab() {
  const [data, setData] = useState<{
    mySessions: Array<{
      id: string; sport: string; title: string | null; facility: string | null
      session_date: string; start_time: string; end_time: string
      max_players: number; status: string; created_at: string
    }>
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
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    load()
  }

  if (isLoading) return <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
  if (!data) return <div className="py-8 text-center text-sm text-red-500">데이터를 불러올 수 없습니다</div>

  const { mySessions, myMatches, currentUserId } = data

  function formatTime(t: string) {
    const [hs] = t.split(':')
    const h = parseInt(hs, 10)
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
      {/* 내가 만든 매칭 */}
      <section>
        <SectionTitle>내가 만든 매칭 ({mySessions.length})</SectionTitle>
        {mySessions.length === 0 ? (
          <EmptyState text="만든 매칭이 없습니다" />
        ) : (
          <div className="space-y-3">
            {mySessions.map(s => (
              <div key={s.id} className="rounded-xl border border-gray-200 bg-white p-4 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s.sport}</span>
                      {s.facility && <span className="text-xs text-gray-400">{s.facility}</span>}
                    </div>
                    {s.title && <p className="text-sm font-semibold text-gray-900">{s.title}</p>}
                    <p className="text-xs text-gray-600">
                      {formatDate(s.session_date)} · {formatTime(s.start_time)} ~ {formatTime(s.end_time)}
                    </p>
                    <p className="text-xs text-gray-400">최대 {s.max_players}명</p>
                  </div>
                  <Badge status={s.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 받은 파트너 신청 */}
      {pendingReceived.length > 0 && (
        <section>
          <SectionTitle>받은 파트너 신청 ({pendingReceived.length})</SectionTitle>
          <div className="space-y-3">
            {pendingReceived.map(m => (
              <MatchRow key={m.id} match={m} currentUserId={currentUserId} onAction={handleMatchAction} formatDate={formatDate} formatTime={formatTime} />
            ))}
          </div>
        </section>
      )}

      {/* 보낸 파트너 신청 */}
      {pendingSent.length > 0 && (
        <section>
          <SectionTitle>보낸 파트너 신청 ({pendingSent.length})</SectionTitle>
          <div className="space-y-3">
            {pendingSent.map(m => (
              <MatchRow key={m.id} match={m} currentUserId={currentUserId} onAction={handleMatchAction} formatDate={formatDate} formatTime={formatTime} />
            ))}
          </div>
        </section>
      )}

      {/* 처리된 파트너 신청 */}
      {resolved.length > 0 && (
        <section>
          <SectionTitle>처리된 파트너 신청 ({resolved.length})</SectionTitle>
          <div className="space-y-3">
            {resolved.map(m => (
              <MatchRow key={m.id} match={m} currentUserId={currentUserId} onAction={handleMatchAction} formatDate={formatDate} formatTime={formatTime} />
            ))}
          </div>
        </section>
      )}

      {myMatches.length === 0 && (
        <EmptyState text="파트너 신청 내역이 없습니다" />
      )}
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
  formatDate: (d: string) => string
  formatTime: (t: string) => string
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
        <p className="text-xs text-gray-500">
          {match.reservation.facility} · {formatDate(match.reservation.reservation_date)}{' '}
          {formatTime(match.reservation.start_time)}~{formatTime(match.reservation.end_time)}
        </p>
      )}
      {match.message && (
        <p className="text-xs text-gray-500 bg-gray-50 rounded px-2 py-1 italic">"{match.message}"</p>
      )}
      {match.status === 'accepted' && match.chat_room_id && (
        <Link href={`/chat/${match.chat_room_id}`}
          className="block w-full rounded-lg bg-green-600 py-2 text-sm font-medium text-white text-center hover:bg-green-700 transition-colors">
          팀채팅 입장
        </Link>
      )}
      {match.status === 'pending' && (
        <div className="flex gap-2">
          {isReceiver ? (
            <>
              <button onClick={() => onAction(match.id, 'accept')}
                className="flex-1 rounded-lg bg-blue-600 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors">
                수락
              </button>
              <button onClick={() => onAction(match.id, 'reject')}
                className="flex-1 rounded-lg border border-gray-300 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                거절
              </button>
            </>
          ) : (
            <button onClick={() => onAction(match.id, 'cancel')}
              className="flex-1 rounded-lg border border-red-300 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors">
              신청 취소
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/* ── 메인 컴포넌트 ── */
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