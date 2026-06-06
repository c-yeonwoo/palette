/**
 * DesignSystemScreen — P2 + P3 컴포넌트 쇼케이스
 * 접근: 앱 내 designSystem 화면
 */
import { useState } from "react";
import {
  Heart, Star, Search, User, ChevronLeft,
  Loader2, Package,
} from "lucide-react";
import { AccentScope } from "../contexts/AccentScope";
import { SkeletonProfileHeader, SkeletonCard, SkeletonListRow } from "./ui/skeleton";
import { ColorTypeBadge } from "./color/ColorTypeBadge";
import { tierFor, nextTier } from "../../lib/matchmakerLevels";
import { ColorTypeAura } from "./color/ColorTypeAura";
import { MatchPairMark } from "./color/MatchPairMark";
import { TrustTier } from "./color/TrustTier";
import { COLOR_TYPES, type ColorTypeKey } from "../../lib/colorTypes";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Chip } from "./ui/chip";
import { SectionHeader } from "./ui/section-header";
import { StatBlock, StatRow } from "./ui/stat-block";
import { ListRow } from "./ui/list-row";
import { EmptyState } from "./ui/empty-state";
import { LevelBar } from "./ui/level-bar";
import { ToggleRow } from "./ui/toggle-row";
import { Switch } from "./ui/switch";

interface DesignSystemScreenProps {
  onBack: () => void;
}

export function DesignSystemScreen({ onBack }: DesignSystemScreenProps) {
  const [toggle1, setToggle1] = useState(true);
  const [toggle2, setToggle2] = useState(false);
  const [selectedChip, setSelectedChip] = useState<string | null>("30대");

  const chips = ["20대", "30대", "40대이상", "IT/개발", "서울", "진지한연애"];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* TopBar */}
      <div className="sticky top-0 z-10 bg-surface border-b border-border-subtle px-4 pt-12 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-md hover:bg-surface-sunken transition-colors">
            <ChevronLeft className="w-5 h-5 text-text-primary" />
          </button>
          <div>
            <h2 className="text-title text-text-primary">디자인 시스템</h2>
            <p className="text-caption text-text-tertiary">P2 컴포넌트 쇼케이스</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-10 pt-6">

        {/* ── 색상 팔레트 ── */}
        <section>
          <SectionHeader title="Color Tokens" subtitle="P1 디자인 토큰" className="mb-4" />
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "brand",        bg: "bg-brand",        text: "text-brand-foreground" },
              { label: "brand-soft",   bg: "bg-brand-soft",   text: "text-primary" },
              { label: "surface",      bg: "bg-surface",      text: "text-text-primary", bordered: true },
              { label: "surface-sunken", bg: "bg-surface-sunken", text: "text-text-secondary", bordered: true },
              { label: "state-success",bg: "bg-state-success",text: "text-white" },
              { label: "state-danger", bg: "bg-state-danger", text: "text-white" },
              { label: "state-warning",bg: "bg-state-warning",text: "text-white" },
              { label: "state-info",   bg: "bg-state-info",   text: "text-white" },
            ].map(({ label, bg, text, bordered }) => (
              <div
                key={label}
                className={`${bg} ${bordered ? "border border-border-subtle" : ""} rounded-lg px-3 py-2.5`}
              >
                <p className={`text-caption font-mono ${text}`}>{label}</p>
              </div>
            ))}
          </div>

          {/* color types row */}
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {[
              { name: "orange", cls: "bg-ct-orange-500" },
              { name: "blue",   cls: "bg-ct-blue-500" },
              { name: "red",    cls: "bg-ct-red-500" },
              { name: "pink",   cls: "bg-ct-pink-500" },
              { name: "green",  cls: "bg-ct-green-500" },
              { name: "purple", cls: "bg-ct-purple-500" },
              { name: "yellow", cls: "bg-ct-yellow-500" },
              { name: "gray",   cls: "bg-ct-gray-500" },
            ].map(({ name, cls }) => (
              <div key={name} className={`${cls} w-8 h-8 rounded-md`} title={name} />
            ))}
          </div>
        </section>

        {/* ── Typography ── */}
        <section>
          <SectionHeader title="Typography" className="mb-4" />
          <Card variant="flat" className="gap-0 divide-y divide-border-subtle">
            {[
              { cls: "text-display-lg", label: "display-lg · 28/36 700" },
              { cls: "text-display",    label: "display · 22/30 700" },
              { cls: "text-title",      label: "title · 18/26 600" },
              { cls: "text-body",       label: "body · 15/22 500" },
              { cls: "text-body-sm",    label: "body-sm · 13/20 500" },
              { cls: "text-caption",    label: "caption · 12/16 500" },
            ].map(({ cls, label }) => (
              <div key={cls} className="px-4 py-3 flex items-baseline justify-between gap-4">
                <span className={`${cls} text-text-primary`}>가나다 Abc</span>
                <span className="text-caption text-text-tertiary font-mono whitespace-nowrap">{label}</span>
              </div>
            ))}
          </Card>
        </section>

        {/* ── Button Variants ── */}
        <section>
          <SectionHeader title="Button" className="mb-4" />
          <div className="flex flex-wrap gap-2">
            <Button variant="brand">brand</Button>
            <Button variant="soft">soft</Button>
            <Button variant="subtle">subtle</Button>
            <Button variant="outline">outline</Button>
            <Button variant="ghost">ghost</Button>
            <Button variant="destructive">destructive</Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button size="xl" variant="brand">xl 사이즈</Button>
            <Button size="lg">lg 사이즈</Button>
            <Button size="sm">sm 사이즈</Button>
            <Button size="icon" variant="outline"><Heart /></Button>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <Button variant="brand" disabled>disabled</Button>
            <Button variant="brand"><Loader2 className="animate-spin" />loading</Button>
          </div>
        </section>

        {/* ── Card Variants ── */}
        <section>
          <SectionHeader title="Card" className="mb-4" />
          <div className="space-y-3">
            <Card variant="flat" className="gap-0">
              <CardContent className="pt-4 pb-4">
                <p className="text-body-sm text-text-secondary">flat — 기본 카드</p>
              </CardContent>
            </Card>
            <Card variant="elevated" className="gap-0">
              <CardContent className="pt-4 pb-4">
                <p className="text-body-sm text-text-secondary">elevated — 그림자 강조</p>
              </CardContent>
            </Card>
            <Card variant="interactive" className="gap-0">
              <CardContent className="pt-4 pb-4">
                <p className="text-body-sm text-text-secondary">interactive — hover 효과</p>
              </CardContent>
            </Card>
            <Card variant="accent" className="gap-0">
              <CardContent className="pt-4 pb-4">
                <p className="text-body-sm text-text-secondary">accent — 브랜드 소프트</p>
              </CardContent>
            </Card>
            <Card variant="flat" className="gap-0">
              <CardHeader className="pb-2">
                <CardTitle>CardHeader + Title</CardTitle>
                <CardDescription>CardDescription 텍스트</CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <p className="text-caption text-text-tertiary">CardContent 영역</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ── Chip ── */}
        <section>
          <SectionHeader title="Chip" className="mb-4" />
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {chips.map((c) => (
                <Chip
                  key={c}
                  asButton
                  selected={selectedChip === c}
                  onClick={() => setSelectedChip(selectedChip === c ? null : c)}
                >
                  {c}
                </Chip>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip variant="category" size="sm">카테고리</Chip>
              <Chip variant="count" size="sm">12</Chip>
              <Chip variant="default" size="sm">sm 기본</Chip>
              <Chip variant="selected" size="sm">sm 선택됨</Chip>
            </div>
          </div>
        </section>

        {/* ── StatBlock ── */}
        <section>
          <SectionHeader title="StatBlock" className="mb-4" />
          <Card variant="flat" className="gap-0">
            <StatRow>
              <StatBlock value={23} label="성공 쌍" icon={<Heart />} emphasis />
              <StatBlock value="4.9" label="평균 평점" icon={<Star />} />
              <StatBlock value="56%" label="성사율" />
            </StatRow>
          </Card>
        </section>

        {/* ── ListRow ── */}
        <section>
          <SectionHeader title="ListRow" className="mb-4" />
          <Card variant="flat" className="gap-0 px-4">
            <ListRow label="이름" value="김지혜" />
            <ListRow label="이메일" value="user@example.com" leading={<User className="w-4 h-4" />} />
            <ListRow label="알림 설정" showChevron onClick={() => {}} />
            <ListRow label="비활성 항목" value="비공개" disabled />
          </Card>
        </section>

        {/* ── ToggleRow ── */}
        <section>
          <SectionHeader title="ToggleRow" className="mb-4" />
          <Card variant="flat" className="gap-0 px-4">
            <ToggleRow
              label="푸시 알림"
              description="매칭 요청 및 업데이트 알림을 받아요"
              control={<Switch checked={toggle1} onCheckedChange={setToggle1} />}
            />
            <ToggleRow
              label="마케팅 알림"
              control={<Switch checked={toggle2} onCheckedChange={setToggle2} />}
            />
            <ToggleRow
              label="비활성 항목"
              description="현재 사용할 수 없어요"
              control={<Switch checked={false} disabled />}
              disabled
            />
          </Card>
        </section>

        {/* ── LevelBar ── */}
        <section>
          <SectionHeader title="LevelBar" className="mb-4" />
          <Card variant="flat" className="gap-0">
            <CardContent className="pt-4 pb-4 space-y-4">
              {([1, 2, 3, 4, 5] as const).map((lv) => {
                const tier = tierFor(lv);
                const nt = nextTier(lv);
                const current = [1, 4, 8, 14, 23][lv - 1];
                return (
                  <LevelBar
                    key={lv}
                    level={lv}
                    levelName={tier.name}
                    color={tier.color}
                    current={current}
                    next={nt?.minMatches}
                    nextName={nt?.name}
                  />
                );
              })}
            </CardContent>
          </Card>
        </section>

        {/* ── EmptyState ── */}
        <section>
          <SectionHeader title="EmptyState" className="mb-4" />
          <Card variant="flat" className="gap-0">
            <EmptyState
              icon={<Search className="w-6 h-6" />}
              title="검색 결과가 없어요"
              body="다른 조건으로 다시 검색해 보세요"
              action={<Button variant="soft" size="sm">조건 초기화</Button>}
            />
          </Card>
          <Card variant="flat" className="gap-0 mt-3">
            <EmptyState
              icon={<Package className="w-6 h-6" />}
              title="아직 매칭 기록이 없어요"
            />
          </Card>
        </section>

        {/* ── SectionHeader Variants ── */}
        <section>
          <SectionHeader title="SectionHeader" className="mb-4" />
          <Card variant="flat" className="gap-0">
            <CardContent className="pt-4 pb-4 space-y-4">
              <SectionHeader title="후기" />
              <SectionHeader title="후기" subtitle="최근 3개월" />
              <SectionHeader
                title="후기"
                subtitle="총 21개"
                action={<Button variant="ghost" size="sm">더보기</Button>}
              />
            </CardContent>
          </Card>
        </section>

        {/* ── Radius & Shadow ── */}
        <section>
          <SectionHeader title="Radius & Shadow" className="mb-4" />
          <div className="flex flex-wrap gap-3">
            {[
              { label: "sm",   cls: "rounded-sm" },
              { label: "md",   cls: "rounded-md" },
              { label: "lg",   cls: "rounded-lg" },
              { label: "xl",   cls: "rounded-xl" },
              { label: "2xl",  cls: "rounded-2xl" },
              { label: "pill", cls: "rounded-pill" },
            ].map(({ label, cls }) => (
              <div key={label} className={`${cls} bg-brand-soft border border-primary/20 px-4 py-2 text-caption text-primary`}>
                {label}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {[
              { label: "shadow-sm", shadow: "shadow-sm" },
              { label: "shadow-md", shadow: "shadow-md" },
              { label: "shadow-lg", shadow: "shadow-lg" },
            ].map(({ label, shadow }) => (
              <div key={label} className={`${shadow} bg-surface rounded-lg px-4 py-3 text-caption text-text-secondary`}>
                {label}
              </div>
            ))}
          </div>
        </section>

        {/* ──────────────────────── P6 SKELETON ──────────────────────── */}
        <section>
          <SectionHeader title="Skeleton" subtitle="P6 shimmer presets" className="mb-4" />
          <div className="space-y-3">
            <SkeletonProfileHeader className="bg-surface-elevated border border-border-subtle rounded-lg px-4 py-3" />
            <SkeletonCard />
            <SkeletonListRow rows={3} />
          </div>
        </section>

        {/* ──────────────────────── P3 COLOR IDENTITY ──────────────────────── */}

        {/* ── ColorTypeBadge ── */}
        <section>
          <SectionHeader title="ColorTypeBadge" subtitle="P3" className="mb-4" />
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {Object.values(COLOR_TYPES).map((ct) => (
                <ColorTypeBadge key={ct.key} colorType={ct.key} />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {Object.values(COLOR_TYPES).map((ct) => (
                <ColorTypeBadge key={ct.key} colorType={ct.key} style="soft" />
              ))}
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {Object.values(COLOR_TYPES).map((ct) => (
                <ColorTypeBadge key={ct.key} colorType={ct.key} style="dot" size="lg" />
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <ColorTypeBadge colorType="blue" size="sm" />
              <ColorTypeBadge colorType="blue" size="md" />
              <ColorTypeBadge colorType="blue" size="lg" />
            </div>
          </div>
        </section>

        {/* ── ColorTypeAura ── */}
        <section>
          <SectionHeader title="ColorTypeAura" subtitle="P3 — 아바타 글로우" className="mb-4" />
          <div className="flex items-center gap-6 flex-wrap">
            {(["orange", "blue", "pink", "green"] as ColorTypeKey[]).map((ct) => (
              <div key={ct} className="flex flex-col items-center gap-2">
                <ColorTypeAura colorType={ct} size={64} ring intensity="medium">
                  <div className="w-full h-full bg-surface-sunken flex items-center justify-center text-title font-bold text-text-secondary">
                    {COLOR_TYPES[ct].label.charAt(0)}
                  </div>
                </ColorTypeAura>
                <span className="text-caption text-text-tertiary">{COLOR_TYPES[ct].label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── AccentScope ── */}
        <section>
          <SectionHeader title="AccentScope" subtitle="P3 — 런타임 컬러 주입" className="mb-4" />
          <div className="space-y-3">
            {(["blue", "pink", "green", "purple"] as ColorTypeKey[]).map((ct) => (
              <AccentScope key={ct} colorType={ct}>
                <Card variant="flat" className="gap-0">
                  <CardContent className="pt-4 pb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-user-accent-soft flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-user-accent" />
                      </div>
                      <div>
                        <p className="text-body-sm font-semibold text-text-primary">{COLOR_TYPES[ct].label} 유저</p>
                        <p className="text-caption text-text-tertiary">{COLOR_TYPES[ct].description}</p>
                      </div>
                    </div>
                    <Button variant="soft" size="sm" className="border-user-accent/30 bg-user-accent-soft text-text-primary">
                      보기
                    </Button>
                  </CardContent>
                </Card>
              </AccentScope>
            ))}
          </div>
        </section>

        {/* ── MatchPairMark ── */}
        <section>
          <SectionHeader title="MatchPairMark" subtitle="P3 — 컬러 호환성" className="mb-4" />
          <Card variant="flat" className="gap-0">
            <CardContent className="pt-4 pb-4 space-y-4">
              <MatchPairMark myColor="orange" theirColor="blue" />
              <MatchPairMark myColor="pink" theirColor="green" />
              <MatchPairMark myColor="purple" theirColor="yellow" />
              <MatchPairMark myColor="orange" theirColor="orange" />
            </CardContent>
          </Card>
        </section>

        {/* ── TrustTier ── */}
        <section>
          <SectionHeader title="TrustTier" subtitle="P3 — 신뢰도 등급" className="mb-4" />
          <Card variant="flat" className="gap-0">
            <CardContent className="pt-4 pb-4 space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <TrustTier score={85} size="sm" />
                <TrustTier score={55} size="md" />
                <TrustTier score={25} size="lg" />
              </div>
              <div className="space-y-2 pt-2">
                <TrustTier score={85} showBar showScore />
                <TrustTier score={55} showBar showScore />
                <TrustTier score={25} showBar showScore />
              </div>
            </CardContent>
          </Card>
        </section>

      </div>
    </div>
  );
}
