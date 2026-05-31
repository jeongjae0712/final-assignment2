import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { ContestField } from '@/lib/types/database'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '잘못된 요청입니다' }, { status: 400 })

  const { studentId, password, nickname, department, gender, fields } = body as {
    studentId: string
    password: string
    nickname: string
    department?: string
    gender?: string
    fields?: ContestField[]
  }

  if (!studentId || !password || !nickname) {
    return NextResponse.json({ error: '모든 항목을 입력해주세요' }, { status: 400 })
  }
  if (password.length < 6) {
    return NextResponse.json({ error: '비밀번호는 6자 이상이어야 합니다' }, { status: 400 })
  }

  const supabase = createServiceClient()
  const email = studentId.trim() + '@cbnu.internal'

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { nickname, student_id: studentId.trim(), department, gender },
  })

  if (error) {
    const msg = error.message.includes('already') ? '이미 가입된 학번입니다.' : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  if (data.user) {
    // users 테이블: 실제 스키마 컬럼만 upsert (department/gender는 contest_profiles에서 관리)
    const { error: upsertErr } = await supabase.from('users').upsert({
      id: data.user.id,
      email,
      nickname: nickname.trim(),
      student_id: studentId.trim(),
    }, { onConflict: 'id' })

    if (upsertErr) {
      console.error('[register] users upsert error:', upsertErr.message)
    }

    // 관심분야가 있으면 contest_profiles 자동 생성
    if (fields && fields.length > 0 && department) {
      await supabase.from('contest_profiles').upsert({
        user_id: data.user.id,
        department,
        gender: gender ?? null,
        fields,
        is_visible: true,
      }, { onConflict: 'user_id' })
    }
  }

  return NextResponse.json({ ok: true })
}