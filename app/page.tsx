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

  const nickname = profile?.nickname
    ?? (user.user_metadata?.nickname as string | undefined)
    ?? '사용자'

  const { count: pendingMatches } = await supabase
    .from('matches')
    .select('*', { count: 'exact', head: true })
    .eq('receiver_id', user.id)
    .eq('status', 'pending')

  const cards = [
    { href: '/contests', icon: '🏆', title: '공모전 찾기', desc: '공모전 탐색 · 팀원 모집' },
    { href: '/sports', icon: '⚽', title: '스포츠 매칭', desc: '매칭 개설 · 예약 현황 확인' },
    { href: '/matches', icon: '🤝', title: '매칭 관리', desc: '받은 신청 · 보낸 신청' },
    { href: '/profile', icon: '👤', title: '내 프로필', desc: '스포츠 프로필 설정' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl p-6 text-white">
        <p className="text-blue-100 text-sm">안녕하세요</p>
        <h1 className="text-2xl font-bold mt-1">{nickname}님 👋</h1>
        <p className="text-blue-100 text-sm mt-2">충북대학교 공모전 · 스포츠 매칭 플랫폼</p>
      </div>

      {(pendingMatches ?? 0) > 0 && (
        <Link href="/matches" className="bg-orange-50 border border-orange-200 rounded-xl p-4 hover:bg-orange-100 transition-colors">
          <p className="text-2xl font-bold text-orange-600">{pendingMatches}</p>
          <p className="text-sm text-orange-700 mt-0.5">받은 매칭 신청</p>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-4">
        {cards.map(card => (
          <Link
            key={card.href}
            href={card.href}
            className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-blue-300 hover:shadow-md transition-all"
          >
            <div className="text-3xl mb-3">{card.icon}</div>
            <h2 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">{card.title}</h2>
            <p className="text-xs text-gray-500 mt-1">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
