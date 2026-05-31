'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Contest, ContestField, ContestRecruitment, ContestApplication } from '@/lib/types/database'
import { CONTEST_FIELD_LABELS } from '@/lib/types/database'

export default function ContestList({ currentUserId }: { currentUserId: string }) {
  const [contests, setContests] = useState<Contest[]>([])
  const [field, setField] = useState<ContestField | ''>('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedContest, setSelectedContest] = useState<Contest | null>(null)

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
  const fieldKeys = Object.keys(CONTEST_FIELD_LABELS) as ContestField[]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => { setField(''); setPage(1) }}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${field === '' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
          전체
        </button>
        {fieldKeys.map(key => (
          <button key={key} onClick={() => { setField(key); setPage(1) }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${field === key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            {CONTEST_FIELD_LABELS[key]}
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
            <div key={contest.id}
              onClick={() => setSelectedContest(contest)}
              className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col gap-3">
              <div className="flex-1">
                <span className="inline-block text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-2 py-0.5 mb-1">
                  {CONTEST_FIELD_LABELS[contest.field]}
                </span>
                <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{contest.title}</h3>
                <div className="mt-2 text-xs text-gray-500 space-y-0.5">
                  {contest.organizer && <p>주최: {contest.organizer}</p>}
                  <p>마감: {contest.end_date}</p>
                  {contest.prize && <p>시상: {contest.prize}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                <span className="text-xs text-blue-600 font-medium">팀원 모집 현황 보기 →</span>
                <a href={contest.url} target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="text-xs text-gray-500 hover:text-gray-700 underline">
                  공모전 보기
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${p === page ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
              {p}
            </button>
          ))}
        </div>
      )}

      {selectedContest && (
        <ContestRecruitmentModal
          contest={selectedContest}
          currentUserId={currentUserId}
          onClose={() => setSelectedContest(null)}
        />
      )}
    </div>
  )
}

// 팀원 모집 목록 모달
function ContestRecruitmentModal({
  contest,
  currentUserId,
  onClose,
}: {
  contest: Contest
  currentUserId: string
  onClose: () => void
}) {
  const router = useRouter()
  async function handleContact(partnerId: string) {
    const res = await fetch('/api/chat/rooms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ partner_id: partnerId }) })
    if (res.ok) { const j = await res.json(); router.push('/chat/' + j.roomId) }
  }
  const [recruitments, setRecruitments] = useState<(ContestRecruitment & {
    organizer: { id: string; nickname: string; department: string | null }
    user_applied: boolean
  })[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedRecruitment, setSelectedRecruitment] = useState<(typeof recruitments)[0] | null>(null)
  const [viewApplicants, setViewApplicants] = useState<(typeof recruitments)[0] | null>(null)

  const fetchRecruitments = useCallback(async () => {
    setIsLoading(true)
    const res = await fetch('/api/contest-recruitments?contest_id=' + contest.id)
    if (res.ok) {
      const json = await res.json()
      setRecruitments(json.recruitments ?? [])
    }
    setIsLoading(false)
  }, [contest.id])

  function markApplied(recruitmentId: string) {
    setRecruitments(prev => prev.map(r => r.id === recruitmentId ? { ...r, user_applied: true } : r))
  }

  useEffect(() => { fetchRecruitments() }, [fetchRecruitments])

  if (showCreate) {
    return (
      <CreateRecruitmentModal
        contest={contest}
        onClose={() => setShowCreate(false)}
        onSuccess={() => { setShowCreate(false); fetchRecruitments() }}
      />
    )
  }

  if (selectedRecruitment) {
    return (
      <ApplyModal
        recruitment={selectedRecruitment}
        currentUserId={currentUserId}
        onClose={() => setSelectedRecruitment(null)}
        onSuccess={() => { markApplied(selectedRecruitment.id); setSelectedRecruitment(null) }}
      />
    )
  }

  if (viewApplicants) {
    return (
      <ApplicantsModal
        recruitment={viewApplicants}
        onClose={() => setViewApplicants(null)}
      />
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 mr-4">
            <span className="text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-2 py-0.5">
              {CONTEST_FIELD_LABELS[contest.field]}
            </span>
            <h2 className="text-base font-semibold text-gray-900 mt-1 line-clamp-2">{contest.title}</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 flex-shrink-0">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">마감: {contest.end_date}</p>

        <button
          onClick={() => setShowCreate(true)}
          className="mb-4 w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition-colors">
          + 팀원 모집 공고 작성
        </button>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-8">불러오는 중...</p>
        ) : recruitments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">아직 팀원 모집 공고가 없습니다.<br />첫 번째 모집 공고를 작성해보세요!</p>
        ) : (
          <ul className="space-y-3 overflow-y-auto flex-1 pr-1">
            {recruitments.map(r => (
              <li key={r.id} className="rounded-xl border border-gray-200 p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">{r.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {r.organizer.nickname} · {r.organizer.department ?? '학과 미설정'} · 최대 {r.max_members}명
                    </p>
                    {r.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{r.description}</p>
                    )}
                    {r.required_fields && r.required_fields.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.required_fields.map((f) => (
                          <span key={f} className="text-xs bg-blue-50 text-blue-700 rounded-full px-2 py-0.5">
                            {CONTEST_FIELD_LABELS[f as ContestField]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {r.organizer_id === currentUserId ? (
                      <button
                        onClick={() => setViewApplicants(r)}
                        className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 transition-colors">
                        신청자 보기
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleContact(r.organizer_id)}
                          className="rounded-lg border border-blue-600 px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors">
                          문의하기
                        </button>
                        {r.user_applied ? (
                          <button
                            disabled
                            className="rounded-lg bg-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 cursor-not-allowed">
                            신청완료
                          </button>
                        ) : (
                          <button
                            onClick={() => setSelectedRecruitment(r)}
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
                            신청하기
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

// 모집 공고 작성 모달
function CreateRecruitmentModal({
  contest,
  onClose,
  onSuccess,
}: {
  contest: Contest
  onClose: () => void
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [maxMembers, setMaxMembers] = useState('4')
  const [requiredFields, setRequiredFields] = useState<ContestField[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleField(f: ContestField) {
    setRequiredFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { setError('제목을 입력해주세요'); return }
    setIsSubmitting(true)
    setError(null)

    const res = await fetch('/api/contest-recruitments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contest_id: contest.id,
        title: title.trim(),
        description: description.trim() || undefined,
        required_fields: requiredFields,
        max_members: parseInt(maxMembers) || 4,
      }),
    })

    const json = await res.json()
    if (!res.ok) { setError(json.error ?? '작성에 실패했습니다'); setIsSubmitting(false); return }
    onSuccess()
  }

  const fieldKeys = Object.keys(CONTEST_FIELD_LABELS) as ContestField[]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">팀원 모집 공고 작성</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4 bg-gray-50 rounded-lg px-3 py-2">{contest.title}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">공고 제목 *</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={100}
              placeholder="예: 충청북도 아이디어 공모전 팀원 모집합니다"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">모집 내용</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={500} rows={4}
              placeholder="모집 인원 수, 원하는 역할, 일정, 연락 방법 등을 자세히 적어주세요."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <p className="text-right text-xs text-gray-400 mt-1">{description.length}/500</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">원하는 분야 (선택)</label>
            <div className="flex flex-wrap gap-2">
              {fieldKeys.map(f => (
                <button key={f} type="button" onClick={() => toggleField(f)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${requiredFields.includes(f) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                  {CONTEST_FIELD_LABELS[f as ContestField]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">최대 팀원 수</label>
            <input type="number" min={2} max={10} value={maxMembers} onChange={e => setMaxMembers(e.target.value)}
              className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">취소</button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? '작성 중...' : '공고 작성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 신청 모달
function ApplyModal({
  recruitment,
  currentUserId,
  onClose,
  onSuccess,
}: {
  recruitment: ContestRecruitment & { organizer: { id: string; nickname: string; department: string | null } }
  currentUserId: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [intro, setIntro] = useState('')
  const [background, setBackground] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!intro.trim()) { setError('자기소개를 입력해주세요'); return }
    setIsSubmitting(true)
    setError(null)

    const res = await fetch(`/api/contest-recruitments/${recruitment.id}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intro: intro.trim(), background: background.trim() || undefined }),
    })

    const json = await res.json()
    if (!res.ok) { setError(json.error ?? '신청에 실패했습니다'); setIsSubmitting(false); return }
    alert('신청이 완료되었습니다. 팀장의 검토 후 연락이 올 수 있습니다.')
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">팀원 모집 신청</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 mb-4">
          <p className="text-sm font-medium text-gray-900">{recruitment.title}</p>
          <p className="text-xs text-gray-500 mt-0.5">팀장: {recruitment.organizer.nickname} ({recruitment.organizer.department ?? '학과 미설정'})</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">자기소개 * <span className="text-gray-400 font-normal">(최대 500자)</span></label>
            <textarea value={intro} onChange={e => setIntro(e.target.value)} maxLength={500} rows={5} required
              placeholder="공모전 참가 동기, 기여할 수 있는 역할, 관련 경험 등을 작성해 주세요."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <p className="text-right text-xs text-gray-400 mt-1">{intro.length}/500</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">약력/포트폴리오 <span className="text-gray-400 font-normal">(선택, 최대 1000자)</span></label>
            <textarea value={background} onChange={e => setBackground(e.target.value)} maxLength={1000} rows={4}
              placeholder="관련 수상 경력, 프로젝트 경험, 보유 기술 등을 적어주세요."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <p className="text-right text-xs text-gray-400 mt-1">{background.length}/1000</p>
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 rounded-lg border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">취소</button>
            <button type="submit" disabled={isSubmitting}
              className="flex-1 rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
              {isSubmitting ? '신청 중...' : '신청하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// 신청자 목록 모달 (팀장용)
function ApplicantsModal({
  recruitment,
  onClose,
}: {
  recruitment: ContestRecruitment & { organizer: { id: string; nickname: string; department: string | null } }
  onClose: () => void
}) {
  const [applications, setApplications] = useState<(ContestApplication & {
    applicant: { id: string; nickname: string; department: string | null }
  })[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchApplications = useCallback(async () => {
    const res = await fetch(`/api/contest-recruitments/${recruitment.id}/applicants`)
    if (res.ok) {
      const json = await res.json()
      setApplications(json.applications ?? [])
    }
    setIsLoading(false)
  }, [recruitment.id])

  useEffect(() => { fetchApplications() }, [fetchApplications])

  async function handleAction(appId: string, action: 'accept' | 'reject') {
    const res = await fetch(`/api/contest-recruitments/${recruitment.id}/applicants/${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    if (res.ok) fetchApplications()
  }

  const STATUS_LABEL: Record<string, string> = { pending: '검토 중', accepted: '수락', rejected: '거절' }
  const STATUS_COLOR: Record<string, string> = {
    pending: 'bg-yellow-50 text-yellow-700',
    accepted: 'bg-green-50 text-green-700',
    rejected: 'bg-red-50 text-red-700',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">신청자 목록</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2 mb-4">{recruitment.title}</p>

        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-8">불러오는 중...</p>
        ) : applications.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">아직 신청자가 없습니다.</p>
        ) : (
          <ul className="space-y-3 overflow-y-auto flex-1 pr-1">
            {applications.map(app => (
              <li key={app.id} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{app.applicant.nickname}</p>
                    <p className="text-xs text-gray-500">{app.applicant.department ?? '학과 미설정'}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[app.status]}`}>
                    {STATUS_LABEL[app.status]}
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <p className="text-xs font-medium text-gray-600 mb-0.5">자기소개</p>
                    <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2">{app.intro}</p>
                  </div>
                  {app.background && (
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-0.5">약력/포트폴리오</p>
                      <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2">{app.background}</p>
                    </div>
                  )}
                </div>
                {app.status === 'pending' && (
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => handleAction(app.id, 'reject')}
                      className="flex-1 rounded-lg border border-gray-300 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50">거절</button>
                    <button onClick={() => handleAction(app.id, 'accept')}
                      className="flex-1 rounded-lg bg-blue-600 py-1.5 text-xs font-medium text-white hover:bg-blue-700">수락</button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

/* ─── 모집 공고 수정 모달 ─── */
function EditRecruitmentModal({
  recruitment, onClose, onSaved, onDelete,
}: {
  recruitment: ContestRecruitment & { organizer: { id: string; nickname: string; department: string | null } }
  onClose: () => void; onSaved: () => void; onDelete: () => void
}) {
  const [title, setTitle] = useState(recruitment.title)
  const [description, setDescription] = useState(recruitment.description ?? '')
  const [requiredFields, setRequiredFields] = useState<ContestField[]>((recruitment.required_fields as ContestField[]) ?? [])
  const [maxMembers, setMaxMembers] = useState(recruitment.max_members)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string|null>(null)

  function toggleField(f: ContestField) {
    setRequiredFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    if (!title.trim()) { setError('제목을 입력해주세요'); return }
    setIsLoading(true)
    const res = await fetch(`/api/contest-recruitments/${recruitment.id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), description: description||null, required_fields: requiredFields, max_members: maxMembers }),
    })
    const j = await res.json()
    if (!res.ok) { setError(j.error ?? '수정에 실패했습니다'); setIsLoading(false); return }
    onSaved()
  }

  const fieldKeys = Object.keys(CONTEST_FIELD_LABELS) as ContestField[]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">모집 공고 수정</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-500">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">제목</label>
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} required maxLength={100}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">설명 <span className="text-gray-400">(선택)</span></label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={500} rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1.5">원하는 분야 <span className="text-gray-400">(선택)</span></label>
            <div className="flex flex-wrap gap-2">
              {fieldKeys.map(f => (
                <button key={f} type="button" onClick={() => toggleField(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${requiredFields.includes(f) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300'}`}>
                  {CONTEST_FIELD_LABELS[f as ContestField]}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">최대 팀원 수: {maxMembers}명</label>
            <input type="range" min={2} max={10} value={maxMembers} onChange={e => setMaxMembers(Number(e.target.value))} className="w-full accent-blue-600" />
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