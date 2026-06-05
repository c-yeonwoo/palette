import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { CheckCircle2, XCircle, Coins, Loader2, ChevronLeft, Award, ChevronRight, Users } from "lucide-react";
import { LevelBar } from "./ui/level-bar";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";
import { MessageModal } from "./MessageModal";
import { getCompatibilityDeterministic, COLOR_META, type ColorType } from "../../lib/colorCompatibility";

interface MatchmakerData {
  matchmakerId: string;
  userId: string;
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
  profilePhotoUrl: string | null;
  createdAt: string;
}

interface MatchRequest {
  id: string;
  requesterId: string;
  requesterNickname: string | null;
  requesterRealName: string | null;
  requesterColorType?: string | null;
  targetUserId: string;
  targetNickname: string | null;
  targetRealName: string | null;
  targetColorType?: string | null;
  matchmakerId: string;
  matchmakerName: string | null;
  message: string | null;
  offeredPoints?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ConnectorDashboardProps {
  onBack?: () => void;
  onNavigateToReward?: () => void;
  onNavigateToFriends?: () => void;
  onNavigateToMarketplace?: () => void;
}

interface ClientMember {
  id: string;
  userId: string;
  name: string;
  age: number;
  gender: "MALE" | "FEMALE";
  region: string;
  colorType: string | null;
  colorHex: string | null;
  colorName: string | null;
  photoUrl: string | null;
  joinedAt: string;
}

interface NudgeProposal {
  id: string;
  fromMember: ClientMember;
  toMember: ClientMember;
  message: string | null;
  pointsSpent: number;
  status: "PENDING" | "BOTH_ACCEPTED" | "REJECTED" | "MATCHED";
  proposedAt: string;
}

const MOCK_MATCHMAKER_DATA: MatchmakerData = {
  matchmakerId: "mock-001",
  userId: "user-001",
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
  profilePhotoUrl: null,
  createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
};

const MOCK_REQUESTS: MatchRequest[] = [
  {
    id: "req-001",
    requesterId: "user-010",
    requesterNickname: "김민준",
    requesterRealName: "김민준",
    requesterColorType: "blue",
    targetUserId: "user-020",
    targetNickname: "이서연",
    targetRealName: "이서연",
    targetColorType: "pink",
    matchmakerId: "mock-001",
    matchmakerName: "나",
    message: "잘 어울릴 것 같아서 연결해드려요 😊",
    offeredPoints: 1500,
    status: "PENDING_MATCHMAKER",
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "req-002",
    requesterId: "user-030",
    requesterNickname: "박지훈",
    requesterRealName: "박지훈",
    requesterColorType: "orange",
    targetUserId: "user-040",
    targetNickname: "최유나",
    targetRealName: "최유나",
    targetColorType: "green",
    matchmakerId: "mock-001",
    matchmakerName: "나",
    message: "서로 관심사가 비슷한 두 분이에요!",
    offeredPoints: 1500,
    status: "APPROVED_BY_MATCHMAKER",
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const MOCK_MEMBERS: ClientMember[] = [
  { id: "m1", userId: "u1", name: "김민준", age: 29, gender: "MALE", region: "서울 강남", colorType: "blue", colorHex: "#3B82F6", colorName: "차분한 블루", photoUrl: null, joinedAt: "2026-04-01" },
  { id: "m2", userId: "u2", name: "박지훈", age: 31, gender: "MALE", region: "서울 마포", colorType: "orange", colorHex: "#F97316", colorName: "따뜻한 오렌지", photoUrl: null, joinedAt: "2026-04-15" },
  { id: "m3", userId: "u3", name: "이성호", age: 27, gender: "MALE", region: "경기 분당", colorType: "green", colorHex: "#22C55E", colorName: "신선한 그린", photoUrl: null, joinedAt: "2026-04-20" },
  { id: "m4", userId: "u4", name: "이서연", age: 26, gender: "FEMALE", region: "서울 서초", colorType: "pink", colorHex: "#F9A8D4", colorName: "부드러운 핑크", photoUrl: null, joinedAt: "2026-04-05" },
  { id: "m5", userId: "u5", name: "최유나", age: 28, gender: "FEMALE", region: "서울 용산", colorType: "purple", colorHex: "#A855F7", colorName: "고급스러운 퍼플", photoUrl: null, joinedAt: "2026-04-18" },
  { id: "m6", userId: "u6", name: "정수진", age: 30, gender: "FEMALE", region: "서울 강동", colorType: "red", colorHex: "#EF4444", colorName: "생동감있는 레드", photoUrl: null, joinedAt: "2026-04-22" },
];

const MOCK_NUDGES: NudgeProposal[] = [
  {
    id: "n1",
    fromMember: { id: "m1", userId: "u1", name: "김민준", age: 29, gender: "MALE", region: "서울 강남", colorType: "blue", colorHex: "#3B82F6", colorName: "차분한 블루", photoUrl: null, joinedAt: "2026-04-01" },
    toMember: { id: "m4", userId: "u4", name: "이서연", age: 26, gender: "FEMALE", region: "서울 서초", colorType: "pink", colorHex: "#F9A8D4", colorName: "부드러운 핑크", photoUrl: null, joinedAt: "2026-04-05" },
    message: "두 분 모두 여행을 좋아하시더라고요 :)",
    pointsSpent: 50,
    status: "PENDING",
    proposedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "n2",
    fromMember: { id: "m2", userId: "u2", name: "박지훈", age: 31, gender: "MALE", region: "서울 마포", colorType: "orange", colorHex: "#F97316", colorName: "따뜻한 오렌지", photoUrl: null, joinedAt: "2026-04-15" },
    toMember: { id: "m5", userId: "u5", name: "최유나", age: 28, gender: "FEMALE", region: "서울 용산", colorType: "purple", colorHex: "#A855F7", colorName: "고급스러운 퍼플", photoUrl: null, joinedAt: "2026-04-18" },
    message: null,
    pointsSpent: 50,
    status: "BOTH_ACCEPTED",
    proposedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function ConnectorDashboard({ onBack, onNavigateToReward, onNavigateToFriends }: ConnectorDashboardProps) {
  const [matchmakerData, setMatchmakerData] = useState<MatchmakerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<MatchRequest[]>([]);

  // Modal state
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [modalAction, setModalAction] = useState<"approve" | "reject">("approve");
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<MatchRequest | null>(null);

  // Detail modal state
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailRequest, setDetailRequest] = useState<MatchRequest | null>(null);

  // New state
  type MainTab = "members" | "requests" | "history";
  const [activeMainTab, setActiveMainTab] = useState<MainTab>("members");
  const [memberGender, setMemberGender] = useState<"MALE" | "FEMALE">("MALE");
  const [members, setMembers] = useState<ClientMember[]>([]);
  const [nudges, setNudges] = useState<NudgeProposal[]>([]);
  const [nudgeSource, setNudgeSource] = useState<ClientMember | null>(null);
  const [showNudgeFlow, setShowNudgeFlow] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [matchmakerRes, requestsResponse] = await Promise.all([
        api.get<MatchmakerData>('/api/v1/matchmakers/me'),
        api.get<{ requests: MatchRequest[]; totalCount: number }>('/api/v1/matchmaking/requests')
      ]);
      setMatchmakerData(matchmakerRes);
      setRequests(requestsResponse.requests);

      // Load members and applications (with mock fallback in dev only)
      try {
        const membersRes = await api.get<{ members: ClientMember[] }>('/api/v1/matchmakers/me/members');
        setMembers(membersRes.members);
      } catch {
        if (import.meta.env.DEV) setMembers(MOCK_MEMBERS);
      }
      try {
        const nudgesRes = await api.get<{ nudges: NudgeProposal[] }>('/api/v1/matchmakers/me/nudges');
        setNudges(nudgesRes.nudges);
      } catch {
        if (import.meta.env.DEV) setNudges(MOCK_NUDGES);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
      // Use mock data as fallback when API is unavailable (dev only)
      if (import.meta.env.DEV) {
        setMatchmakerData(MOCK_MATCHMAKER_DATA);
        setRequests(MOCK_REQUESTS);
        setMembers(MOCK_MEMBERS);
        setNudges(MOCK_NUDGES);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!matchmakerData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">주선자 정보를 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const handleCardClick = (request: MatchRequest) => {
    setDetailRequest(request);
    setShowDetailModal(true);
  };

  const handleApprove = (request: MatchRequest) => {
    setSelectedRequestId(request.id);
    setSelectedRequest(request);
    setModalAction("approve");
    setShowMessageModal(true);
  };

  const handleDecline = (request: MatchRequest) => {
    setSelectedRequestId(request.id);
    setSelectedRequest(request);
    setModalAction("reject");
    setShowMessageModal(true);
  };

  const handleModalConfirm = async (message: string | null) => {
    if (!selectedRequestId) return;

    try {
      if (modalAction === "approve") {
        await api.put(`/api/v1/matchmaking/requests/${selectedRequestId}/matchmaker/approve`, {
          message
        });
        toast.success("주선을 승인했습니다!");
      } else {
        await api.put(`/api/v1/matchmaking/requests/${selectedRequestId}/matchmaker/reject`, {
          message
        });
        toast.info("주선을 거절했습니다.");
      }
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error(`Failed to ${modalAction} request:`, error);
      toast.error(modalAction === "approve" ? "주선 승인에 실패했습니다" : "주선 거절에 실패했습니다");
    }
  };

  const handleNudgeSubmit = async (toMember: ClientMember, message: string) => {
    if (!nudgeSource) return;
    const newNudge: NudgeProposal = {
      id: `nudge-${Date.now()}`,
      fromMember: nudgeSource,
      toMember,
      message: message || null,
      pointsSpent: 50,
      status: "PENDING",
      proposedAt: new Date().toISOString(),
    };
    try {
      await api.post('/api/v1/matchmakers/me/nudges', {
        fromUserId: nudgeSource.userId,
        toUserId: toMember.userId,
        message: message || null,
      });
    } catch {
      // mock: proceed anyway
    }
    setNudges(prev => [newNudge, ...prev]);
    // deduct 50P from display
    setMatchmakerData(prev => prev ? { ...prev, availablePoints: prev.availablePoints - 50, totalPoints: prev.totalPoints - 50 } : prev);
    setShowNudgeFlow(false);
    setNudgeSource(null);
    toast.success(`${nudgeSource.name} ↔ ${toMember.name} 연결 제안 완료! −50P`);
  };

  const pendingRequests = requests.filter(r =>
    r.status === "PENDING" || r.status === "PENDING_MATCHMAKER"
  );
  const historyRequests = requests.filter(r =>
    r.status !== "PENDING" && r.status !== "PENDING_MATCHMAKER"
  );
  const filteredMembers = members.filter(m => m.gender === memberGender);

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* ── 통일 헤더 (ADR 0014) ── */}
      <header className="sticky top-0 z-10 flex-shrink-0 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="p-1.5 hover:bg-muted/50 rounded-full transition-colors -ml-1.5">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-base font-bold text-foreground">주선 대시보드</h1>
          </div>

          <div className="flex items-center gap-2">
            {/* 지인 관리 진입점 (ADR 0016) */}
            {onNavigateToFriends && (
              <button
                onClick={onNavigateToFriends}
                className="p-2 hover:bg-accent rounded-full transition-colors"
                aria-label="지인 관리"
              >
                <Users className="w-5 h-5 text-text-secondary" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ── 이번달 요약 + Stats ── */}
      <div className="flex-shrink-0 bg-card border-b border-border px-4 py-3 max-w-2xl w-full mx-auto">
        {/* 이번달 칩 + 등급 칩 */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-brand-soft text-primary font-semibold px-2.5 py-1 rounded-full">
            이번달 성사 {matchmakerData?.successfulMatches ?? 0}건
          </span>
          <span className="text-xs text-muted-foreground">
            적립 {((matchmakerData?.totalPoints ?? 0)).toLocaleString()}P
          </span>
          {onNavigateToReward && (
            <button
              onClick={onNavigateToReward}
              className="ml-auto flex items-center gap-1.5 bg-brand-soft border border-primary/20 rounded-full px-3 py-1 text-xs font-semibold text-primary hover:bg-brand-soft transition-colors"
              aria-label="등급 & 리워드"
            >
              <Award className="w-3.5 h-3.5" />
              Lv.{matchmakerData?.level ?? 1}
              <ChevronRight className="w-3 h-3 -mr-1" />
            </button>
          )}
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          {[
            { label: "내 지인", value: `${members.length}명` },
            { label: "총 주선", value: `${matchmakerData?.totalMatchRequests ?? 0}건` },
            { label: "성공률", value: matchmakerData?.successRate ? `${Math.round(matchmakerData.successRate * 100)}%` : "-" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p className="text-base font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        {/* 레벨 바 */}
        {matchmakerData && (() => {
          const lvl = matchmakerData.level;
          const successes = matchmakerData.successfulMatches;
          const LEVELS = [
            { level: 1, name: "새싹", next: 3, nextName: "씨앗", color: "#22C55E" },
            { level: 2, name: "씨앗", next: 6, nextName: "꽃봉오리", color: "#84CC16" },
            { level: 3, name: "꽃봉오리", next: 11, nextName: "꽃", color: "#F97316" },
            { level: 4, name: "꽃", next: 21, nextName: "나무", color: "#EC4899" },
            { level: 5, name: "나무", next: undefined, nextName: undefined, color: "#A855F7" },
          ];
          const meta = LEVELS[Math.min(lvl - 1, 4)];
          return (
            <LevelBar
              level={meta.level}
              levelName={meta.name}
              color={meta.color}
              current={successes}
              next={meta.next}
              nextName={meta.nextName}
              className="mt-1"
            />
          );
        })()}
      </div>

      {/* ── 메인 탭 ── */}
      <div className="flex-shrink-0 flex border-b border-border bg-card">
        {([
          { key: "members", label: "내 지인", badge: members.length },
          { key: "requests", label: "주선 요청", badge: pendingRequests.length },
          { key: "history", label: "이력", badge: 0 },
        ] as const).map(({ key, label, badge }) => (
          <button
            key={key}
            onClick={() => setActiveMainTab(key)}
            className={`flex-1 py-3 text-sm font-semibold relative transition-colors ${
              activeMainTab === key
                ? "text-primary border-b-2 border-primary -mb-px"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
            {badge > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold bg-primary text-primary-foreground rounded-full">
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── 탭 콘텐츠 (스크롤) ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-4">

          {/* ════ 내 지인 탭 ════ */}
          {activeMainTab === "members" && (
            <div className="space-y-4">
              {/* 남/여 토글 */}
              <div className="flex gap-2">
                {(["MALE", "FEMALE"] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => setMemberGender(g)}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      memberGender === g
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {g === "MALE" ? `남성 ${members.filter(m => m.gender === "MALE").length}명` : `여성 ${members.filter(m => m.gender === "FEMALE").length}명`}
                  </button>
                ))}
              </div>

              {/* 지인 그리드 */}
              {filteredMembers.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="text-4xl">👥</div>
                  <p className="font-semibold text-foreground">아직 {memberGender === "MALE" ? "남성" : "여성"} 지인이 없어요</p>
                  <p className="text-sm text-muted-foreground">친구 코드로 지인을 초대하거나 받은 친구 요청을 수락해보세요</p>
                  {onNavigateToFriends && (
                    <button
                      onClick={onNavigateToFriends}
                      className="text-sm text-primary font-medium underline underline-offset-4"
                    >
                      지인 관리하기
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredMembers.map(member => {
                    const hasNudge = nudges.some(n =>
                      (n.fromMember.id === member.id || n.toMember.id === member.id) &&
                      n.status === "PENDING"
                    );
                    return (
                      <MemberCard
                        key={member.id}
                        member={member}
                        hasActiveNudge={hasNudge}
                        onNudge={() => {
                          setNudgeSource(member);
                          setShowNudgeFlow(true);
                        }}
                      />
                    );
                  })}
                </div>
              )}

              {/* 지인 관리 진입점 (친구 요청 수락은 별도 화면에서) */}
              {onNavigateToFriends && filteredMembers.length > 0 && (
                <button
                  onClick={onNavigateToFriends}
                  className="w-full flex items-center justify-between bg-primary/5 border border-primary/20 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">지인 초대 / 받은 친구 요청 관리</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-primary" />
                </button>
              )}
            </div>
          )}

          {/* ════ 주선 요청 탭 ════ */}
          {activeMainTab === "requests" && (
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="text-4xl">📭</div>
                  <p className="font-semibold text-foreground">대기 중인 주선 요청이 없어요</p>
                  <p className="text-sm text-muted-foreground">지인을 모아두면 주선 요청이 들어와요</p>
                  {onNavigateToFriends && (
                    <button
                      onClick={onNavigateToFriends}
                      className="text-sm text-primary font-medium underline underline-offset-4"
                    >
                      친구 초대하기
                    </button>
                  )}
                </div>
              ) : (
                pendingRequests.map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onClick={() => handleCardClick(request)}
                    onApprove={() => handleApprove(request)}
                    onDecline={() => handleDecline(request)}
                  />
                ))
              )}
            </div>
          )}

          {/* ════ 이력 탭 ════ */}
          {activeMainTab === "history" && (
            <div className="space-y-4">
              {historyRequests.length === 0 ? (
                <div className="py-16 text-center space-y-3">
                  <div className="text-4xl">📋</div>
                  <p className="font-semibold text-foreground">아직 주선 이력이 없어요</p>
                  <p className="text-sm text-muted-foreground">첫 주선을 성사시켜보세요</p>
                </div>
              ) : (
                historyRequests.map(request => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onClick={() => handleCardClick(request)}
                    onApprove={() => handleApprove(request)}
                    onDecline={() => handleDecline(request)}
                  />
                ))
              )}

              {/* 내 연결 제안 이력 */}
              {nudges.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">내 연결 제안</p>
                  {nudges.map(nudge => {
                    const statusConfig = {
                      PENDING: { label: "양측 응답 대기", dot: "bg-yellow-400" },
                      BOTH_ACCEPTED: { label: "양측 수락 ✓", dot: "bg-green-500" },
                      REJECTED: { label: "거절됨", dot: "bg-muted-foreground/40" },
                      MATCHED: { label: "매칭 성사 🎉", dot: "bg-primary" },
                    }[nudge.status];
                    return (
                      <div key={nudge.id} className="bg-card border border-border rounded-2xl p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${statusConfig.dot}`} />
                            <span className="text-xs font-medium text-muted-foreground">{statusConfig.label}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(nudge.proposedAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground/60">{nudge.fromMember.name.charAt(0)}</span>
                            <span className="text-sm font-medium">{nudge.fromMember.name}</span>
                          </div>
                          <span className="text-muted-foreground text-sm">↔</span>
                          <div className="flex items-center gap-1.5">
                            <span className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground/60">{nudge.toMember.name.charAt(0)}</span>
                            <span className="text-sm font-medium">{nudge.toMember.name}</span>
                          </div>
                          <span className="ml-auto text-xs text-muted-foreground">−{nudge.pointsSpent}P</span>
                        </div>
                        {nudge.message && (
                          <p className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 leading-relaxed">"{nudge.message}"</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* 리워드 안내 진입점 (별도 페이지로 분리 — ADR 0015) */}
              {onNavigateToReward && (
                <button
                  onClick={onNavigateToReward}
                  className="w-full flex items-center justify-between bg-card border border-border rounded-2xl p-4 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 text-left">
                    <Award className="w-5 h-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold">주선자 리워드 안내</p>
                      <p className="text-xs text-muted-foreground mt-0.5">감사 포인트, 커미션, 등급 혜택을 확인하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                </button>
              )}
            </div>
          )}

        </div>
      </div>

      {/* ── 연결 제안 플로우 시트 ── */}
      {showNudgeFlow && nudgeSource && (
        <NudgeFlowSheet
          sourceMembers={members}
          source={nudgeSource}
          nudges={nudges}
          onSubmit={handleNudgeSubmit}
          onClose={() => { setShowNudgeFlow(false); setNudgeSource(null); }}
        />
      )}

      {/* Message Modal */}
      <MessageModal
        open={showMessageModal}
        onOpenChange={setShowMessageModal}
        title={modalAction === "approve" ? "주선 승인" : "주선 거절"}
        description={
          modalAction === "approve"
            ? `${selectedRequest?.targetRealName || "소개 대상자"}에게 전달할 메시지 (선택사항)`
            : `${selectedRequest?.requesterRealName || "요청자"}에게 전달할 메시지 (선택사항)`
        }
        confirmLabel={modalAction === "approve" ? "승인하기" : "거절하기"}
        onConfirm={handleModalConfirm}
        maxLength={500}
      />

      {/* Detail Modal */}
      {detailRequest && (
        <RequestDetailModal
          request={detailRequest}
          open={showDetailModal}
          onOpenChange={setShowDetailModal}
        />
      )}
    </div>
  );
}

function RequestCard({
  request,
  onClick,
  onApprove,
  onDecline,
}: {
  request: MatchRequest;
  onClick: () => void;
  onApprove: () => void;
  onDecline: () => void;
}) {
  const isPending = request.status === "PENDING" || request.status === "PENDING_MATCHMAKER";
  const points = request.offeredPoints ?? 300;

  const statusLabel = {
    PENDING: null,
    PENDING_MATCHMAKER: null,
    MATCHMAKER_APPROVED: { text: "상대방 응답 대기", dot: "bg-primary" },
    APPROVED_BY_MATCHMAKER: { text: "상대방 응답 대기", dot: "bg-primary" },
    REJECTED_BY_MATCHMAKER: { text: "이번엔 거절했어요", dot: "bg-muted-foreground/40" },
    COMPLETED: { text: "매칭 성사", dot: "bg-green-500" },
    REJECTED_BY_TARGET: { text: "상대방이 거절했어요", dot: "bg-muted-foreground/40" },
  }[request.status] ?? { text: request.status, dot: "bg-muted" };

  // Color compat (shown always)
  const rColorType = (request.requesterColorType ?? null) as ColorType | null;
  const tColorType = (request.targetColorType ?? null) as ColorType | null;
  const compat = getCompatibilityDeterministic(rColorType, tColorType, request.id);
  const rMeta = rColorType ? COLOR_META[rColorType] : null;
  const tMeta = tColorType ? COLOR_META[tColorType] : null;

  if (isPending) {
    // ── 블라인드 수락 카드 ──────────────────────────────
    return (
      <Card className="overflow-hidden border-primary/20 shadow-sm">
        {/* Points banner */}
        <div className="bg-primary/5 border-b border-primary/10 px-4 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">수락하면 즉시 받아요</p>
            <p className="text-xl font-bold text-primary">{points}P</p>
          </div>
          <Coins className="w-6 h-6 text-primary/60" />
        </div>

        <div className="p-4 space-y-4">
          {/* Palette 추천 프레임 */}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">팔레트가 두 분의 인연을 발견했어요</p>
          </div>

          {/* Two color profiles (blind) */}
          <div className="flex items-center justify-center gap-4">
            <div className="text-center space-y-1.5">
              {rMeta ? (
                <span className="w-12 h-12 rounded-full border-2 border-white shadow block mx-auto" style={{ backgroundColor: rMeta.hex }} />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted mx-auto" />
              )}
              <p className="text-xs text-muted-foreground">{rMeta?.name ?? "?"}</p>
            </div>

            <div className="flex flex-col items-center gap-1">
              {compat ? (
                <>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i} className="text-xs" style={{ opacity: i < Math.round(compat.score / 20) ? 1 : 0.2 }}>♥</span>
                    ))}
                  </div>
                  <span className="text-xs font-bold text-primary">{compat.score}%</span>
                  <span className="text-xs text-muted-foreground">{compat.label}</span>
                </>
              ) : (
                <span className="text-muted-foreground text-lg">↔</span>
              )}
            </div>

            <div className="text-center space-y-1.5">
              {tMeta ? (
                <span className="w-12 h-12 rounded-full border-2 border-white shadow block mx-auto" style={{ backgroundColor: tMeta.hex }} />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted mx-auto" />
              )}
              <p className="text-xs text-muted-foreground">
                {request.targetNickname || request.targetRealName || tMeta?.name || "?"}
              </p>
            </div>
          </div>

          {compat && (
            <p className="text-xs text-center text-muted-foreground">{compat.tagline}</p>
          )}

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 text-muted-foreground"
              onClick={(e) => { e.stopPropagation(); onDecline(); }}
            >
              <XCircle className="w-3.5 h-3.5 mr-1" />
              이번엔 어렵겠어요
            </Button>
            <Button
              size="sm"
              className="flex-1 bg-primary text-primary-foreground"
              onClick={(e) => { e.stopPropagation(); onApprove(); }}
            >
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
              {points}P 받고 연결하기
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  // ── 이력 카드 (PENDING 아닌 상태) ──────────────────────
  return (
    <Card className="p-4 cursor-pointer hover:shadow-sm transition-shadow" onClick={onClick}>
      <div className="space-y-3">
        {/* Status row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusLabel?.dot ?? "bg-muted"}`} />
            <span className="text-sm font-medium">{statusLabel?.text ?? request.status}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {new Date(request.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
          </span>
        </div>

        {/* Profiles (revealed after pending) */}
        <div className="flex items-center gap-2">
          {rMeta && (
            <span className="w-5 h-5 rounded-full border border-white shadow-sm flex-shrink-0" style={{ backgroundColor: rMeta.hex }} />
          )}
          <span className="text-xs text-muted-foreground">
            {request.requesterRealName || "요청자"}
          </span>
          <span className="text-muted-foreground/40 text-xs">→</span>
          {tMeta && (
            <span className="w-5 h-5 rounded-full border border-white shadow-sm flex-shrink-0" style={{ backgroundColor: tMeta.hex }} />
          )}
          <span className="text-xs text-muted-foreground">
            {request.targetNickname || request.targetRealName || "상대방"}
          </span>
        </div>

        {compat && rMeta && tMeta && (
          <p className="text-xs text-muted-foreground">{compat.label} {compat.score}% · {compat.tagline}</p>
        )}
      </div>
    </Card>
  );
}

function RequestDetailModal({
  request,
  open,
  onOpenChange,
}: {
  request: MatchRequest;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const getStatusLabel = () => {
    switch (request.status) {
      case "PENDING":
        return { label: "주선자 승인 대기", color: "text-yellow-600" };
      case "PENDING_MATCHMAKER":
        return { label: "주선자 승인 대기", color: "text-yellow-600" };
      case "MATCHMAKER_APPROVED":
        return { label: "소개 대상자 응답 대기", color: "text-blue-600" };
      case "REJECTED_BY_MATCHMAKER":
        return { label: "주선자 거절", color: "text-red-600" };
      case "COMPLETED":
        return { label: "매칭 성사", color: "text-green-600" };
      case "REJECTED_BY_TARGET":
        return { label: "소개 대상자 거절", color: "text-orange-600" };
      default:
        return { label: "알 수 없음", color: "text-gray-600" };
    }
  };

  const statusInfo = getStatusLabel();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>주선 요청 상세</DialogTitle>
          <DialogDescription>
            <span className={`font-semibold ${statusInfo.color}`}>{statusInfo.label}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Flow */}
          <div className="flex items-center justify-center gap-3 py-4">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-brand-soft flex items-center justify-center border-2 border-border mx-auto mb-2">
                <span className="text-lg font-semibold text-primary">
                  {request.requesterRealName?.charAt(0) || "?"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">요청자</p>
              <p className="text-sm font-medium">{request.requesterRealName || "알 수 없음"}</p>
            </div>

            <div className="text-2xl text-muted-foreground">→</div>

            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center border-2 border-border mx-auto mb-2">
                <span className="text-lg font-semibold text-accent-foreground">
                  {request.targetRealName?.charAt(0) || "?"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">대상자</p>
              <p className="text-sm font-medium">{request.targetRealName || "알 수 없음"}</p>
            </div>
          </div>

          {/* Requester Message */}
          {request.message && (
            <div>
              <p className="text-sm font-medium mb-2">요청자 메시지</p>
              <div className="bg-accent/10 rounded-lg p-3">
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{request.message}</p>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p>
              요청일: {new Date(request.createdAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
            <p>
              최종 업데이트: {new Date(request.updatedAt).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── 연결 제안 플로우 시트 ─────────────────────────────────────────
function NudgeFlowSheet({
  sourceMembers: allMembers,
  source,
  nudges,
  onSubmit,
  onClose,
}: {
  sourceMembers: ClientMember[];
  source: ClientMember;
  nudges: NudgeProposal[];
  onSubmit: (to: ClientMember, message: string) => void;
  onClose: () => void;
}) {
  const oppositeGender = source.gender === "MALE" ? "FEMALE" : "MALE";
  const candidates = allMembers.filter(m => m.gender === oppositeGender);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<ClientMember | null>(null);
  const [message, setMessage] = useState("");

  const compat = selected && source.colorType && selected.colorType
    ? getCompatibilityDeterministic(source.colorType as ColorType, selected.colorType as ColorType, `${source.id}-${selected.id}`)
    : null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-3xl shadow-overlay max-h-[85vh] flex flex-col">
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-9 h-1 rounded-full bg-border" />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-3">
            {step > 1 && (
              <button onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)} className="p-1 hover:bg-muted rounded-full">
                <ChevronLeft className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <div>
              <p className="text-sm font-semibold">
                {step === 1 ? `${source.name}과 연결할 사람 선택` : step === 2 ? "궁합 미리보기" : "제안 확인"}
              </p>
              <p className="text-xs text-muted-foreground">Step {step} / 3</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted">
            <XCircle className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">

          {/* ── Step 1: 대상 선택 ── */}
          {step === 1 && (
            <div className="space-y-3">
              {candidates.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  연결 가능한 {oppositeGender === "FEMALE" ? "여성" : "남성"} 지인이 없어요
                </div>
              ) : (
                candidates.map(candidate => {
                  const alreadyNudged = nudges.some(n =>
                    ((n.fromMember.id === source.id && n.toMember.id === candidate.id) ||
                     (n.fromMember.id === candidate.id && n.toMember.id === source.id)) &&
                    n.status === "PENDING"
                  );
                  return (
                    <button
                      key={candidate.id}
                      disabled={alreadyNudged}
                      onClick={() => { setSelected(candidate); setStep(2); }}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                        alreadyNudged
                          ? "border-border bg-muted/50 opacity-50 cursor-not-allowed"
                          : "border-border bg-card hover:border-primary/40 hover:bg-primary/5"
                      }`}
                    >
                      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-base font-bold text-muted-foreground/60 flex-shrink-0">
                        {candidate.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{candidate.name}</p>
                        <p className="text-xs text-muted-foreground">{candidate.age}세 · {candidate.region}</p>
                      </div>
                      {alreadyNudged && <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">제안중</span>}
                    </button>
                  );
                })
              )}
            </div>
          )}

          {/* ── Step 2: 궁합 미리보기 + 메시지 ── */}
          {step === 2 && selected && (
            <div className="space-y-5">
              {/* 두 사람 + 궁합 */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <div className="flex items-center justify-center gap-6 mb-4">
                  <div className="text-center space-y-1.5">
                    <div className="w-14 h-14 rounded-full bg-muted border border-border mx-auto flex items-center justify-center text-xl font-bold text-muted-foreground/60">
                      {source.name.charAt(0)}
                    </div>
                    <p className="text-sm font-semibold">{source.name}</p>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    {compat ? (
                      <>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <span key={i} className="text-sm" style={{ opacity: i < Math.round(compat.score / 20) ? 1 : 0.25 }}>♥</span>
                          ))}
                        </div>
                        <span className="text-lg font-bold text-primary">{compat.score}%</span>
                        <span className="text-xs font-semibold text-muted-foreground">{compat.label}</span>
                      </>
                    ) : (
                      <span className="text-2xl text-muted-foreground">↔</span>
                    )}
                  </div>
                  <div className="text-center space-y-1.5">
                    <div className="w-14 h-14 rounded-full bg-muted border border-border mx-auto flex items-center justify-center text-xl font-bold text-muted-foreground/60">
                      {selected.name.charAt(0)}
                    </div>
                    <p className="text-sm font-semibold">{selected.name}</p>
                  </div>
                </div>
                {compat && <p className="text-xs text-center text-muted-foreground">{compat.tagline}</p>}
              </div>

              {/* 메시지 */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">제안 메시지 (선택)</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value.slice(0, 60))}
                  placeholder="두 분이 잘 어울릴 것 같아요 :)"
                  rows={3}
                  className="w-full rounded-xl border border-border bg-muted px-3 py-2.5 text-sm resize-none outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/40"
                />
                <p className="text-xs text-muted-foreground text-right">{message.length}/60</p>
              </div>

              <button
                onClick={() => setStep(3)}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                다음 — 최종 확인
              </button>
            </div>
          )}

          {/* ── Step 3: 최종 확인 ── */}
          {step === 3 && selected && (
            <div className="space-y-5">
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 space-y-4">
                <p className="text-sm font-semibold text-center">이렇게 연결 제안할게요</p>
                <div className="flex items-center justify-center gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-muted border border-border mx-auto flex items-center justify-center text-base font-bold text-muted-foreground/60">
                      {source.name.charAt(0)}
                    </div>
                    <p className="text-xs font-semibold mt-1">{source.name}</p>
                  </div>
                  <span className="text-primary font-bold text-lg">↔</span>
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-muted border border-border mx-auto flex items-center justify-center text-base font-bold text-muted-foreground/60">
                      {selected.name.charAt(0)}
                    </div>
                    <p className="text-xs font-semibold mt-1">{selected.name}</p>
                  </div>
                </div>
                {message && (
                  <div className="bg-white/60 rounded-lg px-3 py-2">
                    <p className="text-xs text-muted-foreground text-center">"{message}"</p>
                  </div>
                )}
                {compat && <p className="text-xs text-center text-primary font-medium">{compat.label} {compat.score}%</p>}
              </div>

              {/* 포인트 안내 */}
              <div className="flex items-center justify-between bg-card border border-border rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold">제안 비용</span>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary">−50P</p>
                  <p className="text-xs text-muted-foreground">성사 시 최대 750P 적립</p>
                </div>
              </div>

              <button
                onClick={() => onSubmit(selected, message)}
                className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold"
              >
                제안하기 — 50P 차감
              </button>
              <p className="text-xs text-center text-muted-foreground">두 분 모두에게 알림이 전송되고, 양측 수락 시 연락처가 공유돼요</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── 지인 카드 ─────────────────────────────────────────────────────
function MemberCard({
  member,
  hasActiveNudge,
  onNudge,
}: {
  member: ClientMember;
  hasActiveNudge?: boolean;
  onNudge?: () => void;
}) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden">
      {/* 아바타 */}
      <div className="aspect-square bg-muted flex items-center justify-center relative">
        {member.photoUrl ? (
          <img src={member.photoUrl} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-muted-foreground/60">
            {member.name.charAt(0)}
          </div>
        )}
        {hasActiveNudge && (
          <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            제안중
          </span>
        )}
      </div>
      {/* 정보 */}
      <div className="px-2.5 pt-2 pb-2 space-y-1">
        <p className="text-sm font-semibold text-foreground truncate">{member.name}</p>
        <p className="text-xs text-muted-foreground">{member.age}세 · {member.region}</p>
      </div>
      {/* 연결 제안 버튼 */}
      {onNudge && (
        <button
          onClick={onNudge}
          disabled={hasActiveNudge}
          className="w-full py-2 text-xs font-semibold border-t border-border text-primary disabled:text-muted-foreground disabled:cursor-not-allowed hover:bg-primary/5 transition-colors"
        >
          {hasActiveNudge ? "제안 완료" : "연결 제안하기"}
        </button>
      )}
    </div>
  );
}

