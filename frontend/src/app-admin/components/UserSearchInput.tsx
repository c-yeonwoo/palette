import { useEffect, useRef, useState } from "react";
import { adminApi } from "../lib/adminApi";

/**
 * 재사용 사용자 검색 입력 — typeahead.
 *
 * - `/api/v1/admin/users?q=<keyword>&size=10` 호출
 * - keyword 매칭 필드: nickname / email / realName / phoneNumber (백엔드)
 * - 300ms debounce
 * - ↓/↑ 키보드 네비게이션 + Enter 선택
 *
 * 값을 controlled 방식으로 받음 — value = 선택된 UUID. 입력 텍스트는 내부 state.
 */
interface AdminUserSearchResult {
  userId: string;
  email: string | null;
  nickname: string;
  realName: string;
  accountType: string;
  isProfileCompleted: boolean;
  createdAt: string;
}

interface AdminUsersPageResponse {
  items: AdminUserSearchResult[];
  totalCount: number;
}

interface Props {
  value: string;
  onChange: (userId: string, user?: AdminUserSearchResult) => void;
  disabled?: boolean;
  placeholder?: string;
  /** 외부 라벨 노출용 — 선택된 사용자 표시 텍스트 (옵션) */
  selectedLabel?: string;
}

export function UserSearchInput({
  value, onChange, disabled, placeholder = "이름·닉네임·이메일로 검색", selectedLabel,
}: Props) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<AdminUserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const [selected, setSelected] = useState<AdminUserSearchResult | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // debounced search
  useEffect(() => {
    if (!keyword.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await adminApi.get<AdminUsersPageResponse>(
          `/api/v1/admin/users?q=${encodeURIComponent(keyword.trim())}&size=10`
        );
        setResults(res.items);
        setHighlight(0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  // 외부 클릭 시 닫기
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const pick = (u: AdminUserSearchResult) => {
    setSelected(u);
    setKeyword("");
    setResults([]);
    setOpen(false);
    onChange(u.userId, u);
  };

  const clear = () => {
    setSelected(null);
    setKeyword("");
    onChange("");
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(results[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  // value 가 외부에서 강제로 비워졌으면 selected 도 초기화
  useEffect(() => {
    if (!value) setSelected(null);
  }, [value]);

  if (selected && value === selected.userId) {
    return (
      <div className="rounded-xl border border-foreground bg-foreground/5 px-3 py-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{selected.nickname}</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {selected.realName} · {selected.email ?? "이메일 없음"} ·{" "}
            <span className="font-mono">{selected.userId.slice(0, 8)}…</span>
          </p>
        </div>
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className="text-xs text-muted-foreground hover:text-foreground shrink-0 px-2 py-1 rounded hover:bg-muted/50"
        >
          변경
        </button>
      </div>
    );
  }

  if (value && !selected && selectedLabel) {
    // 외부에서 userId 만 set 한 상태 (예: 다른 화면에서 사용자 ID 로 진입)
    return (
      <div className="rounded-xl border border-foreground bg-foreground/5 px-3 py-2 flex items-center justify-between gap-2">
        <p className="text-sm font-mono text-foreground truncate">{selectedLabel}</p>
        <button
          type="button"
          onClick={clear}
          disabled={disabled}
          className="text-xs text-muted-foreground hover:text-foreground shrink-0 px-2 py-1 rounded hover:bg-muted/50"
        >
          변경
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={keyword}
        onChange={(e) => { setKeyword(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
      />
      {open && keyword.trim() && (
        <div className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl border border-border bg-background shadow-lg max-h-80 overflow-y-auto">
          {loading ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">검색 중...</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">결과 없음</p>
          ) : (
            <ul>
              {results.map((u, idx) => (
                <li key={u.userId}>
                  <button
                    type="button"
                    onClick={() => pick(u)}
                    onMouseEnter={() => setHighlight(idx)}
                    className={`w-full text-left px-3 py-2 text-xs ${
                      idx === highlight ? "bg-muted/60" : "hover:bg-muted/40"
                    }`}
                  >
                    <p className="font-bold text-foreground">{u.nickname}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {u.realName} · {u.email ?? "이메일 없음"} · {u.accountType}
                      {!u.isProfileCompleted && (
                        <span className="ml-1 text-amber-700">· 프로필 미완성</span>
                      )}
                    </p>
                    <p className="text-[10px] font-mono text-muted-foreground/70">{u.userId}</p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
