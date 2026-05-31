import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import SportsList from '@/components/sports/SportsList'

export const metadata = { title: '스포츠 매칭 | CBNU 매칭' }

export default async function SportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">스포츠 매칭</h1>
        <p className="mt-1 text-sm text-gray-500">매칭을 직접 개설하거나 충북대 체육시설 예약 현황을 확인하세요.</p>
      </div>
      <SportsList currentUserId={user.id} />
    </main>
  )
}
