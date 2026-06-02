/**
 * InviteHubScreen — F12 마이페이지 > 친구 초대 허브
 *
 * - "친구를 떠올려보세요" 헤더 + 일러스트
 * - 내 초대 코드 / QR placeholder
 * - 공유 버튼
 * - 진행 현황 (초대 N / 가입 N / 주선 N)
 * - 보상 사다리 (L1~L4)
 * - 초대 히스토리
 */
import { useState } from "react";
import { ArrowLeft, Share2, Users, CheckCircle2, Trophy } from "lucide-react";
import { Button } from "../ui/button";
import { InviteShareSheet } from "./InviteShareSheet";
import { RewardLadder } from "./RewardLadder";
import { getMyInviteCode, buildInviteLink } from "../../../lib/invite-code";
import { type Invite } from "../../../lib/invite-rewards";
import { cn } from "../ui/utils";

interface InviteHubScreenProps {
  onBack: () => void;
}

export function InviteHubScreen({ onBack }: InviteHubScreenProps) {
  const [showShare, setShowShare] = useState(false);
  const [invites] = useState<Invite[]>([]);

  const code = getMyInviteCode();

  const stats = {
    sent:       invites.length,
    joined:     invites.filter((i) => i.status !== "sent").length,
    matchmaker: invites.filter((i) => i.status === "matchmaker" || i.status === "success").length,
    totalRewards: invites.reduce((acc, i) => acc + i.rewards.length, 0),
  };

  const statusLabel: Record<Invite["status"], string> = {
    sent:       "초대장 발송",
    joined:     "가입 완료 ✓",
    tested:     "컬러 진단 완료 ✓",
    matchmaker: "주선 완료 ✓",
    success:    "성사 완료 🎉",
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* 헤더 */}
      <div className="flex items-center px-4 py-3 border-b border-border-subtle">
        <button
          onClick={onBack}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-sunken"
        >
          <ArrowLeft className="w-5 h-5 text-text-primary" />
        </button>
        <h1 className="text-body font-semibold text-text-primary ml-2">친구 초대</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-24 space-y-6 pt-6">
        {/* 히어로 */}
        <div className="text-center space-y-2">
          <div className="text-6xl">🌈</div>
          <h2 className="text-display font-bold text-text-primary">친구를 떠올려보세요</h2>
          <p className="text-body-sm text-text-secondary">
            당신의 색을 누구에게 권하고 싶나요?
            <br />
            함께 하면 더 풍성한 인연이 찾아와요.
          </p>
        </div>

        {/* 초대 코드 카드 */}
        <div
          className="rounded-2xl p-5 space-y-4"
          style={{
            background: "linear-gradient(135deg, hsl(var(--brand)/0.08), hsl(var(--brand)/0.04))",
            border: "1px solid hsl(var(--brand)/0.15)",
          }}
        >
          <div className="text-center">
            <p className="text-caption text-text-secondary mb-1">나의 초대 코드</p>
            <p className="text-display font-bold text-text-primary tracking-[0.2em]">{code}</p>
            <p className="text-caption text-text-tertiary mt-1">{buildInviteLink(code)}</p>
          </div>
          <Button
            variant="brand"
            size="lg"
            className="w-full gap-2"
            onClick={() => setShowShare(true)}
          >
            <Share2 className="w-4 h-4" />
            친구에게 공유하기
          </Button>
        </div>

        {/* 진행 현황 */}
        <div className="bg-surface shadow-card rounded-2xl p-5">
          <h3 className="text-body font-semibold text-text-primary mb-4">진행 현황</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "초대", value: stats.sent,    icon: Share2 },
              { label: "가입", value: stats.joined,  icon: Users },
              { label: "주선", value: stats.matchmaker, icon: Trophy },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="flex flex-col items-center gap-1 py-3 bg-surface-sunken rounded-xl">
                <Icon className="w-4 h-4 text-text-tertiary" />
                <p className="text-title font-bold text-text-primary">{value}</p>
                <p className="text-caption text-text-tertiary">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 보상 사다리 */}
        <RewardLadder invites={invites} />

        {/* 초대 히스토리 */}
        {invites.length > 0 && (
          <div className="bg-surface shadow-card rounded-2xl p-5 space-y-3">
            <h3 className="text-body font-semibold text-text-primary">초대 현황</h3>
            {invites.map((inv) => (
              <div
                key={inv.code}
                className="flex items-center justify-between py-2 border-b border-border-subtle last:border-0"
              >
                <div>
                  <p className="text-body-sm font-medium text-text-primary">
                    {inv.inviteeName ?? "대기 중"}
                  </p>
                  <p className="text-caption text-text-tertiary">
                    {new Date(inv.createdAt).toLocaleDateString("ko-KR")}
                  </p>
                </div>
                <span
                  className={cn(
                    "text-caption font-medium px-2 py-1 rounded-pill",
                    inv.status === "sent"
                      ? "bg-surface-sunken text-text-tertiary"
                      : "bg-[hsl(var(--state-success)/0.10)] text-[hsl(var(--state-success))]",
                  )}
                >
                  {statusLabel[inv.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showShare && (
        <InviteShareSheet
          code={code}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
