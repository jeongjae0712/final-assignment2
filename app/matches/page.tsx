import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import MatchList from '@/components/matches/MatchList'

export const metadata = { title: '매칭 관리 | CBU 매칭' }

export default async function MatchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">매칭 관리</h1>
      <MatchList currentUserId={user.id} />
    </main>
  )
}
