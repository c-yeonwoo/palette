/**
 * 차단 목록 (디자인 검토 P2-9).
 *
 * 그동안 BlockConfirmDialog 등에서 "마이페이지 > 설정 > 차단 목록에서 해제"를
 * 안내했으나 정작 화면이 없었음. 백엔드는 이미 제공:
 *   GET    /api/v1/users/me/blocks        → [{ blockedUserId, createdAt }]
 *   DELETE /api/v1/users/{userId}/block   → 차단 해제
 */
import { useEffect, useState } from "react";
import { ChevronLeft, Loader2, UserX } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../../lib/api/apiClient";
import { Button } from "../ui/button";

interface BlockListScreenProps {
  onBack: () => void;
}

interface BlockRow {
  blockedUserId: string;
  createdAt: string;
  nickname?: string;
  photoUrl?: string | null;
}

export function BlockListScreen({ onBack }: BlockListScreenProps) {
  const [rows, setRows] = useState<BlockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const list = await api.get<BlockRow[]>("/api/v1/users/me/blocks");
        // 닉네임/사진 best-effort 보강 (공개 프로필). 실패해도 목록은 표시.
        const enriched = await Promise.all(
          (list ?? []).map(async (b) => {
            try {
              const p = await api.get<any>(`/api/v1/profile/users/${b.blockedUserId}`);
              return { ...b, nickname: p?.nickname ?? undefined, photoUrl: p?.primaryPhotoUrl ?? null };
            } catch {
              return b;
            }
          })
        );
        setRows(enriched);
      } catch {
        toast.error("차단 목록을 불러오지 못했어요");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleUnblock = async (userId: string) => {
    setUnblocking(userId);
    try {
      await api.delete(`/api/v1/users/${userId}/block`);
      setRows((prev) => prev.filter((r) => r.blockedUserId !== userId));
      toast.success("차단을 해제했어요");
    } catch {
      toast.error("차단 해제에 실패했어요");
    } finally {
      setUnblocking(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center">
          <button onClick={onBack} className="w-9 h-9 -ml-2 rounded-full flex items-center justify-center hover:bg-muted/50" aria-label="뒤로">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold ml-1">차단 목록</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-5">
        {loading ? (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <UserX className="w-6 h-6 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">차단한 사용자가 없어요</p>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-border/60 shadow-card divide-y divide-border overflow-hidden">
            {rows.map((r) => (
              <div key={r.blockedUserId} className="flex items-center gap-3 px-4 py-3">
                {r.photoUrl ? (
                  <img src={r.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm font-bold text-muted-foreground/60 flex-shrink-0">
                    {(r.nickname ?? "?").charAt(0)}
                  </div>
                )}
                <span className="text-sm font-medium text-foreground flex-1 truncate">{r.nickname ?? "차단된 사용자"}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUnblock(r.blockedUserId)}
                  disabled={unblocking === r.blockedUserId}
                >
                  {unblocking === r.blockedUserId ? "해제 중…" : "차단 해제"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
