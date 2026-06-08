/**
 * InviteWizardScreen — 가입 직후 친구 초대 마법사 (B-005).
 *
 * 흐름: 온보딩 마지막 단계(AIProfileEnhance) 완료 → 이 화면 → mainFeed.
 *  · 신규 가입자에게만 노출 (재가입·재분석 흐름엔 X)
 *  · 스킵 가능 — "건너뛰기" 버튼으로 mainFeed 바로 진입
 *  · 친구 1명 가입 시 양쪽 열람권 1장 보너스 (B-002 와 연동)
 *
 * 기능:
 *  · 내 친구 코드 노출 + 복사
 *  · 카카오톡 / SMS / 시스템 share 공유
 *  · 카카오 친구 목록 동기화는 Phase 2 (현재는 코드 공유만)
 */
import { useEffect, useState } from "react";
import { Copy, Share2, Users, Gift, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/apiClient";

interface InviteWizardScreenProps {
  onSkip: () => void;
  onDone: () => void;
}

interface InviteCodeResponse {
  code: string;
}

function buildInviteMessage(code: string): string {
  return [
    "🎨 팔레트에서 함께 인연을 만들어요",
    "",
    "지인 네트워크 기반 데이팅 — 친구가 추천해주는 신뢰할 수 있는 만남.",
    `초대 코드: ${code}`,
    "",
    "https://palette.kr (앱 출시 후 링크 교체)",
  ].join("\n");
}

export function InviteWizardScreen({ onSkip, onDone }: InviteWizardScreenProps) {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.post<InviteCodeResponse>("/api/v1/friends/invite-code", {})
      .then((res) => setCode(res.code))
      .catch(() => toast.error("초대 코드를 불러오지 못했어요"))
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      toast.success("초대 코드가 복사되었어요");
    } catch {
      toast.error("복사에 실패했어요");
    }
  };

  const handleShare = async () => {
    if (!code) return;
    const message = buildInviteMessage(code);
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "팔레트 초대",
          text: message,
        });
        return;
      } catch {
        // 사용자 취소 — 무시
      }
    }
    // 폴백: 클립보드 복사
    try {
      await navigator.clipboard.writeText(message);
      toast.success("초대 메시지가 복사되었어요");
    } catch {
      toast.error("공유 기능을 사용할 수 없어요");
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 — 스킵 X 버튼만 */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center justify-end">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 transition-colors"
            aria-label="건너뛰기"
          >
            건너뛰기
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 flex-1 flex flex-col">
        {/* 일러스트 */}
        <div className="flex justify-center pt-4 pb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-brand-soft to-primary/15 flex items-center justify-center">
              <Users className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center ring-4 ring-background">
              <Gift className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {/* 헤드라인 */}
        <div className="text-center space-y-2 mb-6">
          <h1 className="text-xl font-bold leading-tight">
            마지막으로,<br />지인을 초대해볼까요?
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            팔레트는 지인이 추천하는 신뢰 기반 데이팅이에요.<br />
            지인이 많을수록 더 많은 인연을 만날 수 있어요.
          </p>
        </div>

        {/* 보너스 카드 */}
        <div className="rounded-2xl border border-primary/30 bg-brand-soft/40 p-4 mb-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-foreground mb-0.5">
                지인이 가입할 때마다 보상
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                초대한 지인이 가입하면 <strong className="text-primary">양쪽에 프로필 열람 티켓 1장</strong>이 지급돼요 (14일 유효).
              </p>
            </div>
          </div>
        </div>

        {/* 친구 코드 박스 */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4 mb-5">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-2">나의 초대 코드</p>
            {loading ? (
              <div className="h-9 w-32 mx-auto bg-muted animate-pulse rounded-lg" />
            ) : (
              <p className="text-3xl font-bold tracking-[0.2em] text-foreground tabular-nums">
                {code ?? "----"}
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopy}
              disabled={!code}
              className="h-11 rounded-xl border border-border bg-card hover:bg-muted text-sm font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Copy className="w-4 h-4" />
              코드 복사
            </button>
            <button
              type="button"
              onClick={handleShare}
              disabled={!code}
              className="h-11 rounded-xl bg-foreground text-background text-sm font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              공유하기
            </button>
          </div>
        </div>

        {/* SMS 보조 안내 */}
        <div className="rounded-xl bg-muted/40 border border-border p-4 flex items-start gap-2.5 mb-6">
          <MessageCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            카카오톡 / 문자 / 어떤 방법으로든 코드를 공유하면 돼요. 지인이 가입 시 코드를 입력하면 자동 연결돼요.
          </p>
        </div>

        {/* 하단 액션 */}
        <div className="mt-auto pt-4 space-y-2">
          <button
            type="button"
            onClick={onDone}
            className="w-full h-12 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            다음에 더 초대할게요
          </button>
          <button
            type="button"
            onClick={onSkip}
            className="w-full h-10 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            지금은 그만두기
          </button>
        </div>
      </main>
    </div>
  );
}
