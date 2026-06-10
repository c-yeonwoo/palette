/**
 * PaymentSuccessScreen — Toss 결제 위젯 성공 callback. PA-012.
 *
 * 흐름:
 *  1) Toss 위젯이 successUrl 로 리다이렉트하며 URL 에
 *     ?paymentKey&orderId&amount&kind&quantity 부착
 *  2) 이 화면이 마운트되면 즉시 백엔드 confirm 호출
 *  3) 성공 → BillingScreen 으로 복귀 + 토스트 ("티켓 충전 완료")
 *  4) 실패 → 에러 토스트 + BillingScreen 복귀
 *
 * 멱등성: 백엔드가 동일 paymentKey 재요청 시 ALREADY_PROCESSED 반환 — 새로고침 안전.
 */
import { useEffect, useRef, useState } from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { api } from "@/lib/api/apiClient";
import { parseTossSuccessUrl } from "@/lib/billing/tossPayment";
import { toast } from "sonner";

interface PaymentSuccessScreenProps {
  onDone: () => void;
}

interface ConfirmResponse {
  status: string;
  transactionId?: string;
  points?: number;        // 새 단일 잔액 모델 (ADR 0042)
  credited?: number;      // 이번에 적립된 물감 (Paint)
  error?: string;
  reason?: string;
}

export function PaymentSuccessScreen({ onDone }: PaymentSuccessScreenProps) {
  const [phase, setPhase] = useState<"verifying" | "success" | "failed">("verifying");
  const [message, setMessage] = useState<string>("결제 확인 중...");
  // 새로고침·이중 마운트로 confirm 두 번 호출되는 것 차단 (백엔드 멱등도 있으나 UX 깔끔)
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    const params = parseTossSuccessUrl(window.location.search);
    if (!params) {
      setPhase("failed");
      setMessage("결제 정보를 확인할 수 없어요");
      return;
    }

    (async () => {
      try {
        const result = await api.post<ConfirmResponse>("/api/v1/billing/checkout/confirm", {
          // ADR 0042 — 단일 잔액 모델
          // BillingScreen 이 OrderRequest 의 quantity 필드에 pointsCredited 를 박아 보냄
          pointsCredited: params.quantity,
          expectedAmount: params.amount,
          paymentKey: params.paymentKey,
          orderId: params.orderId,
        });
        if (result.status === "OK") {
          setPhase("success");
          setMessage(`물감 ${(result.credited ?? params.quantity).toLocaleString("ko-KR")} 충전이 완료됐어요`);
        } else if (result.status === "ALREADY_PROCESSED") {
          setPhase("success");
          setMessage("이미 처리된 결제예요");
        } else {
          setPhase("failed");
          setMessage(result.reason ?? result.error ?? "결제 검증에 실패했어요");
        }
      } catch (e: any) {
        setPhase("failed");
        const reason = e?.response?.data?.reason ?? e?.response?.data?.error ?? e?.message;
        setMessage(reason ?? "결제 검증 중 오류가 발생했어요");
      } finally {
        // 결과 보여주고 1.5초 뒤 자동 복귀
        setTimeout(() => {
          if (phase === "failed") {
            toast.error(message);
          } else {
            toast.success("티켓 충전 완료");
          }
          onDone();
        }, 1500);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="text-center space-y-4 max-w-sm">
        {phase === "verifying" && (
          <>
            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
            <h1 className="text-base font-semibold">{message}</h1>
            <p className="text-xs text-muted-foreground">잠시만 기다려주세요</p>
          </>
        )}
        {phase === "success" && (
          <>
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-base font-bold">{message}</h1>
            <p className="text-xs text-muted-foreground">잔액 화면으로 돌아갈게요</p>
          </>
        )}
        {phase === "failed" && (
          <>
            <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h1 className="text-base font-bold">결제 처리 실패</h1>
            <p className="text-xs text-muted-foreground">{message}</p>
            <p className="text-[11px] text-muted-foreground/60">결제가 완료됐는데 화면이 멈췄다면 잠시 후 잔액 확인 후 운영자에 문의해주세요</p>
          </>
        )}
      </div>
    </div>
  );
}
