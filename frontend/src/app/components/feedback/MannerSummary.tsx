/**
 * MannerSummary — F09 마이페이지용 받은 키워드 누적 시각화
 *
 * - 키워드 칩 빈도 (내림차순)
 * - 매너 점수 바
 * - 매너 인증 뱃지 표시
 * - 부정 키워드는 본인만 보임 (회색 처리)
 */
import { Shield, ShieldCheck } from "lucide-react";
import { cn } from "../ui/utils";
import {
  KEYWORD_META,
  POSITIVE_KEYWORDS,
  NEGATIVE_KEYWORDS,
  calcMannerScore,
  hasMannerBadge,
  type MeetFeedback,
} from "../../../lib/feedback";

interface MannerSummaryProps {
  feedbacks?: MeetFeedback[];
  isSelf?: boolean; // 본인 뷰 (true) → 부정 키워드도 보여줌
}

export function MannerSummary({
  feedbacks = [],
  isSelf = true,
}: MannerSummaryProps) {
  const score = calcMannerScore(feedbacks);
  const badge = hasMannerBadge(feedbacks);

  // 키워드 빈도 집계
  const freq: Record<string, number> = {};
  for (const fb of feedbacks) {
    for (const kw of fb.keywords) {
      freq[kw] = (freq[kw] ?? 0) + 1;
    }
  }

  const positiveEntries = POSITIVE_KEYWORDS.map((m) => ({
    ...m,
    count: freq[m.key] ?? 0,
  }))
    .filter((m) => m.count > 0)
    .sort((a, b) => b.count - a.count);

  const negativeEntries = isSelf
    ? NEGATIVE_KEYWORDS.map((m) => ({
        ...m,
        count: freq[m.key] ?? 0,
      }))
        .filter((m) => m.count > 0)
        .sort((a, b) => b.count - a.count)
    : [];

  const scoreColor =
    score >= 80 ? "hsl(var(--state-success))"
    : score >= 60 ? "hsl(var(--brand))"
    : "hsl(var(--state-danger))";

  if (feedbacks.length === 0) {
    return (
      <div className="bg-surface shadow-card rounded-2xl p-5 text-center text-text-tertiary">
        <p className="text-body-sm">아직 받은 후기가 없어요</p>
        <p className="text-caption mt-1">첫 만남을 응원해요 🎈</p>
      </div>
    );
  }

  return (
    <div className="bg-surface shadow-card rounded-2xl p-5 space-y-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-body font-semibold text-text-primary">매너 점수</h3>
        {badge && (
          <div className="flex items-center gap-1 text-caption font-medium text-[hsl(var(--state-success))]">
            <ShieldCheck className="w-4 h-4" />
            매너 인증
          </div>
        )}
      </div>

      {/* 점수 바 */}
      <div>
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-caption text-text-secondary">종합</span>
          <span className="text-title font-bold" style={{ color: scoreColor }}>
            {score}점
          </span>
        </div>
        <div className="h-2.5 bg-surface-sunken rounded-pill overflow-hidden">
          <div
            className="h-full rounded-pill transition-all duration-700"
            style={{ width: `${score}%`, backgroundColor: scoreColor }}
          />
        </div>
        <p className="text-caption text-text-tertiary mt-1">
          후기 {feedbacks.length}건 기준
        </p>
      </div>

      {/* 긍정 키워드 */}
      {positiveEntries.length > 0 && (
        <div>
          <p className="text-caption font-semibold text-text-secondary mb-2">받은 칭찬</p>
          <div className="flex flex-wrap gap-2">
            {positiveEntries.map(({ key, label, emoji, count }) => (
              <div
                key={key}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[hsl(var(--state-success)/0.08)] text-[hsl(var(--state-success))]"
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-caption font-medium">{label}</span>
                <span className="text-[10px] font-bold bg-[hsl(var(--state-success)/0.15)] px-1.5 py-0.5 rounded-pill">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 부정 키워드 (본인만) */}
      {isSelf && negativeEntries.length > 0 && (
        <div>
          <p className="text-caption font-semibold text-text-tertiary mb-2">
            개선 힌트 <span className="font-normal">(나만 볼 수 있어요)</span>
          </p>
          <div className="flex flex-wrap gap-2">
            {negativeEntries.map(({ key, label, emoji, count }) => (
              <div
                key={key}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-sunken text-text-tertiary"
              >
                <span className="text-sm">{emoji}</span>
                <span className="text-caption font-medium">{label}</span>
                <span className="text-[10px] font-bold bg-border-subtle px-1.5 py-0.5 rounded-pill">
                  {count}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
