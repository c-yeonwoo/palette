/**
 * MatchmakerMarketplaceScreen — F07 주선자 마켓플레이스
 *
 * 기능:
 *   - 텍스트 검색 (닉네임 / 전문분야 / 소개)
 *   - 전문분야·지역 필터 칩 (단일 선택)
 *   - 정렬: 성사율 / 후기 / 최신
 *   - 주선자 카드 (레벨 배지, 컬러 원, 성사율, 별점, 커미션, 전문분야 칩)
 *   - 현재 모집 마감인 주선자 시각적 구분
 */
import { useState, useMemo } from "react";
import {
  ArrowLeft,
  Search,
  Star,
  SlidersHorizontal,
  CheckCircle2,
  X as XIcon,
} from "lucide-react";
import { cn } from "./ui/utils";
import { getColorTypeMeta } from "../../lib/colorTypes";
import { EmptyState } from "./ui/empty-state";
import {
  SPECIALTY_FILTER_OPTIONS,
  LEVEL_META,
  type MarketplaceMatchmaker,
} from "../../types/marketplace";

type SortKey = "success" | "rating" | "recent";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "success", label: "성사율" },
  { key: "rating",  label: "후기" },
  { key: "recent",  label: "최근 활동" },
];

interface MatchmakerMarketplaceScreenProps {
  onBack: () => void;
  onViewMatchmaker: (matchmakerId: string) => void;
}

export function MatchmakerMarketplaceScreen({
  onBack,
  onViewMatchmaker,
}: MatchmakerMarketplaceScreenProps) {
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>("success");
  const [showFilter, setShowFilter] = useState(false);
  const [marketplaceData, setMarketplaceData] = useState<MarketplaceMatchmaker[]>([]);

  const filtered = useMemo(() => {
    let list = [...marketplaceData];

    // 검색어
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (m) =>
          m.nickname.toLowerCase().includes(q) ||
          m.bio.toLowerCase().includes(q) ||
          m.specialties.some((s) => s.toLowerCase().includes(q)),
      );
    }

    // 필터 칩
    if (activeFilter) {
      list = list.filter((m) => m.specialties.includes(activeFilter));
    }

    // 정렬
    if (sort === "success") {
      list.sort((a, b) => b.successfulMatches - a.successfulMatches);
    } else if (sort === "rating") {
      list.sort((a, b) => b.averageRating - a.averageRating || b.totalReviews - a.totalReviews);
    } else {
      list.sort(
        (a, b) =>
          new Date(b.lastActiveAt).getTime() - new Date(a.lastActiveAt).getTime(),
      );
    }

    return list;
  }, [query, activeFilter, sort]);

  const successRatePct = (m: MarketplaceMatchmaker) =>
    m.totalRequests > 0
      ? Math.round((m.successfulMatches / m.totalRequests) * 100)
      : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* ── 헤더 ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-sunken"
          aria-label="뒤로"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <h1 className="text-body font-semibold text-text-primary flex-1">주선자 마켓플레이스</h1>
        <button
          onClick={() => setShowFilter((v) => !v)}
          className={cn(
            "w-9 h-9 flex items-center justify-center rounded-lg transition-colors",
            showFilter || activeFilter
              ? "bg-[hsl(var(--brand)/0.10)] text-brand"
              : "hover:bg-surface-sunken text-text-secondary",
          )}
          aria-label="필터"
        >
          <SlidersHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* ── 검색 바 ── */}
      <div className="px-4 pt-3 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="닉네임, 전문분야, 지역 검색"
            className="w-full pl-9 pr-4 py-2.5 bg-surface-sunken rounded-xl text-body-sm text-text-primary placeholder:text-text-tertiary outline-none focus:ring-1 focus:ring-brand/40"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary"
            >
              <XIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── 필터 칩 패널 (토글) ── */}
      {showFilter && (
        <div className="px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2 flex-wrap">
            {SPECIALTY_FILTER_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => setActiveFilter(activeFilter === opt ? null : opt)}
                className={cn(
                  "px-3 py-1.5 rounded-pill text-caption font-medium whitespace-nowrap transition-all",
                  activeFilter === opt
                    ? "bg-[hsl(var(--brand)/0.10)] text-brand ring-1 ring-[hsl(var(--brand)/0.25)]"
                    : "bg-surface shadow-hairline text-text-secondary",
                )}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── 정렬 탭 ── */}
      <div className="flex gap-1 px-4 pb-2">
        {SORT_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={cn(
              "px-3 py-1.5 rounded-pill text-caption font-medium transition-all",
              sort === key
                ? "bg-brand text-brand-foreground"
                : "bg-surface shadow-hairline text-text-secondary",
            )}
          >
            {label}
          </button>
        ))}
        {activeFilter && (
          <button
            onClick={() => setActiveFilter(null)}
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-pill text-caption font-medium bg-[hsl(var(--brand)/0.08)] text-brand"
          >
            {activeFilter} <XIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* ── 리스트 ── */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 space-y-3 pt-1">
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-text-tertiary">
            <p className="text-body-sm">검색 결과가 없어요</p>
            <p className="text-caption mt-1">다른 키워드로 검색해보세요</p>
          </div>
        ) : (
          filtered.map((m) => (
            <MatchmakerCard
              key={m.id}
              matchmaker={m}
              successRate={successRatePct(m)}
              onPress={() => onViewMatchmaker(m.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

/* ── 주선자 카드 ─────────────────────────────────────────── */

function MatchmakerCard({
  matchmaker: m,
  successRate,
  onPress,
}: {
  matchmaker: MarketplaceMatchmaker;
  successRate: number;
  onPress: () => void;
}) {
  const meta = getColorTypeMeta(m.colorType);
  const hsl = `hsl(${meta.h} ${meta.s}% ${meta.l}%)`;
  const levelMeta = LEVEL_META[m.level];

  return (
    <button
      onClick={onPress}
      className={cn(
        "w-full text-left bg-surface shadow-card rounded-2xl p-4 transition-shadow hover:shadow-card-hover active:shadow-card",
        !m.accepting && "opacity-60",
      )}
    >
      <div className="flex items-start gap-3">
        {/* 아바타 */}
        <div className="relative flex-shrink-0">
          <div
            className="w-12 h-12 rounded-full border-2 border-background shadow-soft"
            style={{ backgroundColor: hsl }}
            aria-label={`${m.nickname} 컬러 타입`}
          />
          {/* 레벨 뱃지 */}
          <div
            className="absolute -bottom-1 -right-1 text-[11px] leading-none"
            title={`Lv.${m.level} ${levelMeta.name}`}
            aria-label={levelMeta.name}
          >
            {levelMeta.emoji}
          </div>
        </div>

        {/* 본문 */}
        <div className="flex-1 min-w-0">
          {/* 이름 + 모집 상태 */}
          <div className="flex items-center gap-2">
            <span className="text-body font-semibold text-text-primary">{m.nickname}</span>
            <span className="text-caption text-text-tertiary">Lv.{m.level} {levelMeta.name}</span>
            {!m.accepting && (
              <span className="ml-auto text-caption font-medium text-text-tertiary bg-surface-sunken px-2 py-0.5 rounded-pill">
                마감
              </span>
            )}
          </div>

          {/* 소개 */}
          <p className="text-caption text-text-secondary mt-0.5 line-clamp-2 leading-snug">
            {m.bio}
          </p>

          {/* 전문분야 칩 */}
          <div className="flex flex-wrap gap-1 mt-2">
            {m.specialties.slice(0, 4).map((s) => (
              <span
                key={s}
                className="text-caption text-text-secondary bg-surface-sunken px-2 py-0.5 rounded-pill"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 스탯 바 */}
      <div className="mt-3 pt-3 border-t border-border-subtle flex items-center gap-4">
        {/* 성사율 */}
        <div className="flex flex-col items-center">
          <span className="text-title font-bold text-text-primary">{successRate}%</span>
          <span className="text-caption text-text-tertiary">성사율</span>
        </div>

        <div className="w-px h-8 bg-border-subtle" />

        {/* 성사 건수 */}
        <div className="flex flex-col items-center">
          <span className="text-title font-bold text-text-primary">{m.successfulMatches}</span>
          <span className="text-caption text-text-tertiary">성사 건</span>
        </div>

        <div className="w-px h-8 bg-border-subtle" />

        {/* 별점 */}
        <div className="flex flex-col items-center">
          <span className="text-title font-bold text-text-primary flex items-center gap-0.5">
            <Star className="w-3.5 h-3.5 text-[hsl(42_92%_52%)] fill-[hsl(42_92%_52%)]" />
            {m.averageRating.toFixed(1)}
          </span>
          <span className="text-caption text-text-tertiary">({m.totalReviews})</span>
        </div>

        <div className="w-px h-8 bg-border-subtle" />

        {/* 커미션 */}
        <div className="flex flex-col items-center">
          <span className="text-title font-bold text-brand">{m.commissionRate}%</span>
          <span className="text-caption text-text-tertiary">커미션</span>
        </div>
      </div>
    </button>
  );
}
