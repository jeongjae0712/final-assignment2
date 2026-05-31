import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ContestField, SportCategory } from '@/lib/types/database'

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const [{ data: userRow }, { data: contestProfile }, { data: sportsProfile }] = await Promise.all([
    supabase.from('users').select('id, nickname, student_id, email').eq('id', user.id).single(),
    supabase.from('contest_profiles').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('sports_profiles').select('*').eq('user_id', user.id).maybeSingle(),
  ])

  return NextResponse.json({ userRow, contestProfile, sportsProfile })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: '인증이 필요합니다' }, { status: 401 })

  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: '요청 형식이 올바르지 않습니다' }, { status: 400 })

  const { profileType, data: profileData } = body as {
    profileType: 'basic' | 'contest' | 'sports'
    data: Record<string, unknown>
  }

  // 기본 정보 수정 (닉네임)
  if (profileType === 'basic') {
    const nickname = (profileData.nickname as string | undefined)?.trim()
    if (!nickname || nickname.length < 2 || nickname.length > 10) {
      return NextResponse.json({ error: '닉네임은 2~10자여야 합니다' }, { status: 400 })
    }

    const admin = createAdminClient()
    const { error } = await admin
      .from('users')
      .update({ nickname, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      if (error.message.includes('unique') || error.code === '23505') {
        return NextResponse.json({ error: '이미 사용 중인 닉네임입니다' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // auth.users metadata도 업데이트
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: { ...user.user_metadata, nickname },
    })

    return NextResponse.json({ ok: true, nickname })
  }

  if (profileType === 'contest') {
    const payload = {
      user_id: user.id,
      department: profileData.department as string,
      gender: (profileData.gender as string | null) ?? null,
      fields: (profileData.fields as ContestField[]) ?? [],
      intro: (profileData.intro as string | null) ?? null,
      is_visible: (profileData.is_visible as boolean) ?? true,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('contest_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: data })
  }

  if (profileType === 'sports') {
    const payload = {
      user_id: user.id,
      sports: (profileData.sports as SportCategory[]) ?? [],
      career_years: (profileData.career_years as number) ?? 0,
      is_pro: (profileData.is_pro as boolean) ?? false,
      intro: (profileData.intro as string | null) ?? null,
      is_visible: (profileData.is_visible as boolean) ?? true,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('sports_profiles')
      .upsert(payload, { onConflict: 'user_id' })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ profile: data })
  }

  return NextResponse.json({ error: '올바르지 않은 프로필 타입입니다' }, { status: 400 })
}