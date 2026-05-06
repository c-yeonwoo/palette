/**
 * ShareSheet — 컬러 타입 결과 공유 바텀시트
 *
 * 3가지 공유 방법을 제공합니다:
 * 1. 카드 이미지 저장 (placeholder toast — html-to-image 미설치)
 * 2. 링크 복사 (navigator.clipboard)
 * 3. 시스템 공유 (Web Share API)
 *
 * @example
 * <ShareSheet
 *   open={shareOpen}
 *   onClose={() => setShareOpen(false)}
 *   colorType="orange"
 * />
 */

import { Download, Link2, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "../ui/utils";
import { getColorTypeMeta } from "../../../lib/colorTypes";
import { COLOR_TYPE_DESCRIPTIONS } from "../../../lib/color-test/descriptions";
import type { ColorTypeKey } from "../../../lib/colorTypes";

interface ShareSheetProps {
  /** 시트 열림 여부 */
  open: boolean;
  /** 닫기 콜백 */
  onClose: () => void;
  /** 공유할 컬러 타입 */
  colorType: ColorTypeKey;
  /** 사용자 ID (공유 URL에 포함, 선택) */
  userId?: string;
}

/**
 * 공유 바텀시트 컴포넌트
 *
 * - 배경 딤 레이어 클릭 시 닫힘
 * - 슬라이드 업 애니메이션
 * - 이미지 저장 / 링크 복사 / Web Share API 버튼
 */
export function ShareSheet({
  open,
  onClose,
  colorType,
  userId,
}: ShareSheetProps) {
  const meta = getColorTypeMeta(colorType);
  const desc = COLOR_TYPE_DESCRIPTIONS[colorType];

  const shareUrl = userId
    ? `https://palette.app/color/${colorType}?ref=${userId}`
    : `https://palette.app/color/${colorType}`;

  const shareTitle = `나는 ${desc.title}! — Palette 컬러 타입 진단`;
  const shareText = `${desc.subtitle}. 나의 컬러를 확인해보세요!`;

  /** 이미지 저장 (html-to-image 미설치 → placeholder) */
  const handleSaveImage = () => {
    toast.info("이미지 저장 기능은 곧 업데이트될 예정입니다 🎨", {
      description: "지금은 링크 복사 또는 공유하기를 이용해주세요.",
    });
  };

  /** 링크 복사 */
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("링크가 복사되었어요!", {
        description: "친구에게 공유해보세요.",
      });
      onClose();
    } catch {
      toast.error("복사에 실패했어요", {
        description: "URL을 직접 복사해주세요.",
      });
    }
  };

  /** Web Share API */
  const handleWebShare = async () => {
    if (!navigator.share) {
      // 미지원 브라우저 폴백: 링크 복사
      await handleCopyLink();
      return;
    }

    try {
      await navigator.share({
        title: shareTitle,
        text: shareText,
        url: shareUrl,
      });
      onClose();
    } catch (err) {
      // 사용자가 취소한 경우 에러 무시
      if (err instanceof Error && err.name !== "AbortError") {
        toast.error("공유에 실패했어요");
      }
    }
  };

  if (!open) return null;

  const hslBase = `hsl(${meta.h} ${meta.s}% ${meta.l}%)`;

  return (
    <>
      {/* 딤 레이어 */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden
      />

      {/* 바텀시트 */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50",
          "bg-surface rounded-t-2xl shadow-overlay",
          "animate-in slide-in-from-bottom duration-300",
          // 최대 너비 모바일 제한
          "max-w-lg mx-auto",
        )}
        role="dialog"
        aria-modal="true"
        aria-label="공유하기"
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-border-subtle" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-2.5">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-caption font-bold"
              style={{ backgroundColor: hslBase }}
              aria-hidden
            >
              {meta.label[0]}
            </div>
            <div>
              <p className="text-body font-semibold text-text-primary">
                {desc.title}
              </p>
              <p className="text-caption text-text-tertiary">{desc.subtitle}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-tertiary hover:text-text-primary hover:bg-surface-sunken transition-default"
            aria-label="닫기"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* 공유 버튼 목록 */}
        <div className="px-4 pb-8 space-y-2 pt-1">
          {/* 이미지 저장 */}
          <button
            type="button"
            onClick={handleSaveImage}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-4 rounded-xl",
              "bg-surface shadow-hairline border border-border-subtle",
              "hover:bg-surface-sunken transition-default text-left",
            )}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: `hsl(${meta.h} ${meta.s}% 92%)`,
              }}
            >
              <Download
                className="size-5"
                style={{ color: `hsl(${meta.h} ${meta.s}% 35%)` }}
              />
            </div>
            <div>
              <p className="text-body font-semibold text-text-primary">
                카드 이미지 저장
              </p>
              <p className="text-caption text-text-tertiary">
                결과 카드를 사진으로 저장해요
              </p>
            </div>
          </button>

          {/* 링크 복사 */}
          <button
            type="button"
            onClick={handleCopyLink}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-4 rounded-xl",
              "bg-surface shadow-hairline border border-border-subtle",
              "hover:bg-surface-sunken transition-default text-left",
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center">
              <Link2 className="size-5 text-text-secondary" />
            </div>
            <div>
              <p className="text-body font-semibold text-text-primary">
                링크 복사
              </p>
              <p className="text-caption text-text-tertiary">
                친구에게 링크를 보내요
              </p>
            </div>
          </button>

          {/* 공유하기 */}
          <button
            type="button"
            onClick={handleWebShare}
            className={cn(
              "w-full flex items-center gap-4 px-4 py-4 rounded-xl",
              "bg-surface shadow-hairline border border-border-subtle",
              "hover:bg-surface-sunken transition-default text-left",
            )}
          >
            <div className="w-10 h-10 rounded-xl bg-surface-sunken flex items-center justify-center">
              <Share2 className="size-5 text-text-secondary" />
            </div>
            <div>
              <p className="text-body font-semibold text-text-primary">
                공유하기
              </p>
              <p className="text-caption text-text-tertiary">
                카카오톡, 인스타그램 등으로 공유해요
              </p>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}
