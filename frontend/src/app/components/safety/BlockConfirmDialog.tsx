/**
 * BlockConfirmDialog — F03 차단 확인 다이얼로그
 */
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";

interface BlockConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  targetName: string;
  /** 차단 확정 — 백엔드 호출 포함. 실패 시 throw 하면 에러 토스트만 띄움. */
  onConfirm: () => void | Promise<void>;
}

export function BlockConfirmDialog({ open, onClose, targetName, onConfirm }: BlockConfirmDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      toast.success(`${targetName}님을 차단했어요`, {
        description: "피드와 매칭 목록에서 제거됐어요.",
      });
      onClose();
    } catch (e) {
      console.error("차단 실패:", e);
      toast.error("차단에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{targetName}님을 차단하시겠어요?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-left">
              <p>차단하면 다음과 같이 됩니다:</p>
              <ul className="space-y-1 list-disc list-inside text-sm">
                <li>이 분이 피드와 매칭 목록에서 사라져요</li>
                <li>상대방에게는 "더 이상 활동하지 않아요"로 표시돼요</li>
                <li>마이페이지 &gt; 설정 &gt; 차단 목록에서 해제할 수 있어요</li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={loading}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => { e.preventDefault(); handleConfirm(); }}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? "차단 중..." : "차단"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
