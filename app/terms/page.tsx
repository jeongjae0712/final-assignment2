import Link from 'next/link'

export const metadata = {
  title: '이용약관 | CBNU 매칭',
}

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-10 space-y-8">
      <div>
        <Link href="/" className="text-sm text-blue-600 hover:underline">← 홈으로</Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">이용약관</h1>
        <p className="mt-1 text-sm text-gray-500">시행일: 2026년 6월 1일</p>
      </div>

      <Section title="제1조 (목적)">
        <p>이 약관은 CBNU 매칭(이하 "서비스")이 제공하는 충북대학교 공모전·스포츠 매칭 플랫폼 서비스의 이용 조건 및 절차, 회원과 서비스 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.</p>
      </Section>

      <Section title="제2조 (정의)">
        <ul>
          <li><strong>"서비스"</strong>란 CBNU 매칭이 제공하는 웹 애플리케이션 및 관련 제반 서비스를 의미합니다.</li>
          <li><strong>"회원"</strong>이란 이 약관에 동의하고 서비스를 이용하는 충북대학교 재학생을 의미합니다.</li>
          <li><strong>"매칭"</strong>이란 회원 간 공모전 팀원 모집 또는 스포츠 파트너 연결을 의미합니다.</li>
          <li><strong>"게시물"</strong>이란 회원이 서비스 내에 작성하는 매칭 모집글, 채팅 메시지, 프로필 정보 등을 의미합니다.</li>
        </ul>
      </Section>

      <Section title="제3조 (약관의 효력 및 변경)">
        <p>이 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 효력이 있습니다. 약관을 변경하는 경우 서비스 내 공지를 통해 사전 안내하며, 변경 후 계속하여 서비스를 이용하는 경우 변경 약관에 동의한 것으로 간주합니다.</p>
      </Section>

      <Section title="제4조 (서비스 이용 자격)">
        <p>서비스는 <strong>충북대학교 재학생</strong>만 이용할 수 있습니다. 회원가입 시 정확한 학번을 입력하여야 하며, 허위 정보 등록 시 서비스 이용이 제한될 수 있습니다.</p>
      </Section>

      <Section title="제5조 (회원가입 및 탈퇴)">
        <ul>
          <li>회원가입은 약관 동의 후 소정의 가입 양식을 작성하여 신청합니다.</li>
          <li>서비스는 가입 신청에 대해 특별한 사유가 없는 한 이를 승낙합니다.</li>
          <li>회원 탈퇴는 서비스 내 탈퇴 기능을 통해 가능하며, 탈퇴 즉시 개인정보 및 관련 데이터가 삭제됩니다.</li>
        </ul>
      </Section>

      <Section title="제6조 (개인정보 보호)">
        <p>서비스는 이용자의 개인정보를 <Link href="/privacy" className="text-blue-600 hover:underline">개인정보처리방침</Link>에 따라 보호합니다. 개인정보처리방침은 이 약관의 일부를 구성합니다.</p>
      </Section>

      <Section title="제7조 (서비스 제공 및 변경)">
        <ul>
          <li>서비스는 연중무휴, 24시간 제공을 원칙으로 합니다. 단, 시스템 점검·장애·천재지변 등의 경우 일시적으로 서비스가 중단될 수 있습니다.</li>
          <li>서비스는 사전 고지 없이 서비스의 내용을 변경하거나 중단할 수 있습니다.</li>
        </ul>
      </Section>

      <Section title="제8조 (회원의 의무)">
        <p>회원은 다음 행위를 하여서는 안 됩니다.</p>
        <ul>
          <li>타인의 학번 또는 정보를 도용하는 행위</li>
          <li>허위 정보를 등록하거나 타인을 기만하는 행위</li>
          <li>서비스를 이용하여 영리 목적의 광고, 스팸을 전송하는 행위</li>
          <li>타 회원에게 불쾌감, 위협감을 주는 언어 사용</li>
          <li>서비스의 정상적 운영을 방해하는 행위</li>
          <li>관계 법령을 위반하는 행위</li>
        </ul>
        <p>위 행위 적발 시 사전 통보 없이 서비스 이용이 제한될 수 있습니다.</p>
      </Section>

      <Section title="제9조 (게시물 관리)">
        <ul>
          <li>회원이 작성한 게시물의 저작권은 해당 회원에게 있습니다.</li>
          <li>회원은 서비스에 게시물을 게재함으로써 서비스에 게시물을 서비스 운영 목적으로 사용할 수 있는 비독점적 라이선스를 부여합니다.</li>
          <li>서비스는 법령 위반, 타인의 권리 침해, 미풍양속 위반 게시물을 사전 통보 없이 삭제할 수 있습니다.</li>
        </ul>
      </Section>

      <Section title="제10조 (책임 제한)">
        <ul>
          <li>서비스는 회원 간의 매칭 결과 및 실제 만남에서 발생하는 문제에 대해 책임을 지지 않습니다.</li>
          <li>서비스는 회원이 게재한 정보의 진실성을 보장하지 않습니다.</li>
          <li>서비스는 천재지변, 서비스 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.</li>
        </ul>
      </Section>

      <Section title="제11조 (분쟁 해결)">
        <p>서비스 이용과 관련하여 분쟁이 발생한 경우, 서비스와 회원은 원만한 해결을 위해 성실히 협의합니다. 협의가 이루어지지 않을 경우, 대한민국 법령에 따라 관할 법원에서 분쟁을 해결합니다.</p>
      </Section>

      <Section title="제12조 (준거법)">
        <p>이 약관은 대한민국 법령에 따라 해석됩니다.</p>
      </Section>

      <div className="pt-4 border-t border-gray-200 text-sm text-gray-500">
        <p>부칙: 이 약관은 2026년 6월 1일부터 시행합니다.</p>
      </div>
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