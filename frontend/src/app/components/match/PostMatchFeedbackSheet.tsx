import { useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "../ui/button";
import { api } from "../../../lib/api/apiClient";

/**
 * 만남 후 주선자에게 사적 후기 (ADR 0050).
 *
 * 상대방에겐 절대 노출 X — 오직 주선자(+운영자)만. 한 매칭당 1회.
 * 부드러운 3택 + 자유 메시지 + 재만남 의향.
 */
interface PostMatchFeedbackSheetProps {
  requestId: string;
  matchmakerName?: string;
  onClose: () => void;
  onSubmitted: () => void;
}

type Met = "MET" | "NOT_MET" | "SCHEDULED";
type Sentiment = "GOOD" | "NEUTRAL" | "DISAPPOINTING";

const MET_OPTIONS: { value: Met; label: string; emoji: string }[] = [
  { value: "MET", label: "만났어요", emoji: "☕" },
  { value: "SCHEDULED", label: "만날 예정", emoji: "📅" },
  { value: "NOT_MET", label: "안 만났어요", emoji: "🙅" },
];

const SENTIMENT_OPTIONS: { value: Sentiment; label: string; emoji: string }[] = [
  { value: "GOOD", label: "좋았어요", emoji: "😊" },
  { value: "NEUTRAL", label: "보통이에요", emoji: "🙂" },
  { value: "DISAPPOINTING", label: "아쉬웠어요", emoji: "😕" },
];

export function PostMatchFeedbackSheet({ requestId, matchmakerName, onClose, onSubmitted }: PostMatchFeedbackSheetProps) {
  const [met, setMet] = useState<Met | null>(null);
  const [sentiment, setSentiment] = useState<Sentiment | null>(null);
  const [message, setMessage] = useState("");
  const [wantAgain, setWantAgain] = useState<boolean | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!met) return toast.error("만남 여부를 선택해주세요");
    if (!sentiment) return toast.error("어떠셨는지 선택해주세요");
    setSubmitting(true);
    try {
      await api.post(`/api/v1/relationships/${requestId}/feedback`, {
        metStatus: met,
        sentiment,
        message: message.trim() || undefined,
        wantToMeetAgain: wantAgain === true,
      });
      toast.success("후기가 주선자님께 전달됐어요 🙏");
      onSubmitted();
      onClose();
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "";
      if (msg.includes("이미")) toast.error("이미 후기를 남기셨어요");
      else toast.error("후기 전송에 실패했어요");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={onClose}>
      <div
        className="bg-background w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-background/95 backdrop-blur px-6 py-4 border-b border-border flex items-center justify-between">
          <h3 className="font-bold text-foreground">주선자에게 후기 남기기</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div className="rounded-xl bg-brand-soft/60 px-4 py-3">
            <p className="text-xs text-foreground/80 leading-relaxed">
              🔒 이 후기는 <strong>{matchmakerName ? `${matchmakerName}님(주선자)` : "주선자님"}</strong> 께만 전달돼요.
              상대방에게는 절대 보이지 않으니 솔직하게 남겨주세요.
            </p>
          </div>

          {/* 만남 여부 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">만나보셨어요?</p>
            <div className="grid grid-cols-3 gap-2">
              {MET_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setMet(o.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs transition-colors ${
                    met === o.value ? "border-foreground bg-foreground/5 font-semibold" : "border-border bg-muted/30"
                  }`}
                >
                  <span className="text-lg">{o.emoji}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* 만족도 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">어떠셨어요?</p>
            <div className="grid grid-cols-3 gap-2">
              {SENTIMENT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  onClick={() => setSentiment(o.value)}
                  className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-xs transition-colors ${
                    sentiment === o.value ? "border-foreground bg-foreground/5 font-semibold" : "border-border bg-muted/30"
                  }`}
                >
                  <span className="text-lg">{o.emoji}</span>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* 재만남 의향 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">다시 만나고 싶으세요?</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { v: true, label: "네, 좋아요" },
                { v: false, label: "아니요" },
              ].map((o) => (
                <button
                  key={String(o.v)}
                  onClick={() => setWantAgain(o.v)}
                  className={`rounded-xl border px-3 py-2.5 text-sm transition-colors ${
                    wantAgain === o.v ? "border-foreground bg-foreground/5 font-semibold" : "border-border bg-muted/30"
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* 자유 메시지 */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">주선자님께 한마디 <span className="text-xs font-normal text-muted-foreground">(선택)</span></p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="감사 인사나 솔직한 후기를 남겨주세요"
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-foreground/40"
            />
          </div>

          <Button className="w-full h-12 font-bold" disabled={submitting} onClick={submit}>
            {submitting ? "전송 중..." : "후기 보내기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
