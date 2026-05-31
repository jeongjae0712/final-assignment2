'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import NotificationBell from '@/components/notifications/NotificationBell'

const NAV_ITEMS = [
  { href: '/', label: '홈', icon: '🏠' },
  { href: '/contests', label: '공모전', icon: '🏆' },
  { href: '/sports', label: '스포츠', icon: '⚽' },
  { href: '/matches', label: '매칭', icon: '🤝' },
  { href: '/chat', label: '채팅', icon: '💬' },
  { href: '/profile', label: '프로필', icon: '👤' },
]

export default function NavBar({ userId }: { userId: string }) {
  const pathname = usePathname()

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-blue-600">CBU 매칭</Link>
          <nav className="hidden sm:flex items-center gap-1">
            {NAV_ITEMS.map(item => (
              <Link key={item.href} href={item.href}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')
                    ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                {item.label}
              </Link>
            ))}
          </nav>
          <NotificationBell userId={userId} />
        </div>
      </header>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex">
        {NAV_ITEMS.map(item => (
          <Link key={item.href} href={item.href}
            className={`flex-1 py-2 flex flex-col items-center gap-0.5 text-xs font-medium transition-colors ${
              pathname.startsWith(item.href) && (item.href !== '/' || pathname === '/')
                ? 'text-blue-600' : 'text-gray-400'
            }`}>
            <span className="text-base leading-none">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  )
}