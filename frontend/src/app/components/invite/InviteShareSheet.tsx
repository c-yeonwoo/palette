/**
 * InviteShareSheet — F12 초대 공유 옵션 바텀시트
 *
 * 옵션:
 *   - 링크 복사
 *   - Web Share API
 *   - 카카오 공유 (placeholder)
 *   - 인스타 스토리 (placeholder)
 */
import { Copy, Share2, X as XIcon } from "lucide-react";
import { toast } from "sonner";
import { buildInviteLink, recordShare, checkDailyShareLimit } from "../../../lib/invite-code";
import { cn } from "../ui/utils";

interface InviteShareSheetProps {
  code: string;
  myName?: string;
  myColorType?: string;
  onClose: () => void;
}

export function InviteShareSheet({
  code,
  myName = "친구",
  myColorType = "orange",
  onClose,
}: InviteShareSheetProps) {
  const link = buildInviteLink(code);

  const { allowed } = checkDailyShareLimit();

  const shareMessage = `${myName}님이 당신을 떠올렸어요 💌\n"당신의 색이 궁금해요" — 팔레트에서 컬러 타입 진단을 해보세요!\n${link}`;

  const handleCopy = async () => {
    if (!allowed) {
      toast.error("오늘 공유 한도에 도달했어요 (하루 10회)");
      return;
    }
    try {
      await navigator.clipboard.writeText(link);
      recordShare();
      toast.success("초대 링크가 복사됐어요!");
      onClose();
    } catch {
      toast.error("복사에 실패했어요");
    }
  };

  const handleWebShare = async () => {
    if (!allowed) {
      toast.error("오늘 공유 한도에 도달했어요 (하루 10회)");
      return;
    }
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${myName}님이 당신을 떠올렸어요`,
          text: shareMessage,
          url: link,
        });
        recordShare();
        onClose();
      } catch (e) {
        // 사용자가 취소한 경우
      }
    } else {
      handleCopy();
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
        aria-hidden
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-3xl shadow-overlay pb-safe"
        style={{ animation: "slideUp 0.25s ease-out" }}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-pill bg-border-subtle" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-3">
          <p className="text-body font-semibold text-text-primary">친구에게 공유하기</p>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-sunken"
          >
            <XIcon className="w-4 h-4 text-text-tertiary" />
          </button>
        </div>

        {/* 초대 코드 */}
        <div className="mx-5 mb-4 bg-surface-sunken rounded-xl px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-caption text-text-tertiary">내 초대 코드</p>
            <p className="text-title font-bold text-text-primary tracking-widest">{code}</p>
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand text-brand-foreground text-caption font-medium rounded-lg"
          >
            <Copy className="w-3.5 h-3.5" />
            복사
          </button>
        </div>

        {/* 공유 옵션 */}
        <div className="px-6 pb-8 grid grid-cols-2 gap-3">
          {[
            { label: "링크 복사", emoji: "🔗", onClick: handleCopy },
            { label: "공유하기", emoji: "📤", onClick: handleWebShare },
          ].map(({ label, emoji, onClick }) => (
            <button
              key={label}
              onClick={onClick}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-14 h-14 rounded-2xl bg-surface shadow-card flex items-center justify-center text-2xl">
                {emoji}
              </div>
              <span className="text-caption text-text-secondary">{label}</span>
            </button>
          ))}
        </div>

        <style>{`@keyframes slideUp { from { transform:translateY(100%); } to { transform:translateY(0); } }`}</style>
      </div>
    </>
  );
}
