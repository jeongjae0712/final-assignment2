'use client'

import { useEffect, useState } from 'react'
import type { SportCategory, SportsProfile, ContestProfile, ContestField } from '@/lib/types/database'
import { CONTEST_FIELD_LABELS } from '@/lib/types/database'

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

  // Contest tab - 자기소개만 편집
  const [contestIntro, setContestIntro] = useState('')
  const [contestVisible, setContestVisible] = useState(true)

  // Sports tab
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

  async function handleSave() {
    setIsSaving(true)
    setError(null)
    setSaved(false)

    let payload: { profileType: string; data: Record<string, unknown> }

    if (tab === 'contest') {
      payload = {
        profileType: 'contest',
        data: {
          department: contestProfile?.department ?? '',
          gender: contestProfile?.gender ?? null,
          fields: contestProfile?.fields ?? [],
          intro: contestIntro || null,
          is_visible: contestVisible,
        },
      }
    } else {
      payload = {
        profileType: 'sports',
        data: {
          sports,
          career_years: parseInt(careerYears) || 0,
          is_pro: isPro,
          intro: sportsIntro || null,
          is_visible: sportsVisible,
        },
      }
    }

    const res = await fetch('/api/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
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
      <div className="flex border-b border-gray-200">
        {(['contest', 'sports'] as const).map(t => (
          <button key={t} onClick={() => { setTab(t); setError(null); setSaved(false) }}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t === 'contest' ? '공모전 프로필' : '스포츠 프로필'}
          </button>
        ))}
      </div>

      {tab === 'contest' ? (
        <div className="space-y-5">
          {/* 회원가입 시 설정된 정보 표시 (읽기 전용) */}
          {contestProfile && (
            <div className="bg-blue-50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-blue-700">회원가입 시 설정된 정보</p>
              <div className="flex gap-4 text-sm text-blue-900">
                <span>학과: {contestProfile.department}</span>
              </div>
              {contestProfile.fields && contestProfile.fields.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {contestProfile.fields.map((f: ContestField) => (
                    <span key={f} className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5">
                      {CONTEST_FIELD_LABELS[f]}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {!contestProfile && (
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-sm text-gray-500">공모전 프로필이 없습니다. 회원가입 시 관심분야를 선택해야 생성됩니다.</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              팀원 모집 신청 시 자기소개
              <span className="text-gray-400 font-normal ml-1">(최대 500자)</span>
            </label>
            <textarea
              value={contestIntro}
              onChange={e => setContestIntro(e.target.value)}
              rows={5}
              maxLength={500}
              placeholder="공모전 팀원 모집에 신청할 때 표시될 자기소개를 작성해 주세요. 역량, 경험, 참가 동기 등을 적으면 좋습니다."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-right text-xs text-gray-400 mt-1">{contestIntro.length}/500</p>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={contestVisible} onChange={e => setContestVisible(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
            <span className="text-sm text-gray-700">공모전 팀원 찾기에서 프로필 공개</span>
          </label>
        </div>
      ) : (
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
              자기소개
              <span className="text-gray-400 font-normal ml-1">(최대 300자)</span>
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
        </div>
      )}

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {saved && <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">저장되었습니다.</p>}

      <button onClick={handleSave} disabled={isSaving}
        className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
        {isSaving ? '저장 중...' : '저장'}
      </button>
    </div>
  )
}
