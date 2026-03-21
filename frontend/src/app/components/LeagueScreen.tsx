import { useState, useEffect } from "react";
import { Trophy, Crown, Medal, Clock, Users } from "lucide-react";
import { api } from "../../lib/api/apiClient";

interface SeasonInfo {
  seasonName: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
}

interface RankEntry {
  rank: number;
  userId: string;
  nickname: string;
  successCount: number;
  tier: string;
  tierEmoji: string;
  tierColor: string;
  isMe: boolean;
}

interface LeagueData {
  season: SeasonInfo;
  myRank: number | null;
  mySuccessCount: number;
  myTier: string;
  myTierEmoji: string;
  myTierColor: string;
  topRankers: RankEntry[];
  totalParticipants: number;
}

const TIER_INFO = [
  { name: "브론즈 큐피드", emoji: "🥉", min: 0, color: "#CD7F32", bg: "bg-orange-50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-orange-800/50" },
  { name: "실버 큐피드", emoji: "🥈", min: 3, color: "#C0C0C0", bg: "bg-gray-50 dark:bg-gray-900/20", border: "border-gray-200 dark:border-gray-700/50" },
  { name: "골드 큐피드", emoji: "🥇", min: 6, color: "#FFD700", bg: "bg-yellow-50 dark:bg-yellow-950/20", border: "border-yellow-200 dark:border-yellow-800/50" },
  { name: "플래티넘 큐피드", emoji: "💎", min: 11, color: "#E5E4E2", bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-200 dark:border-slate-700/50" },
  { name: "다이아 큐피드", emoji: "👑", min: 21, color: "#B9F2FF", bg: "bg-cyan-50 dark:bg-cyan-950/20", border: "border-cyan-200 dark:border-cyan-800/50" },
];

export function LeagueScreen() {
  const [league, setLeague] = useState<LeagueData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<LeagueData>("/api/v1/league")
      .then(setLeague)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  if (!league) return null;

  const nextTier = TIER_INFO.find(t => t.min > league.mySuccessCount);
  const progressToNext = nextTier
    ? Math.min((league.mySuccessCount / nextTier.min) * 100, 100)
    : 100;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/10 to-background pt-6 pb-4 px-6">
        <h2 className="text-center text-xl font-bold">큐피드 리그 🏆</h2>
        <p className="text-center text-sm text-muted-foreground mt-1">{league.season.seasonName}</p>
      </div>

      <div className="px-4 space-y-4 mt-2">
        {/* Season countdown */}
        <div className="bg-card rounded-2xl border border-border p-4 flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">시즌 마감까지</span>
            </div>
            <p className="text-2xl font-bold text-primary">{league.season.daysRemaining}일</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {league.season.startDate} ~ {league.season.endDate}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1.5 justify-end mb-1">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">참가자</span>
            </div>
            <p className="text-2xl font-bold">{league.totalParticipants}명</p>
          </div>
        </div>

        {/* My status */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">내 순위</p>
              <p className="text-2xl font-bold">
                {league.myRank ? `${league.myRank}위` : "순위권 밖"}
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl">{league.myTierEmoji}</div>
              <p className="text-xs font-medium mt-1">{league.myTier}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">이번 달 성사</p>
              <p className="text-2xl font-bold text-primary">{league.mySuccessCount}커플</p>
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div>
              <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                <span>다음 티어까지</span>
                <span>{nextTier.min - league.mySuccessCount}커플 더 필요</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-pink-400 rounded-full transition-all"
                  style={{ width: `${progressToNext}%` }}
                />
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-muted-foreground">{league.myTierEmoji} {league.myTier}</span>
                <span className="font-medium">{nextTier.emoji} {nextTier.name}</span>
              </div>
            </div>
          )}
          {!nextTier && (
            <div className="text-center py-1">
              <p className="text-sm text-primary font-medium">👑 최고 티어 달성! 대단해요!</p>
            </div>
          )}
        </div>

        {/* Tier guide */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Medal className="w-4 h-4 text-primary" />
            티어 기준
          </p>
          <div className="space-y-2">
            {TIER_INFO.map(tier => (
              <div key={tier.name} className={`flex items-center justify-between rounded-xl px-3 py-2 ${tier.bg} border ${tier.border}`}>
                <div className="flex items-center gap-2">
                  <span className="text-lg">{tier.emoji}</span>
                  <span className="text-sm font-medium">{tier.name}</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {tier.min === 0 ? "0커플~" : `${tier.min}커플~`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Rankings */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-yellow-500" />
            이번 달 순위
          </p>
          {league.topRankers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-3xl mb-2">🏹</p>
              <p className="text-sm text-muted-foreground">아직 이번 시즌 성사된 매칭이 없어요</p>
              <p className="text-xs text-muted-foreground mt-1">먼저 커플을 탄생시켜 1위가 되어보세요!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {league.topRankers.map((entry) => (
                <div
                  key={entry.rank}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                    entry.isMe
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/30"
                  }`}
                >
                  {/* Rank number */}
                  <div className="w-7 text-center">
                    {entry.rank === 1 ? (
                      <span className="text-xl">🥇</span>
                    ) : entry.rank === 2 ? (
                      <span className="text-xl">🥈</span>
                    ) : entry.rank === 3 ? (
                      <span className="text-xl">🥉</span>
                    ) : (
                      <span className="text-sm font-bold text-muted-foreground">{entry.rank}</span>
                    )}
                  </div>

                  {/* Tier emoji */}
                  <span className="text-lg">{entry.tierEmoji}</span>

                  {/* Name */}
                  <div className="flex-1">
                    <span className="text-sm font-medium">
                      {entry.nickname}
                      {entry.isMe && <span className="ml-1.5 text-xs text-primary font-normal">(나)</span>}
                    </span>
                  </div>

                  {/* Count */}
                  <div className="text-right">
                    <span className="text-sm font-bold text-primary">{entry.successCount}</span>
                    <span className="text-xs text-muted-foreground ml-0.5">커플</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
