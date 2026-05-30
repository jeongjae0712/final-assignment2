import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ContestList from '@/components/contests/ContestList'

export const metadata = { title: '공모전 찾기 | CBU 매칭' }

export default async function ContestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">공모전 찾기</h1>
        <p className="mt-1 text-sm text-gray-500">관심 분야의 공모전을 탐색하고 팀원을 구해보세요.</p>
      </div>
      <ContestList currentUserId={user.id} />
    </main>
  )
}
