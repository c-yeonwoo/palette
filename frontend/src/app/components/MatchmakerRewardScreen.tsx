import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ChevronLeft, Star, TrendingUp, Wallet, RefreshCw, Award, Coins, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";
import { MATCHMAKER_TIER_LIST } from "../../lib/matchmakerLevels";

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

// 단일 소스(lib/matchmakerLevels)에서 파생 — label = 등급명
const LEVEL_INFO = MATCHMAKER_TIER_LIST.map((t) => ({
  level: t.level,
  minMatches: t.minMatches,
  maxMatches: t.maxMatches,
  commission: t.commission,
  label: t.name,
}));

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
      // API 미연결 시 dev 환경에서만 mock 데이터로 fallback
      if (import.meta.env.DEV) {
        setData(MOCK_DATA);
      }
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
        <Wallet className="w-10 h-10 text-muted-foreground" />
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
          <h1 className="text-lg font-bold text-foreground">주선자 등급 & 포인트</h1>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-5 flex gap-1">
          {(["level", "points"] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === t
                  ? "border-brand/50 text-gold-strong"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "level" ? "등급 현황" : "포인트 & 출금"}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-5 py-6 space-y-4">

        {/* ─── Level Tab ─── */}
        {activeTab === "level" && (
          <>
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
                  <p className="text-sm opacity-80">내 몫</p>
                  <p className="text-2xl font-bold">{currentLevelInfo.commission}%</p>
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
            <div className="bg-card rounded-2xl border border-border/60 shadow-card p-4 space-y-3">
              <p className="text-sm font-semibold">등급별 내 몫</p>
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

            {/* 리워드 안내 (ConnectorDashboard 에서 이전 — ADR 0015) */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <p className="font-semibold">리워드 안내</p>
              </div>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
                    <Award className="w-4 h-4 text-primary" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">매칭 성사 분배</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      소개 요청(100 물감) × 등급별 분배율 — Lv.1 15물감 / Lv.5 40물감
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
                    <Coins className="w-4 h-4 text-primary" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">사용자 팁 수령</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      사용자가 자발적으로 보낸 성의 표시의 90% 수령 (10~500 물감)
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">마일스톤 보너스</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      1·5·10·20·50·100·150건 누계 도달 시 +5/+20/+50/+100/+250/+500/+1,000 물감
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-full bg-brand-soft flex items-center justify-center flex-shrink-0">
                    <Wallet className="w-4 h-4 text-primary" />
                  </span>
                  <div>
                    <p className="font-medium text-foreground">출금 가능 (조건 충족 시)</p>
                    <p className="text-muted-foreground text-xs mt-0.5">
                      가입 30일 + 매칭 성사 1건 이상 + 본인인증 완료 후 출금 가능 (1 물감 = 100원)
                    </p>
                  </div>
                </li>
              </ul>
              <button
                onClick={() => setActiveTab("points")}
                className="w-full text-center text-sm font-medium text-primary py-2 border-t border-border pt-3"
              >
                포인트 & 출금 보기 →
              </button>
            </div>

            {/* ADR 0046 — 외부 송금 금지 가이드 (약관 §6) */}
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-amber-700 text-sm font-bold">!</span>
                </span>
                <p className="font-semibold text-amber-900">외부 송금 유도 금지 (약관 §6)</p>
              </div>
              <p className="text-xs text-amber-900/80 leading-relaxed">
                사용자에게 앱 외부(계좌이체·간편송금)로 감사 표시를 유도하면 안 됩니다. 적발 시 누적 잔액 전액 몰수 + 출금 자격 영구 박탈 + 등급 0 회귀 + 영구 정지됩니다.
                감사 표시는 반드시 앱 내 팁 기능으로 받아주세요 (90% 수령 + 등급·마일스톤 자동 산정).
              </p>
            </div>
          </>
        )}

        {/* ─── Points Tab ─── */}
        {activeTab === "points" && (
          <>
            {/* Points Summary */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5 space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-primary" />
                <p className="font-semibold">물감 현황</p>
              </div>

              <div className="space-y-3">
                <PointRow label="출금 가능" value={data.availablePoints} highlight />
                <div className="h-px bg-border" />
                <PointRow label="총 받음 (누적)" value={data.totalPoints} />
                <PointRow label="출금 완료" value={data.withdrawnPoints} dimmed />
                <PointRow label="처리 중" value={data.pendingPoints} dimmed />
              </div>

              <div className="bg-primary/5 rounded-xl p-3 text-sm text-muted-foreground">
                <p>💡 매칭 성사 1건당 소개 요청 100 물감 × {currentLevelInfo.commission}% = {currentLevelInfo.commission} 물감 적립 (ADR 0044)</p>
              </div>
            </div>

            {/* Withdraw Section */}
            <div className="bg-card rounded-2xl border border-border/60 shadow-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="font-semibold">물감 출금</p>
                <span className="text-sm text-muted-foreground">1 물감 = 100원</span>
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
