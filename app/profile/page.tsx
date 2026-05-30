import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ProfileForm from '@/components/profile/ProfileForm'

export const metadata = { title: '내 프로필 | CBU 매칭' }

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  return (
    <main className="max-w-xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">내 프로필</h1>
        <p className="mt-1 text-sm text-gray-500">공모전과 스포츠 프로필을 설정하세요.</p>
      </div>
      <ProfileForm />
    </main>
  )
}
