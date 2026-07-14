import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { api } from "../../../lib/api/apiClient";
import {
  COLOR_META,
  COMPAT_STYLE,
  getCompatibilityDeterministic,
  type ColorType,
  type CompatibilityType,
} from "../../../lib/colorCompatibility";

interface MutualFriend {
  name: string;
}

interface ColorTypeData {
  type: string | null;
  name: string | null;
  hex: string | null;
  description: string | null;
  personalitySummary?: string | null;
  strengths?: string[] | null;
  idealTypeInsight?: string | null;
}

interface DiscoveryProfile {
  introduction: {
    interests: string[];
    interviewAnswers?: {
      hobby: string | null;
      charm: string | null;
      passion: string | null;
      happiness: string | null;
      motto: string | null;
    } | null;
  };
  attachmentProfile?: {
    attachmentTypeLabel?: string;
    attachmentTypeDescription?: string;
    attachmentTypeEmoji?: string;
  } | null;
  colorType: ColorTypeData | null;
}

interface ProfileDiscoveryDeckProps {
  profile: DiscoveryProfile;
  targetUserId: string;
  mutualFriends: MutualFriend[];
}

type CardKind = "color" | "compat" | "connection" | "psychology" | "ideal";

interface DiscoveryCard {
  kind: CardKind;
  title: string;
  body: string;
  chips?: string[];
  accent?: string;
  compatScore?: number;
  compatLabel?: string;
  compatType?: CompatibilityType;
  myHex?: string;
  theirHex?: string;
}

const COLOR_INSIGHT: Record<CompatibilityType, string> = {
  complementary: "서로 다른 에너지가 빈자리를 채워줘요.",
  analogous: "결이 비슷해서 자연스럽게 어우러져요.",
  contrast: "강한 대비가 서로에게 새로운 시각을 열어줘요.",
};

function buildCards(
  profile: DiscoveryProfile,
  myColorType: ColorType | null,
  myInterests: string[],
  mutualFriends: MutualFriend[],
  targetUserId: string,
): DiscoveryCard[] {
  const cards: DiscoveryCard[] = [];
  const ct = profile.colorType;
  const theirType = (ct?.type ?? null) as ColorType | null;
  const theirHex = ct?.hex ?? undefined;

  if (ct?.name) {
    cards.push({
      kind: "color",
      title: "이 사람의 색",
      body:
        ct.personalitySummary?.trim() ||
        ct.description?.trim() ||
        "이 분만의 색깔로 만나보세요.",
      chips: ct.strengths?.slice(0, 3) ?? undefined,
      accent: ct.hex ?? undefined,
    });
  }

  if (theirType && theirHex && myColorType) {
    const compat = getCompatibilityDeterministic(myColorType, theirType, targetUserId);
    const myHex = COLOR_META[myColorType]?.hex;
    if (compat && myHex) {
      cards.push({
        kind: "compat",
        title: "우리 색 궁합",
        body: `${COLOR_INSIGHT[compat.type]} ${compat.tagline}`,
        compatScore: compat.score,
        compatLabel: `${COLOR_META[myColorType].name} × ${ct?.name ?? ""}`,
        compatType: compat.type,
        myHex,
        theirHex,
        accent: theirHex,
      });
    }
  }

  const theirInterests = profile.introduction.interests ?? [];
  const common = theirInterests.filter((i) => myInterests.includes(i));
  const friendNames = mutualFriends.map((f) => f.name).filter(Boolean);

  if (friendNames.length > 0 || common.length > 0) {
    const parts: string[] = [];
    if (friendNames.length > 0) {
      const shown = friendNames.slice(0, 2).join("·");
      parts.push(
        friendNames.length > 2
          ? `공통 친구 ${shown} 외 ${friendNames.length - 2}명`
          : `공통 친구 ${shown}`,
      );
    }
    if (common.length > 0) {
      parts.push(`둘 다 ${common.slice(0, 3).join("·")}`);
    }
    cards.push({
      kind: "connection",
      title: "연결고리",
      body: parts.join(" · ") || "지인 네트워크로 이어진 인연이에요.",
      chips: common.length > 0 ? common.slice(0, 4) : undefined,
      accent: theirHex,
    });
  }

  const ap = profile.attachmentProfile;
  if (ap?.attachmentTypeLabel) {
    cards.push({
      kind: "psychology",
      title: "마음의 온도",
      body: ap.attachmentTypeDescription?.trim() || ap.attachmentTypeLabel,
      chips: ap.attachmentTypeEmoji ? [ap.attachmentTypeEmoji] : undefined,
      accent: theirHex,
    });
  }

  if (ct?.idealTypeInsight?.trim()) {
    cards.push({
      kind: "ideal",
      title: "어울리는 인연",
      body: ct.idealTypeInsight.trim(),
      accent: theirHex,
    });
  }

  return cards;
}

function DiscoveryCardView({ card }: { card: DiscoveryCard }) {
  const compatStyle =
    card.kind === "compat" && card.compatType ? COMPAT_STYLE[card.compatType] : null;

  const bgStyle =
    card.kind === "compat" && compatStyle
      ? undefined
      : card.accent
        ? {
            backgroundColor: `${card.accent}${card.kind === "color" ? "18" : "10"}`,
            borderColor: `${card.accent}${card.kind === "color" ? "35" : "28"}`,
          }
        : undefined;

  return (
    <div
      className={`rounded-2xl border p-4 h-full min-h-[148px] flex flex-col ${
        compatStyle ? `${compatStyle.bg} ${compatStyle.border}` : "bg-card"
      }`}
      style={bgStyle}
    >
      <p className="text-xs font-semibold text-muted-foreground mb-2">{card.title}</p>

      {card.kind === "compat" && card.myHex && card.theirHex && (
        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center shrink-0">
            <span
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: card.myHex }}
            />
            <span
              className="w-6 h-6 rounded-full border-2 border-white shadow-sm -ml-1.5"
              style={{ backgroundColor: card.theirHex }}
            />
          </div>
          {card.compatScore != null && (
            <span className="text-lg font-bold text-foreground">{card.compatScore}%</span>
          )}
        </div>
      )}

      {card.compatLabel && (
        <p className="text-[11px] text-muted-foreground mb-1.5">{card.compatLabel}</p>
      )}

      <p className="text-sm text-foreground leading-relaxed flex-1">{card.body}</p>

      {card.chips && card.chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {card.chips.map((chip, i) => (
            <span
              key={i}
              className="inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-foreground"
              style={
                card.accent && card.kind !== "psychology"
                  ? { backgroundColor: `${card.accent}15`, color: card.accent }
                  : undefined
              }
            >
              {chip}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ProfileDiscoveryDeck({
  profile,
  targetUserId,
  mutualFriends,
}: ProfileDiscoveryDeckProps) {
  const [myColorType, setMyColorType] = useState<ColorType | null>(null);
  const [myInterests, setMyInterests] = useState<string[]>([]);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", containScroll: "trimSnaps" });
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    api
      .get<{ colorType?: { type?: string }; introduction?: { interests?: string[] } }>(
        "/api/v1/profile",
      )
      .then((p) => {
        setMyColorType((p.colorType?.type ?? null) as ColorType | null);
        setMyInterests(p.introduction?.interests ?? []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setCurrent(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  const cards = buildCards(profile, myColorType, myInterests, mutualFriends, targetUserId);
  if (cards.length === 0) return null;

  if (cards.length === 1) {
    return (
      <div className="px-4 mt-4">
        <DiscoveryCardView card={cards[0]} />
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="px-4 flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">밀어서 더 알아보기 →</p>
      </div>
      <div ref={emblaRef} className="overflow-hidden px-4">
        <div className="flex gap-3 touch-pan-y">
          {cards.map((card, i) => (
            <div key={i} className="flex-none w-[82%] sm:w-[78%]">
              <DiscoveryCardView card={card} />
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {cards.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => emblaApi?.scrollTo(i)}
            className={`rounded-full transition-all ${
              i === current ? "w-4 h-1.5 bg-foreground/70" : "w-1.5 h-1.5 bg-foreground/25"
            }`}
            aria-label={`발견 카드 ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
