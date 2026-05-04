import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowLeft, Star, TrendingUp, Wallet, RefreshCw, Award } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";

interface MatchmakerData {
  matchmakerId: string;
  level: number;
  commissionRate: number;
  totalPoints: number;
  availablePoints: number;
  withdrawnPoints: number;
  pendingPoints: number;
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

const LEVEL_INFO = [
  { level: 1, minMatches: 0, maxMatches: 2, commission: 30, label: "씨앗", emoji: "🌱" },
  { level: 2, minMatches: 3, maxMatches: 5, commission: 35, label: "새싹", emoji: "🌿" },
  { level: 3, minMatches: 6, maxMatches: 10, commission: 40, label: "나무", emoji: "🌳" },
  { level: 4, minMatches: 11, maxMatches: 20, commission: 45, label: "열매", emoji: "🍎" },
  { level: 5, minMatches: 21, maxMatches: Infinity, commission: 50, label: "숲", emoji: "🌲" },
];

export function MatchmakerRewardScreen({ onBack }: MatchmakerRewardScreenProps) {
  const [data, setData] = useState<MatchmakerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"level" | "points">("level");

  useEffect(() => {
    loadData();
  }, []);

  const MOCK_DATA: MatchmakerData = {
    matchmakerId: "mock-001",
    level: 2,
    commissionRate: 0.35,
    totalPoints: 4500,
    availablePoints: 3200,
    withdrawnPoints: 1000,
    pendingPoints: 300,
    totalMatchRequests: 8,
    approvedRequests: 6,
    rejectedRequests: 2,
    successfulMatches: 3,
    failedMatches: 1,
    successRate: 0.5,
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<MatchmakerData>("/api/v1/matchmakers/me");
      setData(res);
    } catch {
      // API 미연결 시 mock 데이터로 fallback
      setData(MOCK_DATA);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount <= 0) {
      toast.error("출금할 포인트를 입력해주세요");
      return;
    }
    if (data && amount > data.availablePoints) {
      toast.error("출금 가능 포인트를 초과합니다");
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await api.post<{ message: string }>("/api/v1/matchmakers/me/withdraw", { amount });
      toast.success(res.message || "출금 신청이 완료되었습니다");
      setWithdrawAmount("");
      setShowWithdrawForm(false);
      await loadData();
    } catch (e: any) {
      toast.error(e?.message || "출금에 실패했습니다");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
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
      {/* Header */}
      <div className="flex-shrink-0 bg-background border-b border-border z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={onBack} className="p-2 hover:bg-accent rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">주선자 등급 & 포인트</h1>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 flex gap-1">
          {(["level", "points"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "level" ? "등급 현황" : "포인트 & 출금"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* ─── Level Tab ─── */}
        {activeTab === "level" && (
          <>
            {/* Current Level Card */}
            <div className="bg-gradient-to-br from-primary to-primary/70 rounded-2xl p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm opacity-80">현재 등급</p>
                  <p className="text-3xl font-bold mt-1">
                    {currentLevelInfo.emoji} Lv.{data.level} {currentLevelInfo.label}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">커미션율</p>
                  <p className="text-2xl font-bold">{currentLevelInfo.commission}%</p>
                </div>
              </div>

              {/* Progress to next level */}
              {nextLevelInfo ? (
                <>
                  <div className="flex justify-between text-sm opacity-80 mb-1">
                    <span>Lv.{data.level}</span>
                    <span>Lv.{data.level + 1} {nextLevelInfo.emoji}</span>
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
                <p className="text-sm opacity-80 text-center mt-2">🏆 최고 등급 달성!</p>
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

            {/* Level Guide */}
            <div className="bg-card rounded-2xl border border-border p-4 space-y-3">
              <p className="text-sm font-semibold">등급별 커미션율</p>
              {LEVEL_INFO.map(info => (
                <div
                  key={info.level}
                  className={`flex items-center justify-between rounded-xl px-4 py-3 transition-colors ${
                    info.level === data.level
                      ? "bg-primary/10 border border-primary/30"
                      : "bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{info.emoji}</span>
                    <div>
                      <p className={`text-sm font-medium ${info.level === data.level ? "text-primary" : ""}`}>
                        Lv.{info.level} {info.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {info.level === 5
                          ? `${info.minMatches}건+`
                          : `${info.minMatches}~${info.maxMatches}건`}
                      </p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${info.level === data.level ? "text-primary" : "text-muted-foreground"}`}>
                    {info.commission}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ─── Points Tab ─── */}
        {activeTab === "points" && (
          <>
            {/* Points Summary */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                <p className="font-semibold">포인트 현황</p>
              </div>

              <div className="space-y-3">
                <PointRow label="출금 가능 포인트" value={data.availablePoints} highlight />
                <div className="h-px bg-border" />
                <PointRow label="총 적립 포인트" value={data.totalPoints} />
                <PointRow label="출금 완료" value={data.withdrawnPoints} dimmed />
                <PointRow label="처리 중" value={data.pendingPoints} dimmed />
              </div>

              <div className="bg-primary/5 rounded-xl p-3 text-sm text-muted-foreground">
                <p>💡 성사 1건당 1,500P 적립 (커미션 {currentLevelInfo.commission}% 별도 지급)</p>
              </div>
            </div>

            {/* Withdraw Section */}
            <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">포인트 출금</p>
                <span className="text-sm text-muted-foreground">1P = 1원</span>
              </div>

              {!showWithdrawForm ? (
                <Button
                  className="w-full gap-2"
                  onClick={() => setShowWithdrawForm(true)}
                  disabled={data.availablePoints === 0}
                >
                  <Wallet className="w-4 h-4" />
                  출금 신청
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="출금할 포인트 입력"
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      max={data.availablePoints}
                      min={1}
                    />
                    <Button
                      variant="outline"
                      onClick={() => setWithdrawAmount(String(data.availablePoints))}
                    >
                      전액
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    출금 가능: {data.availablePoints.toLocaleString()}P
                    {withdrawAmount && ` → ${parseInt(withdrawAmount).toLocaleString()}원`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => { setShowWithdrawForm(false); setWithdrawAmount(""); }}
                    >
                      취소
                    </Button>
                    <Button
                      className="flex-1 gap-2"
                      onClick={handleWithdraw}
                      disabled={isWithdrawing}
                    >
                      {isWithdrawing && <RefreshCw className="w-4 h-4 animate-spin" />}
                      출금 신청
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    출금 신청 후 영업일 기준 3-5일 내 처리됩니다
                  </p>
                </div>
              )}
            </div>
          </>
        )}
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

function PointRow({
  label,
  value,
  highlight,
  dimmed,
}: {
  label: string;
  value: number;
  highlight?: boolean;
  dimmed?: boolean;
}) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-sm ${dimmed ? "text-muted-foreground" : ""}`}>{label}</span>
      <span className={`font-semibold ${highlight ? "text-primary text-lg" : dimmed ? "text-muted-foreground" : ""}`}>
        {value.toLocaleString()}P
      </span>
    </div>
  );
}
