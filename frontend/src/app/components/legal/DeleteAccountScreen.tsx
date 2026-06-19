/**
 * 회원 탈퇴 — 앱스토어 심사 의무 기능.
 *  · Apple Review Guideline 5.1.1(v) — 2022.6 부터 모든 앱 필수
 *  · Google Play — 2024.5 부터 강화
 *
 * 흐름: 확인 문구 입력 → DELETE /api/v1/users/me → 토큰 제거 → 로그인 화면
 */
import { useState } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api/apiClient";
import { tokenStorage } from "@/lib/auth/tokenStorage";

interface DeleteAccountScreenProps {
  onBack: () => void;
  onCompleted: () => void;
}

const CONFIRM_PHRASE = "탈퇴합니다";

const REASONS = [
  "원하는 사람을 만나지 못해서",
  "지인이 너무 적어서",
  "프로필 작성이 부담스러워서",
  "사용 빈도가 낮아서",
  "개인정보가 걱정돼서",
  "기타",
] as const;

export function DeleteAccountScreen({ onBack, onCompleted }: DeleteAccountScreenProps) {
  const [confirmation, setConfirmation] = useState("");
  const [reason, setReason] = useState<string>("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [agree, setAgree] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    confirmation.trim() === CONFIRM_PHRASE && agree && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setIsSubmitting(true);
    try {
      const fullReason = reasonDetail.trim()
        ? `${reason}: ${reasonDetail.trim()}`
        : reason;
      await api.delete<{ deleted: boolean; message: string }>("/api/v1/users/me", {
        body: JSON.stringify({ confirmation, reason: fullReason || undefined }),
      });
      tokenStorage.clearTokens();
      toast.success("탈퇴가 완료되었어요");
      onCompleted();
    } catch (e) {
      toast.error("탈퇴 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h1 className="text-base font-semibold">회원 탈퇴</h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {/* 경고 */}
        <div className="rounded-xl bg-destructive/5 border border-destructive/20 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-sm space-y-2 leading-relaxed">
            <p className="font-medium text-foreground">탈퇴 시 다음 정보가 영구 삭제됩니다</p>
            <ul className="text-muted-foreground list-disc pl-4 space-y-0.5">
              <li>프로필, 사진, 인터뷰 답변, AI 분석 결과</li>
              <li>지인 관계, 매칭 이력, 받은 소개</li>
              <li>주선자 활동 기록 및 등급</li>
            </ul>
            <p className="text-muted-foreground">
              결제·환불 기록은 전자상거래법에 따라 5년 보관됩니다 (개인 식별자는 즉시 익명화).
            </p>
            <p className="text-foreground font-medium">탈퇴 후 30일간 동일 이메일/전화번호로 재가입할 수 없어요.</p>
          </div>
        </div>

        {/* 탈퇴 사유 */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">탈퇴 사유 (선택)</h2>
          <p className="text-xs text-muted-foreground">서비스 개선에 큰 도움이 됩니다.</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(reason === r ? "" : r)}
                className={
                  "px-3 py-1.5 rounded-full text-xs border transition-colors " +
                  (reason === r
                    ? "bg-foreground text-background border-foreground"
                    : "bg-card text-foreground border-border hover:border-foreground/30")
                }
              >
                {r}
              </button>
            ))}
          </div>
          {reason === "기타" && (
            <textarea
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value.slice(0, 200))}
              placeholder="자유롭게 적어주세요"
              rows={3}
              className="mt-2 w-full rounded-lg border border-border bg-card p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
            />
          )}
        </section>

        {/* 동의 */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">동의 사항</h2>
          <label className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/40 border border-border cursor-pointer">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-0.5"
            />
            <span className="text-sm text-foreground leading-relaxed">
              위 안내를 모두 읽었으며, 탈퇴로 인한 데이터 삭제 및 30일 재가입 제한에 동의합니다.
            </span>
          </label>
        </section>

        {/* 확인 문구 */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">
            확인 문구 입력 — “<span className="text-destructive">{CONFIRM_PHRASE}</span>”
          </h2>
          <input
            type="text"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder={CONFIRM_PHRASE}
            className="w-full rounded-lg border border-border bg-card p-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            autoComplete="off"
          />
        </section>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className={
            "w-full h-12 rounded-xl text-sm font-semibold transition-colors " +
            (canSubmit
              ? "bg-destructive text-destructive-foreground hover:opacity-90"
              : "bg-muted text-muted-foreground cursor-not-allowed")
          }
        >
          {isSubmitting ? "처리 중…" : "탈퇴하기"}
        </button>
      </main>
    </div>
  );
}
