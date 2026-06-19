/**
 * 서비스 이용약관 (Terms of Service)
 *
 * 앱스토어 심사 필수 문서. 데이팅 앱 17+ 등급 명시.
 * 베타 단계 — 정식 출시 전 법무 검토.
 */
import { ArrowLeft } from "lucide-react";

interface TermsOfServiceScreenProps {
  onBack: () => void;
}

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: "제1조 (목적)",
    body:
      "본 약관은 팔레트(이하 “서비스”)가 제공하는 지인 네트워크 기반 소개·만남 서비스의 " +
      "이용 조건 및 절차, 회원과 운영자의 권리·의무를 정함을 목적으로 합니다.",
  },
  {
    title: "제2조 (이용 자격)",
    body:
      "• 만 19세 이상의 자연인만 가입할 수 있습니다.\n" +
      "• 본 서비스는 성인을 대상으로 한 데이팅·매칭 서비스로 17+ 등급에 해당합니다.\n" +
      "• 본인 명의 휴대폰 인증을 통과한 경우에만 핵심 기능을 사용할 수 있습니다.",
  },
  {
    title: "제3조 (회원의 의무)",
    body:
      "회원은 다음 행위를 해서는 안 됩니다.\n" +
      "• 타인의 정보를 도용하거나 허위 정보 등록\n" +
      "• 상업적 광고·홍보, 영리 목적 영업\n" +
      "• 다른 회원에 대한 모욕·괴롭힘·성희롱·스토킹\n" +
      "• 미성년자 대상 매칭 시도\n" +
      "• 약물·성매매·불법 거래 등 위법 행위\n" +
      "• 서비스 외부 채널(연락처·SNS)을 매칭 전 강요\n" +
      "위반 시 사전 통지 없이 이용 정지 또는 영구 차단될 수 있습니다.",
  },
  {
    title: "제4조 (콘텐츠 신고·차단)",
    body:
      "• 부적절한 사용자·콘텐츠는 프로필 상세 페이지에서 신고할 수 있습니다.\n" +
      "• 신고 접수 시 24시간 내 검토하며, 명백한 위반은 즉시 조치합니다.\n" +
      "• 차단된 사용자와는 매칭 추천에서 영구적으로 분리됩니다 (양방향).\n" +
      "• 신고 누적 시 자동·수동 검토를 통한 계정 제재가 이뤄집니다.",
  },
  {
    title: "제5조 (결제 및 환불)",
    body:
      "• 베타 단계엔 모든 기능이 무료입니다.\n" +
      "• 정식 결제 활성화 시 인앱 결제(IAP)로 처리됩니다.\n" +
      "• 결제 후 환불 정책은 별도 “환불 안내” 문서를 따릅니다 (앱 내 동일 위치 게시).\n" +
      "• 미사용 잔액 환불은 결제 시점 기준 7일 내 신청해야 합니다.",
  },
  {
    title: "제6조 (주선자 의무 · 금전 요구 금지)",
    body:
      "• 주선은 금전적 대가 없이 지인을 이어주는 호의 활동입니다. 주선자는 플랫폼으로부터 어떠한 금전적 보상도 받지 않습니다.\n" +
      "• 주선자는 사용자에게 계좌이체·간편송금·현금 등 앱 내외를 불문하고 어떤 형태의 금전도 요구하거나 유도해서는 안 됩니다.\n" +
      "• 위반 적발 시 주선자 등급·성사 기록 초기화 및 계정 이용 제한(영구 정지 및 동일 명의/디바이스 재가입 차단 포함)이 적용될 수 있습니다.\n" +
      "• 금전 요구·유도 행위는 앱 내 “신고하기” → “외부 송금 유도” 카테고리로 신고할 수 있습니다.",
  },
  {
    title: "제7조 (계정 탈퇴)",
    body:
      "• 회원은 마이페이지에서 언제든 탈퇴할 수 있습니다.\n" +
      "• 탈퇴 시 식별 정보는 즉시 익명 처리되며, 익명 데이터는 30일 보관 후 완전 삭제됩니다.\n" +
      "• 다음 정보는 관련 법령에 따라 보관됩니다:\n" +
      "  – 결제·환불 기록: 5년 (전자상거래법)\n" +
      "  – 부정 이용 기록: 1년",
  },
  {
    title: "제8조 (서비스 변경·중단)",
    body:
      "운영상·기술상 필요한 경우 사전 공지 후 서비스 일부를 변경하거나 중단할 수 있습니다. " +
      "유료 서비스 중단 시 잔여 이용권은 환불 또는 동등 가치로 보상합니다.",
  },
  {
    title: "제9조 (면책)",
    body:
      "• 천재지변, 디도스 공격 등 불가항력 사유에 따른 서비스 중단은 운영자가 책임지지 않습니다.\n" +
      "• 회원 간 만남에서 발생하는 분쟁·피해에 대해 운영자는 중재할 수는 있으나 법적 책임을 지지 않습니다.\n" +
      "  단, 운영자의 명백한 고의·중과실이 입증된 경우 손해 배상 청구가 가능합니다.",
  },
  {
    title: "제10조 (분쟁 해결)",
    body:
      "본 약관에 관한 분쟁은 운영자 소재지 관할 법원에서 처리합니다. " +
      "이용자는 한국소비자원, 전자거래분쟁조정위원회에 조정을 신청할 수도 있습니다.",
  },
];

export function TermsOfServiceScreen({ onBack }: TermsOfServiceScreenProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 -ml-1.5 rounded-full hover:bg-muted/50 transition-colors"
            aria-label="뒤로"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">이용약관</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        <p className="text-xs text-muted-foreground">
          시행일자: 2026-06-08 (v1.0.0 · 베타) · 만 19세 이상 / 17+ 등급
        </p>
        {SECTIONS.map((s) => (
          <section key={s.title} className="space-y-2">
            <h2 className="text-sm font-semibold text-foreground">{s.title}</h2>
            <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
              {s.body}
            </p>
          </section>
        ))}
        <div className="rounded-xl bg-muted/40 border border-border p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            본 약관은 베타 운영을 위한 초안이며, 정식 출시 전 법무 검토를 거쳐 갱신됩니다.
          </p>
        </div>
      </main>
    </div>
  );
}
