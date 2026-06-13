import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../lib/adminApi";

interface FieldOption {
  id: string;
  setKey: string;
  code: string;
  label: string;
  displayOrder: number;
  gender: string | null;
  active: boolean;
}

type Draft = {
  id?: string;
  setKey: string;
  code: string;
  label: string;
  displayOrder: number;
  gender: string; // "" | "MALE" | "FEMALE"
  active: boolean;
};

// set_key → 한글 설명 (관리 UX)
const SET_LABELS: Record<string, string> = {
  bodyType: "체형", religion: "종교", smoking: "흡연", drinking: "음주",
  datePreference: "데이트 스타일", importantValue: "중요 가치", dealBreaker: "딜브레이커",
  personality: "선호 성격", interest: "관심사", appearanceStyle: "외모상(성별)",
};

export function AdminFieldOptionsScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<FieldOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSet, setActiveSet] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.get<FieldOption[]>("/api/v1/admin/field-options");
      setItems(data);
      if (!activeSet && data.length > 0) setActiveSet(data[0].setKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  const sets = useMemo(() => Array.from(new Set(items.map(i => i.setKey))), [items]);
  const rows = items.filter(i => i.setKey === activeSet).sort((a, b) => a.displayOrder - b.displayOrder);

  const toggleActive = async (o: FieldOption) => {
    try { await adminApi.patch(`/api/v1/admin/field-options/${o.id}/active`, { active: !o.active }); load(); }
    catch (e) { alert(e instanceof Error ? e.message : "변경 실패"); }
  };
  const remove = async (o: FieldOption) => {
    if (!confirm(`"${o.label}" 옵션을 완전히 삭제할까요? (과거 프로필 호환을 위해 보통 '비활성'을 권장)`)) return;
    try { await adminApi.delete(`/api/v1/admin/field-options/${o.id}`); load(); }
    catch (e) { alert(e instanceof Error ? e.message : "삭제 실패"); }
  };
  const openCreate = () => setDraft({
    setKey: activeSet ?? "personality", code: "", label: "",
    displayOrder: (rows.at(-1)?.displayOrder ?? -1) + 1, gender: "", active: true,
  });
  const openEdit = (o: FieldOption) => setDraft({
    id: o.id, setKey: o.setKey, code: o.code, label: o.label,
    displayOrder: o.displayOrder, gender: o.gender ?? "", active: o.active,
  });

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const body = {
        setKey: draft.setKey.trim(), code: draft.code.trim(), label: draft.label.trim(),
        displayOrder: draft.displayOrder, gender: draft.gender || null, active: draft.active,
      };
      if (draft.id) await adminApi.put(`/api/v1/admin/field-options/${draft.id}`, body);
      else await adminApi.post("/api/v1/admin/field-options", body);
      setDraft(null); load();
    } catch (e) { alert(e instanceof Error ? e.message : "저장 실패"); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
          <h1 className="text-lg font-bold text-foreground">온보딩 칩 옵션</h1>
          <button onClick={openCreate} className="text-sm font-medium text-primary hover:underline">+ 옵션 추가</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        <p className="text-xs text-muted-foreground">
          회원가입 프로필 칩 선택지를 관리합니다. <strong>code</strong> 는 실제 저장값이라 변경에 주의하고,
          삭제 대신 <strong>비활성</strong>을 권장해요(과거 프로필 라벨 유지). 추가한 옵션은 온보딩에 바로 반영됩니다.
        </p>

        {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {/* set 탭 */}
        <div className="flex flex-wrap gap-1.5">
          {sets.map(s => (
            <button key={s} onClick={() => setActiveSet(s)}
              className={`text-xs px-3 py-1.5 rounded-full border ${activeSet === s ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground"}`}>
              {SET_LABELS[s] ?? s}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {rows.map(o => (
            <div key={o.id} className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${o.active ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-70"}`}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] tabular-nums text-muted-foreground">#{o.displayOrder}</span>
                  <span className="text-sm font-medium">{o.label}</span>
                  {o.gender && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{o.gender}</span>}
                </div>
                <span className="text-[11px] text-muted-foreground/70 font-mono">{o.code}</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleActive(o)}
                  className={`text-[11px] px-2 py-1 rounded-md border ${o.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground"}`}>
                  {o.active ? "활성" : "비활성"}
                </button>
                <button onClick={() => openEdit(o)} className="text-[11px] px-2 py-1 rounded-md border border-border text-foreground hover:bg-muted">수정</button>
                <button onClick={() => remove(o)} className="text-[11px] px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50">삭제</button>
              </div>
            </div>
          ))}
          {!loading && rows.length === 0 && <p className="text-sm text-muted-foreground">이 세트엔 옵션이 없어요.</p>}
        </div>
      </main>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => !saving && setDraft(null)}>
          <div className="w-full max-w-md bg-card rounded-2xl border border-border" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-foreground">{draft.id ? "옵션 수정" : "옵션 추가"}</h2>
              <button onClick={() => setDraft(null)} className="text-muted-foreground text-sm">닫기</button>
            </div>
            <div className="p-5 space-y-3">
              <Field label="세트 (set_key)">
                <input value={draft.setKey} onChange={(e) => setDraft({ ...draft, setKey: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="코드 (저장값)">
                  <input value={draft.code} onChange={(e) => setDraft({ ...draft, code: e.target.value })}
                    placeholder="예: SLIM 또는 운동" className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                </Field>
                <Field label="순서">
                  <input type="number" value={draft.displayOrder} onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) })}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                </Field>
              </div>
              <Field label="라벨 (표시)">
                <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  placeholder="예: 슬림" className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
              </Field>
              <Field label="성별 한정 (외모상만 — 없으면 공통)">
                <select value={draft.gender} onChange={(e) => setDraft({ ...draft, gender: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                  <option value="">공통</option>
                  <option value="MALE">MALE</option>
                  <option value="FEMALE">FEMALE</option>
                </select>
              </Field>
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                활성 (온보딩에 노출)
              </label>
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => setDraft(null)} disabled={saving} className="h-10 px-4 rounded-lg border border-border text-sm text-muted-foreground">취소</button>
              <button onClick={save} disabled={saving} className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-50">
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground block mb-1.5">{label}</label>
      {children}
    </div>
  );
}
