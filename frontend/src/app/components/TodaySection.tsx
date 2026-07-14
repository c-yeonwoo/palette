/**
 * TodaySection — 홈 ‘오늘’ 리텐션
 * 일일 질문(칩) + 스트릭 + 소량 물감 보상. 지인망과 무관하게 매일 올 이유.
 */
import { useEffect, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Chip } from "./ui/chip";
import { Button } from "./ui/button";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface DailyQuestion {
  id: string;
  text: string;
  hint: string | null;
  chips: string[];
}

interface DailyTodayResponse {
  date: string;
  question: DailyQuestion;
  answered: boolean;
  myAnswer: string | null;
  streakDays: number;
  bonusGranted: number;
  bonusPointsOnComplete: number;
}

interface TodaySectionProps {
  onAnswered?: () => void;
  onGoToPick?: () => void;
}

export function TodaySection({ onAnswered, onGoToPick }: TodaySectionProps) {
  const [data, setData] = useState<DailyTodayResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.get<DailyTodayResponse>("/api/v1/daily/today")
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { if (!cancelled) setData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const submit = async (answer: string) => {
    if (!data || submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post<DailyTodayResponse>("/api/v1/daily/answer", {
        questionId: data.question.id,
        answer,
      });
      setData(res);
      if (res.bonusGranted > 0) {
        toast.success(`오늘의 답변 완료 · 물감 +${res.bonusGranted}`);
      } else {
        toast.success("오늘의 답변을 기록했어요");
      }
      onAnswered?.();
    } catch {
      toast.error("답변 저장에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-5 mt-4 rounded-2xl border border-border bg-card px-4 py-5 flex items-center justify-center">
        <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="mx-5 mt-4 rounded-2xl border border-border bg-card overflow-hidden shadow-card">
      <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-strong" />
            <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-strong">오늘</p>
            {data.streakDays > 0 && (
              <span className="text-[11px] text-muted-foreground">
                · {data.streakDays}일째 이어가는 중
              </span>
            )}
          </div>
          <h2 className="text-[15px] font-bold text-foreground leading-snug">
            {data.question.text}
          </h2>
          {data.question.hint && !data.answered && (
            <p className="text-xs text-muted-foreground mt-1">{data.question.hint}</p>
          )}
        </div>
      </div>

      <div className="px-4 pb-4">
        {data.answered ? (
          <div className="space-y-3">
            <div className="rounded-xl bg-muted/50 px-3.5 py-3">
              <p className="text-xs text-muted-foreground mb-0.5">오늘의 나</p>
              <p className="text-sm font-medium text-foreground">{data.myAnswer}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              팔레트가 당신을 조금 더 알아갔어요
              {data.bonusPointsOnComplete > 0 ? ` · 완료 시 물감 +${data.bonusPointsOnComplete}` : ""}
            </p>
            {onGoToPick && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onGoToPick}
              >
                팔리의 추천 보러 가기
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {data.question.chips.map((chip) => (
                <Chip
                  key={chip}
                  asButton
                  selected={selected === chip}
                  onClick={() => setSelected(chip)}
                  size="md"
                >
                  {chip}
                </Chip>
              ))}
            </div>
            <Button
              className="w-full h-11"
              disabled={!selected || submitting}
              onClick={() => selected && submit(selected)}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                `답하고 물감 +${data.bonusPointsOnComplete}`
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
