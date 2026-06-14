import { useEffect, useState, useCallback } from "react";
import { adminApi } from "../lib/adminApi";
import { AdminProfilePreview, type AdminProfileData } from "./AdminProfilePreview";

interface PendingUser {
  userId: string;
  email: string | null;
  nickname: string;
  realName: string;
  gender: string;
  age: number;
  accountType: string;
  isProfileCompleted: boolean;
  createdAt: string;
}
interface PageResponse {
  items: PendingUser[];
  totalCount: number;
}

/**
 * 승인 대기 큐 — PENDING_APPROVAL 가입자를 모아 프로필 검토 후 원클릭 승인(ACTIVE)/반려(REJECTED).
 * 기존 엔드포인트 재사용: GET /admin/users?status=PENDING_APPROVAL + PATCH /admin/users/{id}/status.
 */
export function AdminApprovalsScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);

  // 프로필 미리보기 modal
  const [previewUser, setPreviewUser] = useState<PendingUser | null>(null);
  const [preview, setPreview] = useState<AdminProfileData | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.get<PageResponse>("/api/v1/admin/users?status=PENDING_APPROVAL&size=100&sort=createdAt:asc");
      setItems(res.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "조회 실패");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const changeStatus = async (u: PendingUser, status: "ACTIVE" | "REJECTED") => {
    if (status === "ACTIVE" && !confirm(`${u.nickname} 님을 승인할까요?`)) return;
    let reason: string | null = null;
    if (status === "REJECTED") {
      reason = prompt("반려 사유를 입력하세요 (사용자에게 표시)");
      if (reason == null || !reason.trim()) return;
    }
    setActing(u.userId);
    try {
      await adminApi.patch(`/api/v1/admin/users/${u.userId}/status`, { status, reason: reason?.trim() || null });
      setItems((prev) => prev.filter((x) => x.userId !== u.userId)); // 큐에서 제거
      if (previewUser?.userId === u.userId) closePreview();
    } catch (e) {
      alert(e instanceof Error ? e.message : "처리 실패");
    } finally {
      setActing(null);
    }
  };

  const openPreview = async (u: PendingUser) => {
    setPreviewUser(u);
    setPreview(null);
    setPreviewError(null);
    setPreviewLoading(true);
    try {
      setPreview(await adminApi.get<AdminProfileData>(`/api/v1/admin/users/${u.userId}/profile`));
    } catch (e) {
      setPreviewError(e instanceof Error ? e.message : "프로필 조회 실패");
    } finally {
      setPreviewLoading(false);
    }
  };
  const closePreview = () => { setPreviewUser(null); setPreview(null); setPreviewError(null); };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
          <h1 className="text-lg font-bold text-foreground">승인 대기 {items.length > 0 && <span className="text-primary">({items.length})</span>}</h1>
          <button onClick={load} className="text-sm text-muted-foreground hover:text-foreground">새로고침</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-3">
        <p className="text-xs text-muted-foreground">
          프로필 검토 후 승인하면 정식 이용이 가능해집니다. 반려 시 사유가 사용자에게 표시돼요.
        </p>
        {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {!loading && items.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            승인 대기 중인 가입자가 없어요 ✅
          </div>
        )}

        {items.map((u) => (
          <div key={u.userId} className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground">{u.nickname}</span>
                <span className="text-sm text-muted-foreground">
                  {u.realName} · {u.gender === "MALE" ? "남" : "여"} · {u.age}세
                </span>
                {!u.isProfileCompleted && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">프로필 미완성</span>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">가입 {u.createdAt.slice(0, 10)} · {u.email ?? "—"}</p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button onClick={() => openPreview(u)} className="text-xs px-2.5 py-1.5 rounded-md border border-border text-foreground hover:bg-muted">프로필</button>
              <button onClick={() => changeStatus(u, "REJECTED")} disabled={acting === u.userId}
                className="text-xs px-2.5 py-1.5 rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">반려</button>
              <button onClick={() => changeStatus(u, "ACTIVE")} disabled={acting === u.userId}
                className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">승인</button>
            </div>
          </div>
        ))}
      </main>

      {/* 프로필 미리보기 */}
      {previewUser && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={closePreview}>
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-card border-b border-border px-5 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">{previewUser.nickname} 프로필</h3>
              <button onClick={closePreview} className="text-sm text-muted-foreground hover:text-foreground">닫기 ✕</button>
            </div>
            <div className="p-5">
              {previewLoading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
              {previewError && <p className="text-sm text-destructive">{previewError}</p>}
              {preview && !previewLoading && <AdminProfilePreview data={preview} />}
            </div>
            <div className="sticky bottom-0 bg-card border-t border-border px-5 py-3 flex justify-end gap-2">
              <button onClick={() => changeStatus(previewUser, "REJECTED")} disabled={acting === previewUser.userId}
                className="text-sm px-4 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">반려</button>
              <button onClick={() => changeStatus(previewUser, "ACTIVE")} disabled={acting === previewUser.userId}
                className="text-sm px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50">승인</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
