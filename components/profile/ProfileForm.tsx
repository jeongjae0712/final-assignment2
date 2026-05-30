'use client'

import { useEffect, useState } from 'react'
import type { ContestField, SportCategory, ContestProfile, SportsProfile } from '@/lib/types/database'

const CONTEST_FIELD_OPTIONS: { value: ContestField; label: string }[] = [
  { value: 'marketing', label: '마케팅/아이디어' },
  { value: 'video', label: '영상/UCC/사진' },
  { value: 'design', label: '디자인' },
  { value: 'literature', label: '문학/글' },
  { value: 'it', label: 'IT/소프트웨어' },
  { value: 'arts', label: '예체능/음악/미술' },
  { value: 'academic', label: '학술/창업/논술' },
]

const SPORT_OPTIONS: { value: SportCategory; label: string }[] = [
  { value: '풋살', label: '풋살' },
  { value: '농구', label: '농구' },
  { value: '테니스', label: '테니스' },
  { value: '소운동장', label: '소운동장' },
  { value: '종합운동장', label: '종합운동장' },
]

type Tab = 'contest' | 'sports'

export default function ProfileForm() {
  const [tab, setTab] = useState<Tab>('contest')
  const [contestProfile, setContestProfile] = useState<ContestProfile | null>(null)
  const [sportsProfile, setSportsProfile] = useState<SportsProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Contest form state
  const [department, setDepartment] = useState('')
  const [contestGender, setContestGender] = useState('')
  const [contestAge, setContestAge] = useState('')
  const [contestCount, setContestCount] = useState('0')
  const [fields, setFields] = useState<ContestField[]>([])
  const [contestIntro, setContestIntro] = useState('')
  const [contestVisible, setContestVisible] = useState(true)

  // Sports form state
  const [sportsGender, setSportsGender] = useState('')
  const [sportsAge, setSportsAge] = useState('')
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
        const cp: ContestProfile | null = json.contestProfile
        const sp: SportsProfile | null = json.sportsProfile
        setContestProfile(cp)
        setSportsProfile(sp)
        if (cp) {
          setDepartment(cp.department)
          setContestGender(cp.gender ?? '')
          setContestAge(cp.age != null ? String(cp.age) : '')
          setContestCount(String(cp.contest_count))
          setFields(cp.fields ?? [])
          setContestIntro(cp.intro ?? '')
          setContestVisible(cp.is_visible)
        }
        if (sp) {
          setSportsGender(sp.gender ?? '')
          setSportsAge(sp.age != null ? String(sp.age) : '')
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

  function toggleField(f: ContestField) {
    setFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  function toggleSport(s: SportCategory) {
    setSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    setSaved(false)

    const profileType = tab
    const data = tab === 'contest'
      ? {
          department,
          gender: contestGender || null,
          age: contestAge ? parseInt(contestAge) : null,
          contest_count: parseInt(contestCount) || 0,
          fields,
          intro: contestIntro || null,
          is_visible: contestVisible,
        }
      : {
          gender: sportsGender || null,
          age: sportsAge ? parseInt(sportsAge) : null,
          sports,
          career_years: parseInt(careerYears) || 0,
          is_pro: isPro,
          intro: sportsIntro || null,
          is_visible: sportsVisible,
        }

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileType, data }),
    })

    if (res.ok) {
      const json = await res.json()
      if (tab === 'contest') setContestProfile(json.profile)
      else setSportsProfile(json.profile)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } else {
      const json = await res.json()
      setError(json.error ?? '저장에 실패했습니다')
    }
    setIsSaving(false)
  }

  if (isLoading) {
    return <div className="py-16 text-center text-sm text-gray-400">불러오는 중...</div>
  }

  return (
    <div className="space-y-6">
      {/* 탭 */}
      <div className="flex border-b border-gray-200">
        {(['contest', 'sports'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); setError(null); setSaved(false) }}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'contest' ? '공모전 프로필' : '스포츠 프로필'}
          </button>
        ))}
      </div>

      {tab === 'contest' ? (
        <div className="space-y-5">
          <Field label="학과">
            <input
              value={department}
              onChange={e => setDepartment(e.target.value)}
              placeholder="예: 컴퓨터공학과"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="성별">
              <select value={contestGender} onChange={e => setContestGender(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">미설정</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </Field>
            <Field label="나이">
              <input type="number" min={15} max={40} value={contestAge} onChange={e => setContestAge(e.target.value)} placeholder="예: 23" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Field>
          </div>
          <Field label="공모전 참여 횟수">
            <input type="number" min={0} value={contestCount} onChange={e => setContestCount(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </Field>
          <Field label="관심 분야">
            <div className="flex flex-wrap gap-2">
              {CONTEST_FIELD_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleField(o.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${fields.includes(o.value) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label="자기소개">
            <textarea value={contestIntro} onChange={e => setContestIntro(e.target.value)} rows={4} maxLength={500} placeholder="간단한 자기소개를 작성해 주세요." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <p className="text-right text-xs text-gray-400 mt-1">{contestIntro.length}/500</p>
          </Field>
          <Field label="">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={contestVisible} onChange={e => setContestVisible(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">프로필 공개 (팀원 찾기에서 노출)</span>
            </label>
          </Field>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <Field label="성별">
              <select value={sportsGender} onChange={e => setSportsGender(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">미설정</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            </Field>
            <Field label="나이">
              <input type="number" min={15} max={40} value={sportsAge} onChange={e => setSportsAge(e.target.value)} placeholder="예: 23" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Field>
          </div>
          <Field label="관심 스포츠">
            <div className="flex flex-wrap gap-2">
              {SPORT_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => toggleSport(o.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${sports.includes(o.value) ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="경력 (년)">
              <input type="number" min={0} value={careerYears} onChange={e => setCareerYears(e.target.value)} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </Field>
            <Field label="">
              <label className="flex items-center gap-2 cursor-pointer mt-6">
                <input type="checkbox" checked={isPro} onChange={e => setIsPro(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="text-sm text-gray-700">프로 선수 출신</span>
              </label>
            </Field>
          </div>
          <Field label="자기소개">
            <textarea value={sportsIntro} onChange={e => setSportsIntro(e.target.value)} rows={4} maxLength={500} placeholder="운동 경력이나 선호하는 플레이 방식을 작성해 주세요." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            <p className="text-right text-xs text-gray-400 mt-1">{sportsIntro.length}/500</p>
          </Field>
          <Field label="">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={sportsVisible} onChange={e => setSportsVisible(e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-sm text-gray-700">프로필 공개 (파트너 찾기에서 노출)</span>
            </label>
          </Field>
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {saved && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">저장되었습니다.</p>}

      <button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      {children}
    </div>
  )
}
