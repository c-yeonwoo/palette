/**
 * FeedbackSheet — F09 만남 후기 3단계 Progressive Bottom Sheet
 *
 * Step 1: 전반적 평가 (좋음 / 보통 / 별로)
 * Step 2: 키워드 선택 (긍정 다중 / 부정 1개)
 * Step 3: 자유 코멘트 (선택)
 *
 * 강제 X — 각 단계 "건너뛰기" 항상 노출
 */
import { useState } from "react";
import { X as XIcon, ChevronRight } from "lucide-react";
import { cn } from "../ui/utils";
import { Button } from "../ui/button";
import { KeywordPicker } from "./KeywordPicker";
import {
  OVERALL_META,
  type OverallRating,
  type MannerKeyword,
  type MeetFeedback,
} from "../../../lib/feedback";
import { toast } from "sonner";

interface FeedbackSheetProps {
  matchId: string;
  revieweeId: string;
  revieweeName: string;
  onSubmit: (feedback: Omit<MeetFeedback, "id" | "reviewerId" | "createdAt">) => void;
  onClose: () => void;
}

export function FeedbackSheet({
  matchId,
  revieweeId,
  revieweeName,
  onSubmit,
  onClose,
}: FeedbackSheetProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [overall, setOverall] = useState<OverallRating | null>(null);
  const [keywords, setKeywords] = useState<MannerKeyword[]>([]);
  const [comment, setComment] = useState("");

  const TOTAL_STEPS = 3;

  const handleSubmit = () => {
    onSubmit({
      matchId,
      revieweeId,
      overall: overall ?? "okay",
      keywords,
      comment: comment.trim() || undefined,
    });
    toast.success("후기가 제출됐어요. 감사해요 ✨");
    onClose();
  };

  return (
    <>
      {/* 딤 레이어 */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden
      />

      {/* 시트 */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-overlay"
        style={{ animation: "slideUp 0.25s ease-out" }}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-pill bg-border-subtle" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="space-y-0.5">
            <p className="text-body font-semibold text-text-primary">
              {revieweeName}님과의 만남 후기
            </p>
            <div className="flex items-center gap-1">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 rounded-pill transition-all duration-300",
                    i < step ? "bg-brand" : "bg-border-subtle",
                    i === step - 1 ? "w-6" : "w-3",
                  )}
                />
              ))}
              <span className="text-caption text-text-tertiary ml-1">
                {step}/{TOTAL_STEPS}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-sunken"
          >
            <XIcon className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="px-6 pb-8">
          {/* Step 1 — 전반적 평가 */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-body font-semibold text-text-primary">
                만남이 어떠셨나요?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {(["good", "okay", "bad"] as OverallRating[]).map((rating) => {
                  const meta = OVERALL_META[rating];
                  const active = overall === rating;
                  return (
                    <button
                      key={rating}
                      onClick={() => setOverall(rating)}
                      className={cn(
                        "flex flex-col items-center gap-2 py-4 rounded-2xl border-2 transition-all",
                        active
                          ? "border-brand bg-[hsl(var(--brand)/0.06)]"
                          : "border-border-subtle bg-surface hover:bg-surface-sunken",
                      )}
                    >
                      <span className="text-2xl">{meta.emoji}</span>
                      <span
                        className={cn(
                          "text-caption font-medium",
                          active ? "text-brand" : "text-text-secondary",
                        )}
                      >
                        {rating === "good" ? "좋음" : rating === "okay" ? "보통" : "별로"}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 text-body-sm text-text-tertiary"
                >
                  건너뛰기
                </button>
                <Button
                  variant="brand"
                  className="flex-1"
                  disabled={!overall}
                  onClick={() => setStep(2)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}

          {/* Step 2 — 키워드 */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-body font-semibold text-text-primary">
                어떤 점이 인상 깊으셨나요?
              </p>
              <KeywordPicker selected={keywords} onChange={setKeywords} />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 py-3 text-body-sm text-text-tertiary"
                >
                  건너뛰기
                </button>
                <Button
                  variant="brand"
                  className="flex-1"
                  onClick={() => setStep(3)}
                >
                  다음
                </Button>
              </div>
            </div>
          )}

          {/* Step 3 — 코멘트 */}
          {step === 3 && (
            <div className="space-y-4">
              <p className="text-body font-semibold text-text-primary">
                한 마디 남겨주세요{" "}
                <span className="text-text-tertiary font-normal">(선택)</span>
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="솔직한 후기가 서로에게 도움이 돼요. 주선자에게만 전달돼요."
                maxLength={200}
                rows={4}
                className="w-full px-4 py-3 bg-surface-sunken rounded-xl text-body-sm text-text-primary placeholder:text-text-tertiary outline-none focus:ring-1 focus:ring-brand/40 resize-none"
              />
              <p className="text-caption text-text-tertiary text-right -mt-2">
                {comment.length}/200
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-3 text-body-sm text-text-tertiary"
                >
                  건너뛰기
                </button>
                <Button
                  variant="brand"
                  className="flex-1"
                  onClick={handleSubmit}
                >
                  제출하기
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
