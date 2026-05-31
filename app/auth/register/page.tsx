'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { CBNU_DEPARTMENTS } from '@/lib/types/database'
import type { ContestField } from '@/lib/types/database'

const FIELD_OPTIONS: { value: ContestField; label: string }[] = [
  { value: 'marketing', label: '마케팅/아이디어' },
  { value: 'video', label: '영상/UCC/사진' },
  { value: 'design', label: '디자인' },
  { value: 'literature', label: '문학/글' },
  { value: 'it', label: 'IT/소프트웨어' },
  { value: 'arts', label: '예체능/음악/미술' },
  { value: 'academic', label: '학술/창업/논술' },
]

export default function RegisterPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)

  // Step 1
  const [nickname, setNickname] = useState('')
  const [studentId, setStudentId] = useState('')
  const [department, setDepartment] = useState('')
  const [gender, setGender] = useState('')

  // Step 2
  const [fields, setFields] = useState<ContestField[]>([])

  // Step 3
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleField(f: ContestField) {
    setFields(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (step === 1) {
      if (!nickname || !studentId || !department || !gender) {
        setError('모든 항목을 입력해주세요.')
        return
      }
      setStep(2)
      return
    }

    if (step === 2) {
      setStep(3)
      return
    }

    if (password !== password2) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setIsLoading(true)
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, password, nickname, department, gender, fields }),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error ?? '회원가입에 실패했습니다.')
      setIsLoading(false)
      return
    }

    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    await supabase.auth.signInWithPassword({
      email: studentId.trim() + '@cbu.internal',
      password,
    })
    router.push('/')
    router.refresh()
  }

  const TOTAL_STEPS = 3

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-blue-600">CBU 매칭</h1>
          <p className="mt-1 text-sm text-gray-500">충북대학교 매칭 플랫폼</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* 단계 표시 */}
          <div className="flex items-center gap-2 mb-5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s, idx) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>{s}</div>
                {idx < TOTAL_STEPS - 1 && <div className={`flex-1 h-0.5 mx-1 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <>
                <h2 className="text-base font-semibold text-gray-900">기본 정보</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">닉네임</label>
                  <input type="text" value={nickname} onChange={e => setNickname(e.target.value)} required maxLength={10} minLength={2} placeholder="2~10자" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">학번</label>
                  <input type="text" value={studentId} onChange={e => setStudentId(e.target.value)} required placeholder="예: 2022026025" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">학과</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)} required className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    <option value="">학과 선택</option>
                    {CBNU_DEPARTMENTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">성별</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[['male', '남성'], ['female', '여성'], ['other', '기타']].map(([val, label]) => (
                      <button key={val} type="button" onClick={() => setGender(val)}
                        className={`py-2 rounded-lg text-sm font-medium border transition-colors ${gender === val ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="text-base font-semibold text-gray-900">관심 분야 선택</h2>
                <p className="text-xs text-gray-500">공모전 팀원 찾기에서 활용됩니다. 여러 개 선택 가능합니다.</p>
                <div className="flex flex-wrap gap-2">
                  {FIELD_OPTIONS.map(o => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => toggleField(o.value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${fields.includes(o.value) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400">선택하지 않아도 됩니다 (나중에 변경 불가, 신중하게 선택하세요)</p>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="text-base font-semibold text-gray-900">비밀번호 설정</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="6자 이상" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">비밀번호 확인</label>
                  <input type="password" value={password2} onChange={e => setPassword2(e.target.value)} required placeholder="비밀번호 재입력" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </>
            )}

            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

            <div className="flex gap-2 pt-1">
              {step > 1 && (
                <button type="button" onClick={() => { setStep(s => s - 1); setError(null) }}
                  className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                  이전
                </button>
              )}
              <button type="submit" disabled={isLoading}
                className="flex-1 rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {isLoading ? '가입 중...' : step < TOTAL_STEPS ? '다음' : '회원가입'}
              </button>
            </div>
          </form>

          <p className="mt-4 text-center text-sm text-gray-500">
            이미 계정이 있으신가요?{' '}
            <Link href="/auth/login" className="text-blue-600 font-medium hover:underline">로그인</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
