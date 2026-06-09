/**
 * PaymentFailScreen — Toss 위젯 실패/취소 callback. PA-012.
 *
 * Toss 가 failUrl 로 리다이렉트하며 ?code=ERROR_CODE&message=... 부착.
 * 사용자 취소(USER_CANCEL / PAY_PROCESS_CANCELED) 면 침묵 + 자동 복귀.
 * 결제사 오류면 사유 노출.
 */
import { useEffect } from "react";
import { XCircle } from "lucide-react";
import { toast } from "sonner";

interface PaymentFailScreenProps {
  onDone: () => void;
}

const SILENT_CODES = new Set(["USER_CANCEL", "PAY_PROCESS_CANCELED"]);

export function PaymentFailScreen({ onDone }: PaymentFailScreenProps) {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code") ?? "";
    const message = params.get("message") ?? "결제가 완료되지 않았어요";

    if (!SILENT_CODES.has(code)) {
      toast.error(message);
    }
    // 1초 후 자동 복귀
    const t = setTimeout(onDone, 1000);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6">
      <div className="text-center space-y-4 max-w-sm">
        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mx-auto">
          <XCircle className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-base font-semibold">결제가 취소됐어요</h1>
        <p className="text-xs text-muted-foreground">잔액 화면으로 돌아갈게요</p>
      </div>
    </div>
  );
}
