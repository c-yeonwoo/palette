/**
 * MatchmakerInsights — F09 주선자 대시보드용 성사율·만족도 인사이트
 *
 * - 매칭별 양측 후기 요약
 * - 성사율 / 평균 만족도 집계
 * - 가로 막대 (긍정/보통/부정 분포)
 */
import { Trophy, TrendingUp, Users } from "lucide-react";
import { cn } from "../ui/utils";
import {
  OVERALL_META,
  type MeetFeedback,
  type OverallRating,
} from "../../../lib/feedback";

interface MatchmakerInsightsProps {
  feedbacks?: MeetFeedback[];
}

export function MatchmakerInsights({
  feedbacks = [],
}: MatchmakerInsightsProps) {
  const total = feedbacks.length;
  if (total === 0) {
    return (
      <div className="bg-surface shadow-card rounded-2xl p-5 text-center text-text-tertiary">
        <p className="text-body-sm">아직 후기가 없어요</p>
      </div>
    );
  }

  const counts: Record<OverallRating, number> = { good: 0, okay: 0, bad: 0 };
  for (const fb of feedbacks) counts[fb.overall]++;

  const satisfactionRate = Math.round((counts.good / total) * 100);

  const bars: { rating: OverallRating; pct: number; color: string }[] = [
    { rating: "good", pct: Math.round((counts.good / total) * 100), color: "hsl(var(--state-success))" },
    { rating: "okay", pct: Math.round((counts.okay / total) * 100), color: "hsl(var(--text-tertiary))" },
    { rating: "bad",  pct: Math.round((counts.bad  / total) * 100), color: "hsl(var(--state-danger))" },
  ];

  return (
    <div className="bg-surface shadow-card rounded-2xl p-5 space-y-5">
      <h3 className="text-body font-semibold text-text-primary">인사이트</h3>

      {/* 스탯 */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users} label="총 후기" value={`${total}건`} />
        <StatCard
          icon={TrendingUp}
          label="만족도"
          value={`${satisfactionRate}%`}
          valueColor="hsl(var(--state-success))"
        />
        <StatCard
          icon={Trophy}
          label="추천 키워드"
          value={topKeyword(feedbacks)}
        />
      </div>

      {/* 분포 막대 */}
      <div className="space-y-2">
        {bars.map(({ rating, pct, color }) => (
          <div key={rating} className="flex items-center gap-3">
            <span className="text-caption w-8">{OVERALL_META[rating].emoji}</span>
            <div className="flex-1 h-2 bg-surface-sunken rounded-pill overflow-hidden">
              <div
                className="h-full rounded-pill transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-caption text-text-tertiary w-8 text-right">
              {pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="bg-surface-sunken rounded-xl p-3 flex flex-col items-center gap-1">
      <Icon className="w-4 h-4 text-text-tertiary" />
      <p className="text-body font-bold text-text-primary" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </p>
      <p className="text-caption text-text-tertiary">{label}</p>
    </div>
  );
}

function topKeyword(feedbacks: MeetFeedback[]): string {
  const freq: Record<string, number> = {};
  for (const fb of feedbacks) {
    for (const kw of fb.keywords) {
      freq[kw] = (freq[kw] ?? 0) + 1;
    }
  }
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
  if (!top) return "—";
  const labels: Record<string, string> = {
    punctual: "시간 약속", kind: "친절함", good_talker: "대화", photo_match: "사진",
    respectful: "매너", fun: "유쾌함", attentive: "배려심", honest: "솔직함",
  };
  return labels[top[0]] ?? top[0];
}
