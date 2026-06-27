/**
 * MatchDetailScreen — F01 + F02 + F03 + F13 통합
 *
 * 탭 구조:
 *   [프로필 탭] — MatchHero / MatchmakerComment / PhotoCarousel
 *                CompatibilityList / CategoryCard
 *   [대화방 탭] — ChatThread (F02)
 *
 * 우상단: SafetyMenu (F03)
 * Sticky Bottom: MatchActionBar (F01) + F13 PaywallSheet
 */
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

import { MatchHero } from "./match/MatchHero";
import { MatchmakerComment } from "./match/MatchmakerComment";
import { CompatibilityList } from "./match/CompatibilityList";
import { PhotoCarousel } from "./match/PhotoCarousel";
import { MatchActionBar } from "./match/MatchActionBar";
import { ChatThread } from "./chat/ChatThread";
import { SafetyMenu } from "./safety/SafetyMenu";
import { PaywallSheet } from "./paywall/PaywallSheet";
import { TicketCounter } from "./paywall/TicketCounter";
import { VerifyBadge } from "./verify/VerifyBadge";
import { ColorTypeBadge } from "./color/ColorTypeBadge";
import { CategoryCard } from "./profile/CategoryCard";

import { calculateMatchScore } from "../../lib/match-score";
import { getVisibleProfile } from "../../lib/profile-visibility";
import { PROFILE_GROUPS, toProfileValues } from "../../lib/profileSchema";
import { useTickets } from "../../lib/tickets";
import type { MatchDetail } from "../../data/mock-matches";
import { EmptyState } from "./ui/empty-state";
import { cn } from "./ui/utils";

interface MatchDetailScreenProps {
  matchId?: string;
  onBack: () => void;
  onNavigateToChat?: () => void;
}

type Tab = "profile" | "chat";

export function MatchDetailScreen({ matchId, onBack, onNavigateToChat }: MatchDetailScreenProps) {
  // 매칭 상세 백엔드 미구현 — 항상 빈/안내 상태 (mock 미노출, MVP 제한)
  const match: MatchDetail | undefined = undefined;
  const { balance, spend, earn } = useTickets();

  const [tab, setTab] = useState<Tab>("profile");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [localStatus, setLocalStatus] = useState<MatchDetail["status"]>(match?.status ?? "pending");

  if (!match) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
          <button
            onClick={onBack}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-sunken"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5 text-text-primary" />
          </button>
          <h1 className="text-body font-semibold text-text-primary">매칭 상세</h1>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            title="매칭 상세는 준비 중이에요"
            description="매칭 상세 화면을 준비하고 있어요. 곧 상대의 프로필과 대화를 확인할 수 있어요."
          />
        </div>
      </div>
    );
  }

  const visCtx = {
    viewerId: "me-001",
    targetId: match.partner.userId,
    isMutual: localStatus === "mutual",
    hasPlus: false,
    hasTicket: balance > 0,
  };
  const visible = getVisibleProfile(match.partner, visCtx);

  const scoreResult = calculateMatchScore(
    {
      colorType: match.me.colorType,
      mbti: match.me.mbti,
      location: match.me.location,
      smoking: match.me.smoking,
      drinking: match.me.drinking,
      religion: match.me.religion,
    },
    {
      colorType: match.partner.colorType,
      mbti: match.partner.mbti,
      location: match.partner.location,
      smoking: match.partner.smoking,
      drinking: match.partner.drinking,
      religion: match.partner.religion,
    },
  );

  const profileValues = toProfileValues({
    basicInfo: {
      height: match.partner.height ?? null,
      bodyType: match.partner.bodyType ?? null,
      mbti: match.partner.mbti ?? null,
    },
    careerInfo: { category: match.partner.jobCategory ?? null, company: null },
    educationInfo: { level: null, school: null, major: null },
    locationInfo: {
      sido: match.partner.location?.split(" ")[0] ?? null,
      sigungu: match.partner.location?.split(" ")[1] ?? null,
    },
    lifestyleInfo: {
      smoking: match.partner.smoking ?? null,
      drinking: match.partner.drinking ?? null,
      religion: match.partner.religion ?? null,
    },
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* TopBar */}
      <div
        className="sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{
          background: "hsl(var(--surface) / 0.96)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 1px 0 hsl(0 0% 0% / 0.06)",
        }}
      >
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-sunken transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>

        <div className="flex items-center gap-1.5">
          <TicketCounter balance={balance} onClick={() => setPaywallOpen(true)} />
          <SafetyMenu
            targetName={match.partner.name}
            targetUserId={match.partner.userId}
            targetType="user"
            onBlock={onBack}
          />
        </div>
      </div>

      {/* 탭 */}
      <div className="flex border-b border-border-subtle bg-surface">
        {(["profile", "chat"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 py-3 text-body-sm font-semibold transition-colors",
              tab === t
                ? "text-brand border-b-2 border-brand -mb-px"
                : "text-text-tertiary",
            )}
          >
            {t === "profile" ? "프로필" : "대화방"}
          </button>
        ))}
      </div>

      {/* 컨텐츠 */}
      {tab === "profile" ? (
        <div className="flex-1 overflow-y-auto pb-24">
          {/* HERO */}
          <MatchHero
            myColor={match.me.colorType}
            theirColor={match.partner.colorType}
            score={scoreResult.score}
            label={scoreResult.label}
            theirName={visible.name}
          />

          <div className="space-y-3 px-4">
            {/* 상대 기본 정보 */}
            <div className="bg-surface shadow-card rounded-lg px-4 py-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-white text-title font-bold shadow-soft"
                  style={{ backgroundColor: `hsl(${220} ${8}% ${70}%)` }}
                >
                  {visible.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h2 className="text-title font-bold text-text-primary">
                      {visible.name}
                    </h2>
                    <VerifyBadge verified={visible.isVerified} size="sm" />
                  </div>
                  <p className="text-body-sm text-text-secondary mt-0.5">
                    {visible.age}세 · {visible.location}
                  </p>
                  <div className="mt-1.5">
                    <ColorTypeBadge colorType={visible.colorType} style="pill" />
                  </div>
                </div>
              </div>
            </div>

            {/* 사진 캐러셀 */}
            {visible.photoUrls.length > 0 && (
              <PhotoCarousel
                photos={visible.photoUrls}
                alt={visible.name}
                additionalLocked={visible.additionalPhotosLocked}
              />
            )}

            {/* 주선자 한마디 */}
            <MatchmakerComment
              matchmaker={match.matchmaker}
              onMore={() => setTab("chat")}
            />

            {/* 공통점 */}
            <CompatibilityList variant="common" points={match.compatibilityPoints} />

            {/* 다른 점 */}
            <CompatibilityList variant="different" points={match.compatibilityPoints} />

            {/* 기본 정보 CategoryCard */}
            {PROFILE_GROUPS.map((group) => (
              <CategoryCard
                key={group.key}
                group={group}
                values={profileValues}
                mode="view"
                collapsible
                defaultOpen={group.key === "basic"}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0" style={{ height: "calc(100vh - 120px)" }}>
          <ChatThread match={match} />
        </div>
      )}

      {/* Sticky 액션바 (프로필 탭에만) */}
      {tab === "profile" && (
        <MatchActionBar
          matchmakerName={match.matchmaker.name}
          status={localStatus}
          hasTicket={balance > 0}
          onLike={() => setLocalStatus("liked")}
          onPass={(reason) => {
            setLocalStatus("passed");
          }}
          onTicketRequired={() => setPaywallOpen(true)}
        />
      )}

      {/* Paywall */}
      <PaywallSheet
        open={paywallOpen}
        onClose={() => setPaywallOpen(false)}
        balance={balance}
        onEarn={(trigger) => {
          earn(trigger);
          toast.success("매칭권을 받았어요");
        }}
        onPurchase={() => toast.info("결제 기능은 곧 오픈돼요!")}
      />
    </div>
  );
}
