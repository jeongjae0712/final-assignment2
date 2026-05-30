import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('users')
    .select('nickname')
    .eq('id', user.id)
    .single()

  return (
    <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          안녕하세요, {profile?.nickname ?? '사용자'}님
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          충북대학교 공모전 팀원 & 스포츠 파트너 매칭 플랫폼
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/matches"
          className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
            매칭 관리
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            받은 신청 확인 및 보낸 신청 현황을 관리하세요.
          </p>
        </Link>

        <Link
          href="/contests"
          className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
            공모전 찾기
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            공모전을 탐색하고 팀원을 구해보세요.
          </p>
        </Link>

        <Link
          href="/sports"
          className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
            스포츠 파트너
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            교내 체육시설 예약 슬롯에서 파트너를 찾아보세요.
          </p>
        </Link>

        <Link
          href="/profile"
          className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <h2 className="text-base font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
            내 프로필
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            공모전 및 스포츠 프로필을 설정하세요.
          </p>
        </Link>
      </div>
    </main>
  )
}
