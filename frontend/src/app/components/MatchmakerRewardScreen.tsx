import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, Star, TrendingUp, RefreshCw, Award, Sparkles, Heart } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { MATCHMAKER_TIER_LIST } from "../../lib/matchmakerLevels";

interface MatchmakerData {
  matchmakerId: string;
  level: number;
  totalMatchRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
  successfulMatches: number;
  failedMatches: number;
  successRate: number;
}

interface MatchmakerRewardScreenProps {
  onBack: () => void;
}

// 단일 소스(lib/matchmakerLevels)에서 파생 — label = 등급명
const LEVEL_INFO = MATCHMAKER_TIER_LIST.map((t) => ({
  level: t.level,
  minMatches: t.minMatches,
  maxMatches: t.maxMatches,
  label: t.name,
}));

export function MatchmakerRewardScreen({ onBack }: MatchmakerRewardScreenProps) {
  const [data, setData] = useState<MatchmakerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<MatchmakerData>("/api/v1/matchmakers/me");
      setData(res);
    } catch {
      // mock 으로 채우지 않고 에러 상태(아래 !data 분기)로 안내
      setData(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // API 실패/빈 응답 시 mock 으로 채우지 않고 안내 노출
  if (!data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <Award className="w-10 h-10 text-muted-foreground" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">등급 정보를 불러오지 못했어요</p>
          <p className="text-sm text-muted-foreground">잠시 후 다시 시도해주세요</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData} className="gap-2">
            <RefreshCw className="w-4 h-4" />
            다시 시도
          </Button>
          <Button variant="ghost" onClick={onBack}>
            돌아가기
          </Button>
        </div>
      </div>
    );
  }

  const currentLevelInfo = LEVEL_INFO.find(l => l.level === data.level) ?? LEVEL_INFO[0];
  const nextLevelInfo = LEVEL_INFO.find(l => l.level === data.level + 1);
  const matchesUntilNext = nextLevelInfo
    ? nextLevelInfo.minMatches - data.successfulMatches
    : 0;
  const progressPercent = nextLevelInfo
    ? Math.min(100, ((data.successfulMatches - currentLevelInfo.minMatches) /
        (nextLevelInfo.minMatches - currentLevelInfo.minMatches)) * 100)
    : 100;

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* 통일 헤더 (ADR 0014) */}
      <header className="sticky top-0 z-10 flex-shrink-0 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-muted/50 transition-colors -ml-1.5" aria-label="뒤로">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-foreground">주선자 등급</h1>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">

        {/* Current Level Card */}
        <div className="bg-gradient-to-br from-primary to-primary/70 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm opacity-80">현재 등급</p>
              <p className="text-3xl font-bold mt-1">
                Lv.{data.level} <span className="font-medium opacity-90">{currentLevelInfo.label}</span>
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-80">누적 성사</p>
              <p className="text-2xl font-bold">{data.successfulMatches}건</p>
            </div>
          </div>

          {/* Progress to next level */}
          {nextLevelInfo ? (
            <>
              <div className="flex justify-between text-sm opacity-80 mb-1">
                <span>Lv.{data.level}</span>
                <span>Lv.{data.level + 1} {nextLevelInfo.label}</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-2">
                <div
                  className="bg-white rounded-full h-2 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-xs opacity-80 mt-2 text-right">
                {matchesUntilNext > 0
                  ? `다음 등급까지 ${matchesUntilNext}번의 성사 필요`
                  : "다음 등급까지 거의 다 왔어요!"}
              </p>
            </>
          ) : (
            <p className="text-sm opacity-80 text-center mt-2 inline-flex items-center justify-center gap-1.5 w-full"><Award className="w-4 h-4" /> 최고 등급 달성!</p>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="총 성사"
            value={`${data.successfulMatches}건`}
            icon={<Award className="w-5 h-5 text-yellow-500" />}
            highlight
          />
          <StatCard
            label="성사율"
            value={`${(data.successRate * 100).toFixed(0)}%`}
            icon={<TrendingUp className="w-5 h-5 text-green-500" />}
          />
          <StatCard
            label="총 요청"
            value={`${data.totalMatchRequests}건`}
            icon={<Star className="w-5 h-5 text-primary" />}
          />
          <StatCard
            label="승인/거절"
            value={`${data.approvedRequests}/${data.rejectedRequests}`}
            icon={<RefreshCw className="w-5 h-5 text-blue-500" />}
          />
        </div>

        {/* Level Guide — 성사 누계 기준 */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card p-4 space-y-3">
          <p className="text-sm font-semibold">등급 기준</p>
          {LEVEL_INFO.map(info => (
            <div
              key={info.level}
              className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                info.level === data.level
                  ? "bg-brand-soft border border-primary/30"
                  : "bg-muted/50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold tabular-nums ${
                  info.level === data.level
                    ? "bg-gold text-gold-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>{info.level}</span>
                <p className={`text-sm font-medium ${info.level === data.level ? "text-primary" : ""}`}>
                  Lv.{info.level} {info.label}
                </p>
              </div>
              <span className={`text-xs ${info.level === data.level ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                {info.level === 5 ? `${info.minMatches}건+` : `${info.minMatches}~${info.maxMatches}건`}
              </span>
            </div>
          ))}
        </div>

        {/* 주선자 명예 안내 — 보상이 아니라 신뢰·보람 (ADR 0064) */}
        <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <p className="font-semibold">주선자로 활동하면</p>
          </div>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
                <Heart className="w-4 h-4 text-primary" />
              </span>
              <div>
                <p className="font-medium text-foreground">소중한 인연을 이어줘요</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  믿을 수 있는 지인이 직접 소개해주는 만남 — 두 사람을 행복하게 이어주는 보람이 가장 큰 보상이에요.
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
                <Award className="w-4 h-4 text-primary" />
              </span>
              <div>
                <p className="font-medium text-foreground">등급과 명예가 쌓여요</p>
                <p className="text-muted-foreground text-xs mt-0.5">
                  성사가 늘수록 주선자 등급이 오르고, 프로필에 신뢰 배지가 표시돼요.
                </p>
              </div>
            </li>
          </ul>
        </div>
      </div>
      </div>  {/* overflow-y-auto wrapper */}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 border ${highlight ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800" : "bg-card border-border"}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
