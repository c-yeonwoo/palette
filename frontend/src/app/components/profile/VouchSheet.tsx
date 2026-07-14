/**
 * VouchSheet — 친구 보증 (L0 원탭 / L1 칩 / L2 optional 한마디)
 * ReportSheet 패턴 재사용. 칩·문장 모두 옵셔널.
 */
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "../ui/sheet";
import { Button } from "../ui/button";
import { Chip } from "../ui/chip";
import { Textarea } from "../ui/textarea";
import { toast } from "sonner";
import { api } from "../../../lib/api/apiClient";
import { VOUCH_PRESETS, type VouchResponse } from "../../../lib/vouchPresets";
import { Loader2 } from "lucide-react";

interface VouchSheetProps {
  open: boolean;
  onClose: () => void;
  targetName: string;
  targetUserId: string;
  /** 이미 보증한 경우 수정 모드 */
  initialPresetKey?: string | null;
  initialMessage?: string | null;
  onSuccess: (res: VouchResponse) => void;
}

export function VouchSheet({
  open,
  onClose,
  targetName,
  targetUserId,
  initialPresetKey,
  initialMessage,
  onSuccess,
}: VouchSheetProps) {
  const [presetKey, setPresetKey] = useState<string | null>(initialPresetKey ?? null);
  const [message, setMessage] = useState(initialMessage ?? "");
  const [loading, setLoading] = useState(false);

  const resetAndClose = () => {
    setPresetKey(initialPresetKey ?? null);
    setMessage(initialMessage ?? "");
    onClose();
  };

  const submit = async (withDetails: boolean) => {
    setLoading(true);
    try {
      const body = withDetails
        ? {
            presetKey: presetKey || null,
            message: message.trim() || null,
          }
        : {};
      const res = await api.post<VouchResponse>(`/api/v1/vouch/${targetUserId}`, body);
      onSuccess(res);
      toast.success(withDetails && (presetKey || message.trim())
        ? "보증을 남겼어요"
        : "보증했어요");
      onClose();
    } catch (e: unknown) {
      const status = (e as { status?: number })?.status;
      if (status === 403) {
        toast.error("1촌 친구이거나 매칭이 성사된 분만 보증할 수 있어요");
      } else {
        toast.error("보증에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) resetAndClose(); }}>
      <SheetContent side="bottom" className="rounded-t-2xl px-0 pb-0 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="px-6 pt-2 pb-4 border-b border-border-subtle">
          <SheetTitle className="text-body font-semibold text-text-primary text-left">
            {targetName}님 보증
          </SheetTitle>
          <SheetDescription className="text-left text-sm text-muted-foreground">
            칩과 한마디는 선택이에요. 부담 없이 원탭만 해도 충분해요.
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-5 space-y-5">
          <div>
            <p className="text-body-sm font-semibold text-text-primary mb-1">한 줄로 고르기 (선택)</p>
            <p className="text-xs text-muted-foreground mb-3">직접 쓰기 부담스러우면 칩만 골라주세요</p>
            <div className="flex flex-wrap gap-2">
              {VOUCH_PRESETS.map((p) => (
                <Chip
                  key={p.key}
                  asButton
                  selected={presetKey === p.key}
                  onClick={() => setPresetKey(presetKey === p.key ? null : p.key)}
                  size="md"
                >
                  {p.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="text-body-sm font-semibold text-text-primary mb-1">한마디 (선택)</p>
            <p className="text-xs text-muted-foreground mb-2">최대 50자 · 비워도 괜찮아요</p>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 50))}
              placeholder="예: 같이 있으면 편한 사람이에요"
              className="min-h-[72px] resize-none"
              maxLength={50}
            />
            <p className="text-[11px] text-muted-foreground text-right mt-1">{message.length}/50</p>
          </div>

          <div className="space-y-2 pb-6">
            <Button
              className="w-full h-12"
              disabled={loading}
              onClick={() => submit(true)}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "보증하기"}
            </Button>
            {!presetKey && !message.trim() && (
              <p className="text-[11px] text-center text-muted-foreground">
                칩·한마디 없이 눌러도 &quot;이 분 괜찮아요&quot; 보증으로 남겨져요
              </p>
            )}
            {(presetKey || message.trim()) && (
              <Button
                variant="ghost"
                className="w-full"
                disabled={loading}
                onClick={() => submit(false)}
              >
                칩 없이 간단히만 보증
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
