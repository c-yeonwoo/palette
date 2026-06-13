import { useEffect, useMemo, useState } from "react";
import { adminApi } from "../lib/adminApi";

interface OnboardingField {
  id: string;
  fieldKey: string;
  section: string;
  sectionOrder: number;
  fieldOrder: number;
  label: string;
  hint: string | null;
  inputType: string;
  optionSetKey: string | null;
  required: boolean;
  config: string | null;
  active: boolean;
}

type Draft = {
  id?: string;
  fieldKey: string;
  section: string;
  sectionOrder: number;
  fieldOrder: number;
  label: string;
  hint: string;
  inputType: string;
  optionSetKey: string;
  required: boolean;
  config: string;
  active: boolean;
};

const SECTION_LABELS: Record<string, string> = {
  basic: "기본 정보", about: "자기소개·라이프스타일", ideal: "이상형",
};

const INPUT_TYPES = [
  "text", "date", "gender", "slider", "rangeSlider", "mbti", "interview",
  "singleChip", "multiChip", "rankedChip",
];

export function AdminOnboardingFieldsScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<OnboardingField[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await adminApi.get<OnboardingField[]>("/api/v1/admin/onboarding-fields"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // 섹션별 그룹 (section_order → field_order)
  const sections = useMemo(() => {
    const map = new Map<string, OnboardingField[]>();
    for (const f of items) {
      if (!map.has(f.section)) map.set(f.section, []);
      map.get(f.section)!.push(f);
    }
    return Array.from(map.entries())
      .map(([key, rows]) => ({
        key,
        order: rows[0]?.sectionOrder ?? 0,
        rows: rows.slice().sort((a, b) => a.fieldOrder - b.fieldOrder),
      }))
      .sort((a, b) => a.order - b.order);
  }, [items]);

  const toggleActive = async (f: OnboardingField) => {
    try { await adminApi.patch(`/api/v1/admin/onboarding-fields/${f.id}/active`, { active: !f.active }); load(); }
    catch (e) { alert(e instanceof Error ? e.message : "변경 실패"); }
  };
  const remove = async (f: OnboardingField) => {
    if (!confirm(`"${f.label}" 필드를 완전히 삭제할까요? (보통 '비활성'을 권장)`)) return;
    try { await adminApi.delete(`/api/v1/admin/onboarding-fields/${f.id}`); load(); }
    catch (e) { alert(e instanceof Error ? e.message : "삭제 실패"); }
  };
  const openCreate = (section?: string) => {
    const sec = section ?? "basic";
    const secRows = items.filter(i => i.section === sec);
    setDraft({
      fieldKey: "", section: sec,
      sectionOrder: secRows[0]?.sectionOrder ?? (sections.at(-1)?.order ?? 0) + 1,
      fieldOrder: (secRows.at(-1)?.fieldOrder ?? -1) + 1,
      label: "", hint: "", inputType: "text", optionSetKey: "", required: false, config: "", active: true,
    });
  };
  const openEdit = (f: OnboardingField) => setDraft({
    id: f.id, fieldKey: f.fieldKey, section: f.section, sectionOrder: f.sectionOrder,
    fieldOrder: f.fieldOrder, label: f.label, hint: f.hint ?? "", inputType: f.inputType,
    optionSetKey: f.optionSetKey ?? "", required: f.required, config: f.config ?? "", active: f.active,
  });

  const save = async () => {
    if (!draft) return;
    if (draft.config.trim()) {
      try { JSON.parse(draft.config); }
      catch { alert("config 는 올바른 JSON 이어야 합니다 (비우면 생략)"); return; }
    }
    setSaving(true);
    try {
      const body = {
        fieldKey: draft.fieldKey.trim(), section: draft.section.trim(),
        sectionOrder: draft.sectionOrder, fieldOrder: draft.fieldOrder,
        label: draft.label.trim(), hint: draft.hint.trim() || null,
        inputType: draft.inputType.trim(), optionSetKey: draft.optionSetKey.trim() || null,
        required: draft.required, config: draft.config.trim() || null, active: draft.active,
      };
      if (draft.id) await adminApi.put(`/api/v1/admin/onboarding-fields/${draft.id}`, body);
      else await adminApi.post("/api/v1/admin/onboarding-fields", body);
      setDraft(null); load();
    } catch (e) { alert(e instanceof Error ? e.message : "저장 실패"); }
    finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
          <h1 className="text-lg font-bold text-foreground">온보딩 필드</h1>
          <button onClick={() => openCreate()} className="text-sm font-medium text-primary hover:underline">+ 필드 추가</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-6">
        <p className="text-xs text-muted-foreground">
          회원가입 프로필 화면의 <strong>질문/필드·순서·라벨·힌트·위젯·필수 여부</strong>를 관리합니다.
          칩 선택지(code/label)는 <strong>온보딩 칩 옵션</strong> 화면에서 따로 관리해요.
          <strong>field_key</strong> 는 프론트 위젯 매칭 키라 변경에 주의하고, 숨김은 <strong>비활성</strong>을 권장합니다.
        </p>

        {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {sections.map(sec => (
          <section key={sec.key} className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-foreground">
                <span className="text-[11px] tabular-nums text-muted-foreground mr-1.5">#{sec.order}</span>
                {SECTION_LABELS[sec.key] ?? sec.key}
                <span className="text-[11px] text-muted-foreground/60 ml-1.5 font-mono">{sec.key}</span>
              </h2>
              <button onClick={() => openCreate(sec.key)} className="text-[11px] text-primary hover:underline">+ 이 섹션에 추가</button>
            </div>
            <div className="space-y-2">
              {sec.rows.map(f => (
                <div key={f.id} className={`rounded-xl border p-3 flex items-center justify-between gap-3 ${f.active ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-70"}`}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] tabular-nums text-muted-foreground">#{f.fieldOrder}</span>
                      <span className="text-sm font-medium">{f.label}</span>
                      {f.required && <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 border border-rose-200">필수</span>}
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{f.inputType}</span>
                      {f.optionSetKey && <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200">옵션:{f.optionSetKey}</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-muted-foreground/70 font-mono">{f.fieldKey}</span>
                      {f.hint && <span className="text-[11px] text-muted-foreground/60 truncate">· {f.hint}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => toggleActive(f)}
                      className={`text-[11px] px-2 py-1 rounded-md border ${f.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground"}`}>
                      {f.active ? "활성" : "비활성"}
                    </button>
                    <button onClick={() => openEdit(f)} className="text-[11px] px-2 py-1 rounded-md border border-border text-foreground hover:bg-muted">수정</button>
                    <button onClick={() => remove(f)} className="text-[11px] px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50">삭제</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
        {!loading && sections.length === 0 && <p className="text-sm text-muted-foreground">등록된 필드가 없어요.</p>}
      </main>

      {draft && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => !saving && setDraft(null)}>
          <div className="w-full max-w-md bg-card rounded-2xl border border-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between sticky top-0 bg-card">
              <h2 className="font-bold text-foreground">{draft.id ? "필드 수정" : "필드 추가"}</h2>
              <button onClick={() => setDraft(null)} className="text-muted-foreground text-sm">닫기</button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="field_key (위젯 매칭 키)">
                  <input value={draft.fieldKey} onChange={(e) => setDraft({ ...draft, fieldKey: e.target.value })}
                    placeholder="예: bodyType" className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                </Field>
                <Field label="섹션">
                  <select value={draft.section} onChange={(e) => setDraft({ ...draft, section: e.target.value })}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                    {Object.entries(SECTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v} ({k})</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="섹션 순서">
                  <input type="number" value={draft.sectionOrder} onChange={(e) => setDraft({ ...draft, sectionOrder: Number(e.target.value) })}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                </Field>
                <Field label="필드 순서">
                  <input type="number" value={draft.fieldOrder} onChange={(e) => setDraft({ ...draft, fieldOrder: Number(e.target.value) })}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                </Field>
              </div>
              <Field label="라벨 (표시)">
                <input value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  placeholder="예: 체형" className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
              </Field>
              <Field label="힌트 (선택)">
                <input value={draft.hint} onChange={(e) => setDraft({ ...draft, hint: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="위젯 타입">
                  <select value={draft.inputType} onChange={(e) => setDraft({ ...draft, inputType: e.target.value })}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                    {INPUT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </Field>
                <Field label="옵션 세트 (선택)">
                  <input value={draft.optionSetKey} onChange={(e) => setDraft({ ...draft, optionSetKey: e.target.value })}
                    placeholder="예: bodyType" className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                </Field>
              </div>
              <Field label="config (JSON, 선택 — slider min/max·maxSelect 등)">
                <textarea value={draft.config} onChange={(e) => setDraft({ ...draft, config: e.target.value })}
                  placeholder='{"min":140,"max":220}' rows={2}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" />
              </Field>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={draft.required} onChange={(e) => setDraft({ ...draft, required: e.target.checked })} />
                  필수 입력
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground">
                  <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                  활성 (온보딩에 노출)
                </label>
              </div>
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end gap-2 sticky bottom-0 bg-card">
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
