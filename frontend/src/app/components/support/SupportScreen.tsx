/**
 * 인앱 문의 · 고객지원 (디자인 검토 P2-9).
 *
 * App Store 심사 및 신뢰 관점에서 앱 내부에 지원 창구가 필요.
 * 이메일 문의 + 자주 묻는 질문 + 신고/차단 안내 + 정책 링크(선택).
 */
import { ChevronLeft, Mail, HelpCircle, ShieldAlert, Clock } from "lucide-react";

const SUPPORT_EMAIL = "support@palette.ai.kr";

interface SupportScreenProps {
  onBack: () => void;
  onNavigateTerms?: () => void;
  onNavigatePrivacy?: () => void;
}

const FAQ: { q: string; a: string }[] = [
  { q: "소개 요청은 어떻게 하나요?", a: "마음에 드는 상대의 프로필에서 ‘소개 요청하기’를 누르면, 공통 지인(주선자)이 확인한 뒤 상대에게 전달돼요. 두 분이 모두 수락하면 연락처가 교환됩니다." },
  { q: "물감은 어디에 쓰이나요?", a: "친구의 친구 프로필 열람, 소개 요청 등에 사용되는 앱 내 재화예요. 잔액과 사용처는 홈 상단과 마이페이지 ‘물감·충전’에서 확인할 수 있어요." },
  { q: "주선자에게 돈을 보내달라고 해요.", a: "팔레트의 주선은 무료 호의 활동이라 어떤 금전 요구도 정책 위반이에요. 절대 송금하지 마시고, 해당 프로필의 ⋯ 메뉴에서 ‘외부 송금 유도’로 신고해주세요." },
  { q: "인증번호가 오지 않아요.", a: "통신 상태를 확인한 뒤 재요청해주세요. 계속 문제가 있으면 아래 이메일로 가입하신 휴대폰 번호와 함께 문의해주세요." },
];

export function SupportScreen({ onBack, onNavigateTerms, onNavigatePrivacy }: SupportScreenProps) {
  return (
    <div className="min-h-screen bg-background pb-16">
      {/* 헤더 */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center">
          <button onClick={onBack} className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center hover:bg-muted/50" aria-label="뒤로">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold ml-1">문의 · 고객지원</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-5 space-y-6">
        {/* 이메일 문의 */}
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          className="block bg-card rounded-2xl border border-border/60 shadow-card p-4 hover:bg-muted/40 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-brand-soft flex items-center justify-center flex-shrink-0">
              <Mail className="w-5 h-5 text-brand-strong" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">이메일로 문의하기</p>
              <p className="text-sm text-muted-foreground truncate">{SUPPORT_EMAIL}</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" /> 평일 10:00–19:00 확인 · 보통 1영업일 내 답변
          </div>
        </a>

        {/* 신고·차단 안내 */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-brand-strong" />
            <h2 className="text-sm font-semibold">불쾌한 상대를 만났다면</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            상대 프로필 우측 상단 <span className="font-medium text-foreground">⋯ 메뉴</span>에서 <span className="font-medium text-foreground">신고·차단</span>할 수 있어요.
            차단하면 서로의 피드·추천·매칭에서 완전히 제외됩니다. 부적절한 이용은 무관용 원칙으로 24시간 내 조치돼요.
          </p>
        </div>

        {/* FAQ */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <HelpCircle className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">자주 묻는 질문</h2>
          </div>
          <div className="bg-card rounded-2xl border border-border/60 shadow-card divide-y divide-border">
            {FAQ.map((item, i) => (
              <details key={i} className="group px-4 py-3">
                <summary className="flex items-center gap-2 cursor-pointer list-none text-sm font-medium text-foreground">
                  <span className="flex-1">{item.q}</span>
                  <ChevronLeft className="w-4 h-4 text-muted-foreground -rotate-90 group-open:rotate-[270deg] transition-transform" />
                </summary>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </details>
            ))}
          </div>
        </div>

        {/* 정책 링크 */}
        {(onNavigateTerms || onNavigatePrivacy) && (
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            {onNavigateTerms && <button onClick={onNavigateTerms} className="underline hover:text-foreground">이용약관</button>}
            {onNavigateTerms && onNavigatePrivacy && <span aria-hidden>·</span>}
            {onNavigatePrivacy && <button onClick={onNavigatePrivacy} className="underline hover:text-foreground">개인정보 처리방침</button>}
          </div>
        )}
      </div>
    </div>
  );
}
