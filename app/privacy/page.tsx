import Link from 'next/link'

export const metadata = {
  title: '개인정보처리방침 | CBU 매칭',
}

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 홈으로</Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">개인정보처리방침</h1>
        <p className="mt-1 text-sm text-gray-500">시행일: 2026년 6월 1일</p>
      </div>

      <Section title="1. 개인정보 수집·이용 목적">
        <p>CBU 매칭(이하 "서비스")은 충북대학교 재학생을 위한 공모전 팀원 모집 및 스포츠 파트너 매칭 서비스를 제공하기 위하여 최소한의 개인정보를 수집·이용합니다.</p>
        <ul>
          <li>회원가입 및 본인 식별</li>
          <li>공모전 팀원 매칭 서비스 제공</li>
          <li>스포츠 파트너 매칭 서비스 제공</li>
          <li>채팅 및 알림 서비스 제공</li>
          <li>서비스 개선 및 통계 분석</li>
        </ul>
      </Section>

      <Section title="2. 수집하는 개인정보 항목">
        <SubTitle>필수 항목</SubTitle>
        <ul>
          <li>학번(아이디로 사용), 닉네임, 비밀번호(암호화 저장)</li>
        </ul>
        <SubTitle>선택 항목</SubTitle>
        <ul>
          <li>학과, 성별, 관심 공모전 분야</li>
          <li>스포츠 프로필: 종목, 경력, 자기소개</li>
        </ul>
        <SubTitle>자동 수집 항목</SubTitle>
        <ul>
          <li>서비스 이용 기록(매칭 내역, 채팅 메시지, 알림 이력)</li>
          <li>접속 일시 (Supabase Auth 로그)</li>
        </ul>
        <p className="mt-2 text-sm text-gray-500">※ 비밀번호는 bcrypt 해시로 암호화되어 저장되며, 원문은 보관하지 않습니다.</p>
      </Section>

      <Section title="3. 개인정보 보유·이용기간">
        <ul>
          <li><strong>회원 탈퇴 시 즉시 삭제</strong>합니다. 단, 관련 법령에 따라 일정 기간 보관이 필요한 경우 해당 기간 동안 보관됩니다.</li>
          <li>전자상거래 분쟁 해결을 위한 기록: 5년 (전자상거래법)</li>
          <li>소비자 불만 또는 분쟁처리 기록: 3년</li>
        </ul>
        <p>서비스 내 채팅 메시지, 매칭 기록 등은 회원 탈퇴 시 함께 삭제됩니다.</p>
      </Section>

      <Section title="4. 개인정보의 제3자 제공">
        <p>서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
        <ul>
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 의하거나, 수사 기관의 요구가 있는 경우</li>
        </ul>
      </Section>

      <Section title="5. 개인정보 처리 위탁">
        <p>서비스는 원활한 서비스 제공을 위해 아래와 같이 개인정보 처리 업무를 위탁합니다.</p>
        <table className="w-full text-sm border border-gray-200 rounded-lg overflow-hidden mt-2">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-700 border-b">수탁업체</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700 border-b">위탁 업무</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700 border-b">보유기간</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-4 py-2 border-b">Supabase Inc. (미국)</td>
              <td className="px-4 py-2 border-b">회원 인증, 데이터베이스 저장</td>
              <td className="px-4 py-2 border-b">회원 탈퇴 시</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-2 text-sm text-gray-500">※ Supabase는 SOC 2 Type II 인증을 취득한 보안 서비스이며, 개인정보보호법 제28조의8에 따른 국외 이전에 해당합니다. 이에 동의하지 않으실 경우 서비스 이용이 제한됩니다.</p>
      </Section>

      <Section title="6. 정보주체의 권리·의무 및 행사방법">
        <p>이용자는 언제든지 다음 권리를 행사할 수 있습니다.</p>
        <ul>
          <li>개인정보 열람 요구</li>
          <li>오류 등이 있을 경우 정정 요구</li>
          <li>삭제 요구</li>
          <li>처리 정지 요구</li>
        </ul>
        <p>위 권리의 행사는 서비스 내 <strong>프로필 탭</strong>에서 직접 처리하거나, 아래 개인정보 보호책임자 연락처로 서면/이메일 요청할 수 있습니다. 요청 후 10일 이내에 처리합니다.</p>
      </Section>

      <Section title="7. 개인정보 파기 절차 및 방법">
        <ul>
          <li><strong>파기 절차:</strong> 목적 달성 후 별도 저장 없이 즉시 파기합니다. 법령에 따라 보관이 필요한 경우에만 별도 보관합니다.</li>
          <li><strong>파기 방법:</strong> 데이터베이스에서 영구 삭제(DELETE) 처리하여 복구가 불가능하도록 합니다.</li>
        </ul>
      </Section>

      <Section title="8. 개인정보의 안전성 확보 조치">
        <ul>
          <li>비밀번호 bcrypt 암호화 저장</li>
          <li>HTTPS(TLS 1.2 이상) 암호화 전송</li>
          <li>행 수준 보안(Row Level Security) 적용으로 타인의 데이터에 접근 불가</li>
          <li>서비스 키(Service Role Key) 서버 측 보관, 클라이언트 미노출</li>
          <li>접근 권한 최소화 원칙 적용</li>
        </ul>
      </Section>

      <Section title="9. 개인정보 보호책임자">
        <ul>
          <li><strong>성명:</strong> 정재원</li>
          <li><strong>소속:</strong> 충북대학교 경영정보학과</li>
          <li><strong>이메일:</strong> jeongjae0712@gmail.com</li>
        </ul>
        <p className="mt-2 text-sm">개인정보 침해에 대한 신고나 상담이 필요하신 경우 아래 기관에 문의하실 수 있습니다.</p>
        <ul>
          <li>개인정보보호위원회: <a href="https://www.privacy.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.privacy.go.kr</a> / 국번없이 182</li>
          <li>한국인터넷진흥원(KISA): <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">privacy.kisa.or.kr</a> / 국번없이 118</li>
        </ul>
      </Section>

      <Section title="10. 개인정보처리방침 변경">
        <p>이 개인정보처리방침은 2026년 6월 1일부터 시행됩니다. 내용 변경 시 서비스 내 공지사항을 통해 사전 안내합니다.</p>
      </Section>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">{title}</h2>
      <div className="text-sm text-gray-700 space-y-2 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1">{children}</div>
    </section>
  )
}

function SubTitle({ children }: { children: React.ReactNode }) {
  return <p className="font-medium text-gray-800 mt-2">{children}</p>
}