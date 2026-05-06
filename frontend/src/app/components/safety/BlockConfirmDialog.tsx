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
import { toast } from "sonner";

interface BlockConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  targetName: string;
  onConfirm: () => void;
}

export function BlockConfirmDialog({ open, onClose, targetName, onConfirm }: BlockConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    toast.success(`${targetName}님을 차단했어요`, {
      description: "피드와 매칭 목록에서 제거됐어요.",
    });
    onClose();
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
          <AlertDialogCancel onClick={onClose}>취소</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            차단
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
