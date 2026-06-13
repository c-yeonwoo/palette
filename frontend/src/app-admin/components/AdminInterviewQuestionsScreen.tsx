import { useEffect, useState } from "react";
import { adminApi } from "../lib/adminApi";

interface Question {
  id: string;
  questionKey: string;
  displayOrder: number;
  category: string;
  question: string;
  hint: string | null;
  inputType: "chips" | "text" | string;
  chips: string[];
  active: boolean;
}

type DraftForm = {
  id?: string;
  questionKey: string;
  displayOrder: number;
  category: string;
  question: string;
  hint: string;
  inputType: "chips" | "text";
  chipsText: string; // 줄바꿈 구분
  active: boolean;
};

const EMPTY_DRAFT: DraftForm = {
  questionKey: "", displayOrder: 1, category: "", question: "", hint: "",
  inputType: "text", chipsText: "", active: true,
};

export function AdminInterviewQuestionsScreen({ onBack }: { onBack: () => void }) {
  const [items, setItems] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftForm | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await adminApi.get<Question[]>("/api/v1/admin/interview-questions"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggleActive = async (q: Question) => {
    try {
      await adminApi.patch(`/api/v1/admin/interview-questions/${q.id}/active`, { active: !q.active });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "변경 실패");
    }
  };

  const remove = async (q: Question) => {
    if (!confirm(`"${q.question}" 질문을 삭제할까요?`)) return;
    try {
      await adminApi.delete(`/api/v1/admin/interview-questions/${q.id}`);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "삭제 실패");
    }
  };

  const openCreate = () =>
    setDraft({ ...EMPTY_DRAFT, displayOrder: (items.at(-1)?.displayOrder ?? 0) + 1 });

  const openEdit = (q: Question) =>
    setDraft({
      id: q.id, questionKey: q.questionKey, displayOrder: q.displayOrder, category: q.category,
      question: q.question, hint: q.hint ?? "", inputType: q.inputType === "chips" ? "chips" : "text",
      chipsText: q.chips.join("\n"), active: q.active,
    });

  const saveDraft = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const body = {
        questionKey: draft.questionKey.trim(),
        displayOrder: draft.displayOrder,
        category: draft.category.trim(),
        question: draft.question.trim(),
        hint: draft.hint.trim() || null,
        inputType: draft.inputType,
        chips: draft.inputType === "chips"
          ? draft.chipsText.split("\n").map(s => s.trim()).filter(Boolean)
          : [],
        active: draft.active,
      };
      if (draft.id) {
        await adminApi.put(`/api/v1/admin/interview-questions/${draft.id}`, body);
      } else {
        await adminApi.post("/api/v1/admin/interview-questions", body);
      }
      setDraft(null);
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← 대시보드</button>
          <h1 className="text-lg font-bold text-foreground">AI 인터뷰 질문</h1>
          <button onClick={openCreate} className="text-sm font-medium text-primary hover:underline">+ 질문 추가</button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-3">
        <p className="text-xs text-muted-foreground">
          순서대로 사용자에게 노출됩니다. 비활성 질문은 인터뷰에서 제외돼요. (질문 키는 답변 저장 식별자라 변경에 주의)
        </p>
        {loading && <p className="text-sm text-muted-foreground">불러오는 중...</p>}
        {error && <p className="text-sm text-destructive">{error}</p>}

        {items.map((q) => (
          <div key={q.id} className={`rounded-xl border p-4 ${q.active ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-70"}`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[11px] tabular-nums text-muted-foreground">#{q.displayOrder}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{q.category}</span>
                  <span className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{q.inputType}</span>
                  <span className="text-[11px] text-muted-foreground/70">{q.questionKey}</span>
                </div>
                <p className="text-sm font-medium text-foreground">{q.question}</p>
                {q.hint && <p className="text-xs text-muted-foreground mt-0.5">{q.hint}</p>}
                {q.chips.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {q.chips.map((c, i) => (
                      <span key={i} className="text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">{c}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <button
                  onClick={() => toggleActive(q)}
                  className={`text-[11px] px-2 py-1 rounded-md border ${q.active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-border text-muted-foreground"}`}
                >
                  {q.active ? "활성" : "비활성"}
                </button>
                <div className="flex gap-1">
                  <button onClick={() => openEdit(q)} className="text-[11px] px-2 py-1 rounded-md border border-border text-foreground hover:bg-muted">수정</button>
                  <button onClick={() => remove(q)} className="text-[11px] px-2 py-1 rounded-md border border-red-200 text-red-600 hover:bg-red-50">삭제</button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {!loading && items.length === 0 && <p className="text-sm text-muted-foreground">등록된 질문이 없어요.</p>}
      </main>

      {/* 추가/수정 폼 */}
      {draft && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4" onClick={() => !saving && setDraft(null)}>
          <div className="w-full max-w-lg bg-card rounded-2xl border border-border max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-bold text-foreground">{draft.id ? "질문 수정" : "질문 추가"}</h2>
              <button onClick={() => setDraft(null)} className="text-muted-foreground text-sm">닫기</button>
            </div>
            <div className="p-5 space-y-3">
              <Field label="질문 키 (식별자)">
                <input value={draft.questionKey} onChange={(e) => setDraft({ ...draft, questionKey: e.target.value })}
                  placeholder="예: job" className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="순서">
                  <input type="number" value={draft.displayOrder} onChange={(e) => setDraft({ ...draft, displayOrder: Number(e.target.value) })}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
                </Field>
                <Field label="유형">
                  <select value={draft.inputType} onChange={(e) => setDraft({ ...draft, inputType: e.target.value as "chips" | "text" })}
                    className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm">
                    <option value="text">주관식 (text)</option>
                    <option value="chips">선택지 (chips)</option>
                  </select>
                </Field>
              </div>
              <Field label="카테고리">
                <input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  placeholder="예: 라이프스타일" className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
              </Field>
              <Field label="질문">
                <textarea value={draft.question} onChange={(e) => setDraft({ ...draft, question: e.target.value })}
                  rows={2} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
              </Field>
              <Field label="힌트 (선택)">
                <input value={draft.hint} onChange={(e) => setDraft({ ...draft, hint: e.target.value })}
                  className="w-full h-10 rounded-lg border border-border bg-background px-3 text-sm" />
              </Field>
              {draft.inputType === "chips" && (
                <Field label="선택지 (한 줄에 하나)">
                  <textarea value={draft.chipsText} onChange={(e) => setDraft({ ...draft, chipsText: e.target.value })}
                    rows={4} placeholder={"다정한\n재밌는\n차분한"} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                </Field>
              )}
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" checked={draft.active} onChange={(e) => setDraft({ ...draft, active: e.target.checked })} />
                활성 (인터뷰에 노출)
              </label>
            </div>
            <div className="px-5 py-4 border-t border-border flex justify-end gap-2">
              <button onClick={() => setDraft(null)} disabled={saving} className="h-10 px-4 rounded-lg border border-border text-sm text-muted-foreground">취소</button>
              <button onClick={saveDraft} disabled={saving} className="h-10 px-4 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-50">
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
