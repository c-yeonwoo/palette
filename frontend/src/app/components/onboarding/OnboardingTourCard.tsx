/**
 * OnboardingTourCard — 신규 가입자가 메인 피드 첫 진입 시 1회 노출. O-001.
 *
 * 4단계 체크리스트:
 *  1) 친구 추가
 *  2) 친구의 친구 둘러보기
 *  3) 소개 요청 보내기
 *  4) 나의 색 분석 확인
 *
 * dismiss 시 localStorage 에 저장 → 영구 숨김.
 * 가입 후 2주가 지났거나 모든 단계 완료 시 자동 숨김(향후).
 */
import { useState, useEffect } from "react";
import { CheckCircle2, Circle, X, ChevronRight, Sparkles } from "lucide-react";

const DISMISS_KEY = "palette:onboarding:tour:dismissed:v1";

interface OnboardingTourCardProps {
  hasFriends: boolean;          // 친구 1명 이상
  hasViewedProfile: boolean;     // 친친 프로필 1회 이상 열람
  hasSentMatchRequest: boolean;  // 소개 요청 1회 이상 보냄
  hasColorAnalysis: boolean;     // AI 색 분석 완료
  onNavigateToFriends?: () => void;
  onNavigateToMyPage?: () => void;
}

export function OnboardingTourCard({
  hasFriends,
  hasViewedProfile,
  hasSentMatchRequest,
  hasColorAnalysis,
  onNavigateToFriends,
  onNavigateToMyPage,
}: OnboardingTourCardProps) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });
  const [collapsed, setCollapsed] = useState(false);

  const steps = [
    {
      label: "지인 추가",
      desc: "친구 코드 공유 또는 검색으로 시작하세요",
      done: hasFriends,
      onClick: onNavigateToFriends,
    },
    {
      label: "친구의 친구 둘러보기",
      desc: "지인 네트워크 안에서 신뢰할 수 있는 인연을 만나요",
      done: hasViewedProfile,
    },
    {
      label: "소개 요청 보내기",
      desc: "공통 지인을 통해 자연스럽게 이어져요",
      done: hasSentMatchRequest,
    },
    {
      label: "나의 색 확인하기",
      desc: "AI 가 분석한 당신의 성향과 어울리는 인연 유추",
      done: hasColorAnalysis,
      onClick: onNavigateToMyPage,
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;

  // 모든 단계 완료 시 자동 dismiss
  useEffect(() => {
    if (allDone && !dismissed) {
      try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
      setDismissed(true);
    }
  }, [allDone, dismissed]);

  if (dismissed) return null;

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
    setDismissed(true);
  };

  return (
    <section className="max-w-2xl mx-auto px-5 pt-3">
      <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-brand-soft/60 to-brand-soft/20 p-4 shadow-card">
        {/* 상단 — 헤더 + dismiss/collapse */}
        <div className="flex items-start gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">팔레트 시작하기</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {completedCount}/{steps.length} 단계 완료
            </p>
          </div>
          <button
            onClick={() => setCollapsed(c => !c)}
            className="p-1 -m-1 rounded-md hover:bg-muted/60 transition-colors"
            aria-label={collapsed ? "펼치기" : "접기"}
          >
            <ChevronRight className={
              "w-4 h-4 text-muted-foreground transition-transform " + (collapsed ? "" : "rotate-90")
            } />
          </button>
          <button
            onClick={handleDismiss}
            className="p-1 -m-1 rounded-md hover:bg-muted/60 transition-colors"
            aria-label="안내 닫기"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* 진척도 바 */}
        <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>

        {/* 단계 목록 */}
        {!collapsed && (
          <ul className="space-y-1.5">
            {steps.map((step, i) => {
              const Icon = step.done ? CheckCircle2 : Circle;
              const interactive = !step.done && step.onClick;
              return (
                <li key={i}>
                  <button
                    type="button"
                    onClick={interactive ? step.onClick : undefined}
                    disabled={!interactive}
                    className={
                      "w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors " +
                      (interactive ? "hover:bg-card/60 active:bg-card cursor-pointer" : "cursor-default")
                    }
                  >
                    <Icon className={
                      "w-4 h-4 flex-shrink-0 mt-0.5 " +
                      (step.done ? "text-primary" : "text-muted-foreground")
                    } />
                    <div className="flex-1 min-w-0">
                      <div className={
                        "text-xs font-semibold " +
                        (step.done ? "text-muted-foreground line-through" : "text-foreground")
                      }>
                        {step.label}
                      </div>
                      {!step.done && (
                        <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                          {step.desc}
                        </div>
                      )}
                    </div>
                    {interactive && (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0 mt-1" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
