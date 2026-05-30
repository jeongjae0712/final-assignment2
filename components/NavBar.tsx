import Link from 'next/link'
import NotificationBell from '@/components/notifications/NotificationBell'

interface Props {
  userId: string
}

export default function NavBar({ userId }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <nav className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-base font-bold text-blue-700 tracking-tight">
          CBU 매칭
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href="/matches"
            className="px-3 py-1.5 text-sm font-medium text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            매칭
          </Link>
          <NotificationBell userId={userId} />
        </div>
      </nav>
    </header>
  )
}
