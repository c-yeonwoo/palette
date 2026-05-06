/**
 * RewardLadder — F12 L1~L4 보상 사다리 시각화
 *
 * 달성 단계: accent fill ring
 * 미달성:    회색 outline
 */
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "../ui/utils";
import { REWARD_DESCRIPTIONS, type Invite, type RewardLevel } from "../../../lib/invite-rewards";

interface RewardLadderProps {
  invites?: Invite[];
}

export function RewardLadder({ invites = [] }: RewardLadderProps) {
  // 달성된 최대 레벨 집계
  const maxLevel: RewardLevel | 0 = invites.reduce((acc, inv) => {
    const levels = inv.rewards.map((r) => r.level as RewardLevel);
    const max = levels.length > 0 ? (Math.max(...levels) as RewardLevel) : 0;
    return Math.max(acc, max) as RewardLevel | 0;
  }, 0 as RewardLevel | 0);

  const levels: RewardLevel[] = [1, 2, 3, 4];

  return (
    <div className="space-y-3">
      <h3 className="text-body font-semibold text-text-primary">보상 단계</h3>
      {levels.map((level) => {
        const desc = REWARD_DESCRIPTIONS[level];
        const achieved = maxLevel >= level;

        return (
          <div
            key={level}
            className={cn(
              "flex items-start gap-3 p-4 rounded-2xl border-2 transition-all",
              achieved
                ? "border-brand bg-[hsl(var(--brand)/0.04)]"
                : "border-border-subtle bg-surface",
            )}
          >
            {/* 아이콘 */}
            <div className="flex-shrink-0 mt-0.5">
              {achieved ? (
                <CheckCircle2 className="w-5 h-5 text-brand" />
              ) : (
                <Circle className="w-5 h-5 text-border-subtle" />
              )}
            </div>

            {/* 텍스트 */}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-caption font-bold px-2 py-0.5 rounded-pill",
                    achieved
                      ? "bg-brand text-brand-foreground"
                      : "bg-surface-sunken text-text-tertiary",
                  )}
                >
                  L{level}
                </span>
                <p
                  className={cn(
                    "text-body-sm font-semibold",
                    achieved ? "text-brand" : "text-text-secondary",
                  )}
                >
                  {desc.title}
                </p>
              </div>
              <p className="text-caption text-text-tertiary mt-1">{desc.trigger}</p>
              <div className="mt-2 space-y-0.5">
                <p className="text-caption">
                  <span className="text-text-tertiary">나: </span>
                  <span className="font-medium text-text-primary">{desc.inviterReward}</span>
                </p>
                {desc.inviteeReward !== "—" && (
                  <p className="text-caption">
                    <span className="text-text-tertiary">친구: </span>
                    <span className="font-medium text-text-primary">{desc.inviteeReward}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
