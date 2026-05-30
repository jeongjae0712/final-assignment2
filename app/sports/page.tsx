import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SportsList from '@/components/sports/SportsList'

export const metadata = { title: '스포츠 파트너 | CBU 매칭' }

export default async function SportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">스포츠 파트너</h1>
        <p className="mt-1 text-sm text-gray-500">교내 체육시설 예약 슬롯에서 함께할 파트너를 찾아보세요.</p>
      </div>
      <SportsList currentUserId={user.id} />
    </main>
  )
}
