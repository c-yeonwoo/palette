/**
 * SafetyMenu — F03 더보기 메뉴 (신고 / 차단 / 공유 안 함)
 * 프로필 페이지·매칭 페이지 우상단 MoreVertical 버튼에 붙임
 */
import { useState } from "react";
import { MoreVertical, Flag, Ban, EyeOff, Share2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ReportSheet } from "./ReportSheet";
import { BlockConfirmDialog } from "./BlockConfirmDialog";

interface SafetyMenuProps {
  targetName: string;
  targetType?: "user" | "matchmaker";
  onBlock?: () => void;
  onHide?: () => void;
}

export function SafetyMenu({ targetName, targetType = "user", onBlock, onHide }: SafetyMenuProps) {
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-sunken transition-colors"
            aria-label="더보기 메뉴"
          >
            <MoreVertical className="w-4.5 h-4.5 text-text-secondary" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {onHide && (
            <DropdownMenuItem onClick={onHide} className="gap-2">
              <EyeOff className="w-4 h-4 text-text-tertiary" />
              피드에서 숨기기
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setReportOpen(true)}
            className="gap-2 text-state-warning focus:text-state-warning"
          >
            <Flag className="w-4 h-4" />
            신고하기
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setBlockOpen(true)}
            className="gap-2 text-destructive focus:text-destructive"
          >
            <Ban className="w-4 h-4" />
            차단하기
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ReportSheet
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        targetName={targetName}
        targetType={targetType}
        onBlockToo={() => setBlockOpen(true)}
      />

      <BlockConfirmDialog
        open={blockOpen}
        onClose={() => setBlockOpen(false)}
        targetName={targetName}
        onConfirm={() => onBlock?.()}
      />
    </>
  );
}
