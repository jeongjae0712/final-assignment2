import type { Metadata } from 'next'
import { Geist } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import NavBar from '@/components/NavBar'
import Footer from '@/components/Footer'
import ToastBanner from '@/components/notifications/ToastBanner'

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CBNU 매칭 | 충북대학교 매칭 플랫폼',
  description: '충북대학교 공모전 팀원 모집 및 스포츠 파트너 매칭 플랫폼',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return (
    <html lang="ko" className={geist.variable}>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased flex flex-col">
        {user && <NavBar userId={user.id} />}
        {user && <ToastBanner userId={user.id} />}
        <main className="flex-1 pb-20">{children}</main>
        <Footer />
      </body>
    </html>
  )
}