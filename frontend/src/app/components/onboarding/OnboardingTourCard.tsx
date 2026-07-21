/**
 * OnboardingTourCard — Wave A 베타 미션 체크리스트.
 *
 * 단계: 오늘 질문 → 지인 1명 → 프로필 둘러보기 → 소개 요청 → 피드백
 * dismiss 시 localStorage 에 저장 → 영구 숨김.
 */
import { useState, useEffect } from "react";
import { CheckCircle2, Circle, X, ChevronRight, Sparkles } from "lucide-react";

const DISMISS_KEY = "palette:onboarding:tour:dismissed:v2";
const FEEDBACK_DONE_KEY = "palette:onboarding:feedback:done:v1";

interface OnboardingTourCardProps {
  hasAnsweredToday: boolean;
  hasFriends: boolean;
  hasViewedProfile: boolean;
  hasSentMatchRequest: boolean;
  onNavigateToFriends?: () => void;
  onGoToToday?: () => void;
  onGoToPick?: () => void;
}

export function OnboardingTourCard({
  hasAnsweredToday,
  hasFriends,
  hasViewedProfile,
  hasSentMatchRequest,
  onNavigateToFriends,
  onGoToToday,
  onGoToPick,
}: OnboardingTourCardProps) {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return localStorage.getItem(DISMISS_KEY) === "1"; } catch { return false; }
  });
  const [feedbackDone, setFeedbackDone] = useState<boolean>(() => {
    try { return localStorage.getItem(FEEDBACK_DONE_KEY) === "1"; } catch { return false; }
  });
  const [collapsed, setCollapsed] = useState(false);

  const markFeedback = () => {
    try { localStorage.setItem(FEEDBACK_DONE_KEY, "1"); } catch { /* ignore */ }
    setFeedbackDone(true);
    window.open("https://www.instagram.com/palette.kr", "_blank", "noopener,noreferrer");
  };

  const steps = [
    {
      label: "오늘의 질문 답하기",
      desc: "홈 상단 ‘오늘’에서 하루 한 번 답해보세요",
      done: hasAnsweredToday,
      onClick: onGoToToday,
    },
    {
      label: "지인 1명 연결하기",
      desc: "친구 코드 공유 또는 검색으로 시작하세요",
      done: hasFriends,
      onClick: onNavigateToFriends,
    },
    {
      label: "추천·지인 프로필 둘러보기",
      desc: "팔리 Pick 또는 친구의 친구를 열어보세요",
      done: hasViewedProfile,
      onClick: onGoToPick,
    },
    {
      label: "소개 요청 보내기",
      desc: "공통 지인·팔리를 통해 자연스럽게 이어져요",
      done: hasSentMatchRequest,
    },
    {
      label: "짧은 피드백 남기기",
      desc: "막힌 곳·좋은 점을 @palette.kr 로 알려주세요",
      done: feedbackDone,
      onClick: markFeedback,
    },
  ];

  const completedCount = steps.filter(s => s.done).length;
  const allDone = completedCount === steps.length;

  useEffect(() => {
    if (allDone && !dismissed) {
      try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
      setDismissed(true);
    }
  }, [allDone, dismissed]);

  if (dismissed) return null;

  const handleDismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
    setDismissed(true);
  };

  return (
    <section className="max-w-2xl mx-auto px-5 pt-3">
      <div className="relative rounded-2xl border border-primary/20 bg-gradient-to-br from-brand-soft/60 to-brand-soft/20 p-4 shadow-card">
        <div className="flex items-start gap-2.5 mb-3">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4.5 h-4.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground">베타 미션 · Wave A</h3>
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

        <div className="w-full h-1.5 bg-muted/60 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${(completedCount / steps.length) * 100}%` }}
          />
        </div>

        {!collapsed && (
          <ul className="space-y-1.5">
            {steps.map((step, i) => {
              const Icon = step.done ? CheckCircle2 : Circle;
              const interactive = !step.done && !!step.onClick;
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
