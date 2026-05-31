import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CBU 매칭 | 충북대학교',
  description: '충북대학교 공모전 팀원 & 스포츠 파트너 매칭 플랫폼',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <html lang="ko" className={geist.variable}>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {user && <NavBar userId={user.id} />}
        <main className="pb-20">{children}</main>
      </body>
    </html>
  )
}
