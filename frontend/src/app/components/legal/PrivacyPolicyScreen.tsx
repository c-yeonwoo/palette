/**
 * 개인정보 처리방침 (Privacy Policy)
 *
 * 앱스토어 심사 의무 문서.
 *  · Apple — App Store Review Guideline 5.1.1
 *  · Google Play — Data Safety form 의 근거 문서
 *  · 한국 개인정보보호법 + 정보통신망법
 *
 * 운영용 정식 본문은 법무 검토 후 ./drafts/privacy.md → 이 컴포넌트 동기화.
 * 베타 단계는 핵심 항목만 명시 (수집·이용·보유·제3자 제공·이용자 권리).
 */
import { ArrowLeft } from "lucide-react";

interface PrivacyPolicyScreenProps {
  onBack: () => void;
}

const SECTIONS: Array<{ title: string; body: string }> = [
  {
    title: "1. 수집하는 개인정보 항목",
    body:
      "회원가입·서비스 이용 과정에서 다음 정보를 수집합니다.\n" +
      "• 필수: 이메일, 비밀번호(또는 OAuth 식별자), 이름, 생년월일, 성별, 휴대폰 번호\n" +
      "• 프로필: 직업·학력·거주지·키·체형·관심사·소개글·사진(최대 6장)·영상(선택)\n" +
      "• 인터뷰 답변: AI 색깔 분석을 위한 자유 텍스트 답변\n" +
      "• 자동 수집: 접속 IP, 기기 식별자, 앱 버전, 푸시 토큰",
  },
  {
    title: "2. 개인정보 이용 목적",
    body:
      "• 회원 식별 및 본인 인증\n" +
      "• 지인 네트워크 기반 매칭 추천\n" +
      "• 부정 이용·어뷰징 탐지 및 차단\n" +
      "• 서비스 개선 및 신규 기능 개발 (집계·익명화 처리)\n" +
      "• 법령상 의무 이행 (전자상거래법, 통신비밀보호법)",
  },
  {
    title: "3. 보유 및 이용 기간",
    body:
      "• 회원 정보: 회원 탈퇴 시까지\n" +
      "• 탈퇴 후: 익명 처리 후 30일 보관 (재가입 차단·운영 통계), 이후 완전 삭제\n" +
      "• 결제·환불 기록: 5년 (전자상거래법)\n" +
      "• 부정 이용 기록: 1년 (제재 이력 관리)",
  },
  {
    title: "4. 제3자 제공",
    body:
      "원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.\n" +
      "다만 다음 경우 예외적으로 제공될 수 있습니다.\n" +
      "• 이용자가 매칭에 동의하여 상대방에게 프로필이 공개되는 경우\n" +
      "• 법령에 따른 수사기관의 적법한 요청",
  },
  {
    title: "5. 처리 위탁",
    body:
      "원활한 서비스 제공을 위해 다음 업체에 처리를 위탁합니다.\n" +
      "• AWS (Amazon Web Services): 클라우드 인프라\n" +
      "• OpenAI: AI 프로필 분석 (인터뷰 답변은 가명 처리 후 전송)\n" +
      "• Toss Payments: 결제 처리 (활성화 시)\n" +
      "• 네이버 클라우드 (NCP SENS): SMS 본인 인증\n" +
      "• Firebase Cloud Messaging: 푸시 알림",
  },
  {
    title: "6. 이용자 권리",
    body:
      "이용자는 언제든 본인 정보의 열람·수정·삭제·처리정지를 요청할 수 있습니다.\n" +
      "• 앱 내: 마이페이지 > 프로필 수정 / 회원 탈퇴\n" +
      "• 이메일: privacy@palette.kr\n" +
      "탈퇴 요청 시 30일 내 모든 식별 정보가 익명화됩니다.",
  },
  {
    title: "7. 개인정보 보호 책임자",
    body:
      "이메일: privacy@palette.kr\n" +
      "(베타 단계 — 정식 출시 시 사업자 정보로 갱신)",
  },
  {
    title: "8. 고지의 의무",
    body:
      "방침의 내용을 변경할 경우 시행 7일 전 앱 공지사항으로 알려드립니다.\n" +
      "이용자에게 불리한 변경의 경우 30일 전 고지합니다.",
  },
];

export function PrivacyPolicyScreen({ onBack }: PrivacyPolicyScreenProps) {
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
          <h1 className="text-base font-semibold">개인정보 처리방침</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        <p className="text-xs text-muted-foreground">
          시행일자: 2026-06-08 (v1.0.0 · 베타)
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
            본 방침은 베타 운영을 위한 초안이며, 정식 출시 전 법무 검토를 거쳐 갱신됩니다.
            중요한 변경은 푸시·이메일로 별도 안내합니다.
          </p>
        </div>
      </main>
    </div>
  );
}
