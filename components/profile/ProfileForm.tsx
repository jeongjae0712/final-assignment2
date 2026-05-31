'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SportCategory, SportsProfile, ContestProfile, ContestField } from '@/lib/types/database'
import { CONTEST_FIELD_LABELS, CBNU_DEPARTMENTS } from '@/lib/types/database'

const SPORT_OPTIONS: { value: SportCategory; label: string }[] = [
  { value: '풋살', label: '풋살' },
  { value: '농구', label: '농구' },
  { value: '테니스', label: '테니스' },
  { value: '소운동장', label: '소운동장' },
  { value: '종합운동장', label: '종합운동장' },
]

const FIELD_OPTIONS: { value: ContestField; label: string }[] = [
  { value: 'marketing', label: '마케팅/아이디어' },
  { value: 'video', label: '영상/UCC/사진' },
  { value: 'design', label: '디자인' },
  { value: 'literature', label: '문학/글' },
  { value: 'it', label: 'IT/소프트웨어' },
  { value: 'arts', label: '예체능/음악/미술' },
  { value: 'academic', label: '학술/창업/논술' },
]

type Tab = 'basic' | 'contest' | 'sports'

interface UserRow { id: string; nickname: string; student_id: string; email: string }

export default function ProfileForm() {
  const [tab, setTab] = useState<Tab>('basic')
  const [userRow, setUserRow] = useState<UserRow | null>(null)
  const [contestProfile, setContestProfile] = useState<ContestProfile | null>(null)
  const [sportsProfile, setSportsProfile] = useState<SportsProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 기본 정보
  const [nickname, setNickname] = useState('')
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwNew2, setPwNew2] = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; msg: string } | null>(null)

  // 공모전 프로필
  const [department, setDepartment] = useState('')
  const [fields, setFields] = useState<ContestField[]>([])
  const [contestIntro, setContestIntro] = useState('')
  const [contestVisible, setContestVisible] = useState(true)

  // 스포츠 프로필
  const [sports, setSports] = useState<SportCategory[]>([])
  const [careerYears, setCareerYears] = useState('0')
  const [isPro, setIsPro] = useState(false)
  const [sportsIntro, setSportsIntro] = useState('')
  const [sportsVisible, setSportsVisible] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/profile')
      if (res.ok) {
        const json = await res.json()
        const u: UserRow | null = json.userRow
        const cp: ContestProfile | null = json.contestProfile
        const sp: SportsProfile | null = json.sportsProfile
        setUserRow(u)
        setContestProfile(cp)
        setSportsProfile(sp)
        if (u) setNickname(u.nickname)
        if (cp) {
          setDepartment(cp.department ?? '')
          setFields(cp.fields ?? [])
          setContestIntro(cp.intro ?? '')
          setContestVisible(cp.is_visible)
        }
        if (sp) {
          setSports(sp.sports ?? [])
          setCareerYears(String(sp.career_years))
          setIsPro(sp.is_pro)
          setSportsIntro(sp.intro ?? '')
          setSportsVisible(sp.is_visible)
        }
      }
      setIsLoading(false)
    }
    load()
  }, [])

  function toggleSport(s: SportCategory) {
    setSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }
  function toggleField(f: ContestField) {
    setFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  function showSaved() { setSaved(true); setTimeout(() => setSaved(false), 3000) }

  async function handleSave() {
    setIsSaving(true); setError(null); setSaved(false)

    let payload: { profileType: string; data: Record<string, unknown> }

    if (tab === 'basic') {
      payload = { profileType: 'basic', data: { nickname } }
    } else if (tab === 'contest') {
      payload = { profileType: 'contest', data: { department, fields, intro: contestIntro || null, is_visible: contestVisible } }
    } else {
      payload = { profileType: 'sports', data: { sports, career_years: parseInt(careerYears) || 0, is_pro: isPro, intro: sportsIntro || null, is_visible: sportsVisible } }
    }

    const res = await fetch('/api/profile', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()

    if (!res.ok) { setError(json.error ?? '저장에 실패했습니다') }
    else {
      if (tab === 'contest') setContestProfile(json.profile)
      else if (tab === 'sports') setSportsProfile(json.profile)
      else if (json.nickname) setUserRow(prev => prev ? { ...prev, nickname: json.nickname } : prev)
      showSaved()
    }
    setIsSaving(false)
  }

  async function handlePasswordChange() {
    setPwMsg(null)
    if (!pwNew || pwNew.length < 6) { setPwMsg({ ok: false, msg: '새 비밀번호는 6자 이상이어야 합니다' }); return }
    if (pwNew !== pwNew2) { setPwMsg({ ok: false, msg: '비밀번호가 일치하지 않습니다' }); return }
    setPwSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: pwNew })
    if (error) { setPwMsg({ ok: false, msg: error.message }) }
    else {
      setPwMsg({ ok: true, msg: '비밀번호가 변경되었습니다' })
      setPwCurrent(''); setPwNew(''); setPwNew2('')
    }
    setPwSaving(false)
  }

  if (isLoading) return <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>

  const TABS: { value: Tab; label: string }[] = [
    { value: 'basic', label: '기본 정보' },
    { value: 'contest', label: '공모전 프로필' },
    { value: 'sports', label: '스포츠 프로필' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex border-b border-gray-200">
        {TABS.map(t => (
          <button key={t.value} onClick={() => { setTab(t.value); setError(null); setSaved(false) }}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${tab === t.value ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── 기본 정보 탭 ── */}
      {tab === 'basic' && (
        <div className="space-y-5">
          <div className="bg-gray-50 rounded-xl p-4 space-y-1">
            <p className="text-xs text-gray-500">학번 (변경 불가)</p>
            <p className="text-sm font-medium text-gray-700">{userRow?.student_id ?? '-'}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              닉네임 <span className="text-gray-400 font-normal">(2~10자)</span>
            </label>
            <input
              type="text" value={nickname} onChange={e => setNickname(e.target.value)}
              minLength={2} maxLength={10}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {saved && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">닉네임이 변경되었습니다.</p>}

          <button onClick={handleSave} disabled={isSaving}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {isSaving ? '저장 중...' : '닉네임 저장'}
          </button>

          {/* 비밀번호 변경 */}
          <div className="border-t border-gray-200 pt-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">비밀번호 변경</h3>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">새 비밀번호</label>
              <input type="password" value={pwNew} onChange={e => setPwNew(e.target.value)}
                placeholder="6자 이상" minLength={6}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">새 비밀번호 확인</label>
              <input type="password" value={pwNew2} onChange={e => setPwNew2(e.target.value)}
                placeholder="비밀번호 재입력"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {pwMsg && (
              <p className={`text-sm rounded-lg px-3 py-2 ${pwMsg.ok ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                {pwMsg.msg}
              </p>
            )}
            <button onClick={handlePasswordChange} disabled={pwSaving || !pwNew || !pwNew2}
              className="w-full rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors">
              {pwSaving ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        </div>
      )}

      {/* ── 공모전 프로필 탭 ── */}
      {tab === 'contest' && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
            <select value={department} onChange={e => setDepartment(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">학과 선택</option>
              {CBNU_DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">관심 분야</label>
            <div className="flex flex-wrap gap-2">
              {FIELD_OPTIONS.map(o => (
                <button key={o.value} type="button" onClick={() => toggleField(o.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${fields.includes(o.value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              팀원 모집 신청 시 자기소개
              <span className="text-gray-400 font-normal ml-1">(최대 500자)</span>
            </label>
            <textarea value={contestIntro} onChange={e => setContestIntro(e.target.value)}
              rows={5} maxLength={500}
              placeholder="공모전 팀원 모집에 신청할 때 표시될 자기소개를 작성해 주세요."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <p className="text-right text-xs text-gray-400 mt-1">{contestIntro.length}/500</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={contestVisible} onChange={e => setContestVisible(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">공모전 팀원 찾기에서 프로필 공개</span>
          </label>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {saved && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">저장되었습니다.</p>}
          <button onClick={handleSave} disabled={isSaving}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      )}

      {/* ── 스포츠 프로필 탭 ── */}
      {tab === 'sports' && (
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">관심 스포츠</label>
            <div className="flex flex-wrap gap-2">
              {SPORT_OPTIONS.map(o => (
                <button key={o.value} type="button" onClick={() => toggleSport(o.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${sports.includes(o.value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">경력 (년)</label>
              <input type="number" min={0} value={careerYears} onChange={e => setCareerYears(e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex items-end pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={isPro} onChange={e => setIsPro(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">프로 선수 출신</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              자기소개 <span className="text-gray-400 font-normal">(최대 300자)</span>
            </label>
            <textarea value={sportsIntro} onChange={e => setSportsIntro(e.target.value)} rows={4} maxLength={300}
              placeholder="운동 경력이나 선호하는 플레이 방식을 작성해 주세요."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <p className="text-right text-xs text-gray-400 mt-1">{sportsIntro.length}/300</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={sportsVisible} onChange={e => setSportsVisible(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">스포츠 매칭에서 프로필 공개</span>
          </label>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          {saved && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">저장되었습니다.</p>}
          <button onClick={handleSave} disabled={isSaving}
            className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {isSaving ? '저장 중...' : '저장'}
          </button>
        </div>
      )}
    </div>
  )
}