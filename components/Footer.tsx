import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="max-w-5xl mx-auto px-4 py-6 sm:pb-6 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-gray-800">CBNU 매칭</p>
            <p className="text-xs text-gray-500 mt-0.5">충북대학교 공모전 · 스포츠 매칭 플랫폼</p>
          </div>
          <nav className="flex flex-wrap gap-4 text-xs text-gray-500">
            <Link href="/terms" className="hover:text-blue-600 hover:underline transition-colors">이용약관</Link>
            <Link href="/privacy" className="hover:text-blue-600 font-medium hover:underline transition-colors">개인정보처리방침</Link>
          </nav>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            © 2026 CBNU 매칭. 본 서비스는 충북대학교 학생 프로젝트로 운영됩니다.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            개인정보 보호책임자: 정재원 · jeongjae0712@gmail.com
          </p>
        </div>
      </div>
    </footer>
  )
}