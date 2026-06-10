/**
 * ReportSheet — F03 신고 바텀시트
 */
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../ui/sheet";
import { Button } from "../ui/button";
import { Chip } from "../ui/chip";
import { Textarea } from "../ui/textarea";
import { Checkbox } from "../ui/checkbox";
import { Label } from "../ui/label";
import { toast } from "sonner";

export type ReportReason =
  | "fake_profile"
  | "inappropriate_photo"
  | "abusive_language"
  | "commercial"
  | "minor_suspected"
  | "external_payment_inducement"  // ADR 0046 — 주선자가 외부 송금 유도
  | "etc";

const REASON_LABELS: Record<ReportReason, string> = {
  fake_profile:                "가짜 프로필 / 사진 도용",
  inappropriate_photo:         "부적절한 사진",
  abusive_language:            "욕설·비매너 대화",
  commercial:                  "상업적 목적 (홍보, 종교, 다단계)",
  minor_suspected:             "미성년자 의심",
  external_payment_inducement: "외부 송금 유도 (주선자)",  // ADR 0046 — 확정 시 +50 물감 보상
  etc:                         "기타",
};

interface ReportSheetProps {
  open: boolean;
  onClose: () => void;
  targetName: string;
  targetType?: "user" | "matchmaker" | "message";
  /** 신고 후 차단도 함께 처리 */
  onBlockToo?: () => void;
}

export function ReportSheet({
  open,
  onClose,
  targetName,
  targetType = "user",
  onBlockToo,
}: ReportSheetProps) {
  const [reason, setReason] = useState<ReportReason | "">("");
  const [detail, setDetail] = useState("");
  const [blockAlso, setBlockAlso] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800)); // mock
    setLoading(false);
    if (blockAlso && onBlockToo) onBlockToo();
    toast.success("신고가 접수됐어요", {
      description: "24시간 내 검토 후 조치 결과를 알려드릴게요.",
    });
    setReason("");
    setDetail("");
    setBlockAlso(false);
    onClose();
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="px-6 pt-2 pb-4 border-b border-border-subtle">
          <SheetTitle className="text-body font-semibold text-text-primary text-left">
            {targetName}님 신고
          </SheetTitle>
        </SheetHeader>

        <div className="px-6 py-5 space-y-5">
          {/* 사유 선택 */}
          <div>
            <p className="text-body-sm font-semibold text-text-primary mb-3">신고 사유를 선택해주세요</p>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(REASON_LABELS) as ReportReason[]).map((r) => (
                <Chip
                  key={r}
                  asButton
                  selected={reason === r}
                  onClick={() => setReason(r)}
                  size="md"
                >
                  {REASON_LABELS[r]}
                </Chip>
              ))}
            </div>
          </div>

          {/* 추가 설명 */}
          <div>
            <p className="text-body-sm font-semibold text-text-primary mb-2">
              추가 설명 <span className="text-text-tertiary font-normal">(선택)</span>
            </p>
            <Textarea
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              placeholder="구체적인 상황을 알려주시면 빠른 처리에 도움이 돼요"
              className="bg-surface border-border-subtle resize-none"
              rows={3}
            />
          </div>

          {/* 차단 체크박스 */}
          {onBlockToo && (
            <div className="flex items-center gap-2 py-1">
              <Checkbox
                id="block-also"
                checked={blockAlso}
                onCheckedChange={(c) => setBlockAlso(!!c)}
              />
              <Label htmlFor="block-also" className="text-body-sm text-text-primary cursor-pointer">
                신고와 함께 차단하기
              </Label>
            </div>
          )}

          <p className="text-caption text-text-tertiary">
            허위 신고는 제재를 받을 수 있어요. 신고 내용은 검토 목적으로만 사용됩니다.
          </p>
        </div>

        <div className="px-6 pb-8 pt-2 border-t border-border-subtle">
          <Button
            variant="brand"
            size="lg"
            className="w-full"
            onClick={handleSubmit}
            disabled={!reason || loading}
          >
            {loading ? "처리 중..." : "신고 접수"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
