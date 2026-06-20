import { useState } from "react";
import { Button } from "./ui/button";
import { Clock, ShieldCheck, RefreshCw, AlertCircle } from "lucide-react";
import { authService } from "../../lib/auth/authService";
import { toast } from "sonner";

/**
 * 운영자 승인 게이팅 (ADR 0054).
 * 프로필 완성 후 status=PENDING_APPROVAL 이면 이 화면만 노출 (피드·매칭 전면 차단).
 * REJECTED 면 사유 + 프로필 보완(재제출) 안내.
 */
export function PendingApprovalScreen({
  status,
  reason,
  onRefresh,
  onResubmit,
  onLogout,
}: {
  status: "PENDING_APPROVAL" | "REJECTED" | string;
  reason?: string | null;
  onRefresh: () => Promise<void> | void;
  onResubmit: () => void;
}) {
  const [checking, setChecking] = useState(false);
  const isRejected = status === "REJECTED";

  const handleRefresh = async () => {
    setChecking(true);
    try {
      await onRefresh();
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-10 text-center">
      <div className="max-w-sm w-full space-y-6">
        <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center ${isRejected ? "bg-amber-100" : "bg-brand-soft"}`}>
          {isRejected ? <AlertCircle className="w-8 h-8 text-amber-600" /> : <Clock className="w-8 h-8 text-brand-strong" />}
        </div>

        {isRejected ? (
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">프로필 보완이 필요해요</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              제출하신 프로필·사진을 검토한 결과 보완이 필요해요.<br />아래 사유를 확인하고 다시 제출해주세요.
            </p>
            {reason && (
              <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                <p className="text-[11px] font-semibold text-amber-700 mb-0.5">반려 사유</p>
                <p className="text-sm text-amber-900 leading-relaxed">{reason}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-foreground">프로필 심사 중이에요</h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              신뢰할 수 있는 만남을 위해 운영자가 프로필과 사진을 확인하고 있어요.<br />
              승인되면 바로 알려드릴게요. 보통 하루 이내에 완료돼요.
            </p>
          </div>
        )}

        {/* 신뢰 안내 */}
        <div className="rounded-xl bg-muted/40 px-4 py-3 flex items-start gap-2 text-left">
          <ShieldCheck className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            팔레트는 모든 프로필을 사람이 직접 검토해 신뢰도를 지켜요. 조금만 기다려주세요.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {isRejected ? (
            <Button onClick={onResubmit} className="w-full h-12 bg-brand-soft text-brand-strong">
              프로필 보완하러 가기
            </Button>
          ) : (
            <Button onClick={handleRefresh} disabled={checking} className="w-full h-12 bg-brand-soft text-brand-strong">
              <RefreshCw className={`w-4 h-4 mr-2 ${checking ? "animate-spin" : ""}`} />
              승인 상태 새로고침
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
