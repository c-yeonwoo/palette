import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { CheckCircle2, XCircle, TrendingUp, Users, Coins, Loader2, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";
import { MessageModal } from "./MessageModal";

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
  targetUserId: string;
  targetNickname: string | null;
  targetRealName: string | null;
  matchmakerId: string;
  matchmakerName: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface ConnectorDashboardProps {
  onBack?: () => void;
  onNavigateToReward?: () => void;
}

export function ConnectorDashboard({ onBack, onNavigateToReward }: ConnectorDashboardProps) {
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [matchmakerData, requestsResponse] = await Promise.all([
        api.get<MatchmakerData>('/api/v1/matchmakers/me'),
        api.get<{ requests: MatchRequest[]; totalCount: number }>('/api/v1/matchmaking/requests')
      ]);
      setMatchmakerData(matchmakerData);
      setRequests(requestsResponse.requests);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error('데이터를 불러오는데 실패했습니다');
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

  const totalPoints = matchmakerData.totalPoints;
  const totalConnections = matchmakerData.successfulMatches;
  const successRate = Math.round(matchmakerData.successRate * 100);

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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto relative flex items-center justify-center">
          {onBack && (
            <button
              onClick={onBack}
              className="absolute left-0 p-2 hover:bg-accent rounded-full transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
          <h2 className="text-center text-xl font-semibold">주선자 대시보드</h2>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {/* Total Points */}
          <Card className="p-3 sm:p-6 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <Coins className="w-5 h-5 sm:w-8 sm:h-8 text-accent" />
              <Badge className="bg-accent text-accent-foreground text-xs hidden sm:inline-flex">누적</Badge>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">누적 포인트</p>
            <h2 className="text-base sm:text-2xl text-accent-foreground">{totalPoints.toLocaleString()} P</h2>
          </Card>

          {/* Total Connections */}
          <Card className="p-3 sm:p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <Users className="w-5 h-5 sm:w-8 sm:h-8 text-primary" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">총 주선 횟수</p>
            <h2 className="text-base sm:text-2xl">{totalConnections}번</h2>
          </Card>

          {/* Success Rate */}
          <Card className="p-3 sm:p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <TrendingUp className="w-5 h-5 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground mb-1">매칭 성공률</p>
            <h2 className="text-base sm:text-2xl text-green-600">{successRate}%</h2>
          </Card>
        </div>

        {/* Level & Reward shortcut */}
        {onNavigateToReward && (
          <button
            onClick={onNavigateToReward}
            className="w-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-center justify-between hover:from-yellow-500/20 hover:to-orange-500/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div className="text-left">
                <p className="font-medium text-sm">주선자 등급 & 포인트</p>
                <p className="text-xs text-muted-foreground">
                  Lv.{matchmakerData?.level ?? 1} · 출금 가능 {matchmakerData?.availablePoints?.toLocaleString() ?? 0}P
                </p>
              </div>
            </div>
            <span className="text-muted-foreground text-sm">→</span>
          </button>
        )}

        {/* Requests Tabs */}
        <Tabs defaultValue="pending" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <h3>주선 요청</h3>
          </div>

          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="pending">
              대기중
              <Badge variant="secondary" className="ml-2">
                {requests.filter((r) => r.status === "PENDING").length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="history">
              이력
              <Badge variant="secondary" className="ml-2">
                {requests.filter((r) => r.status !== "PENDING").length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {requests.filter((r) => r.status === "PENDING").length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">대기 중인 요청이 없습니다</p>
              </Card>
            ) : (
              requests
                .filter((r) => r.status === "PENDING")
                .map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onClick={() => handleCardClick(request)}
                    onApprove={() => handleApprove(request)}
                    onDecline={() => handleDecline(request)}
                  />
                ))
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            {requests.filter((r) => r.status !== "PENDING").length === 0 ? (
              <Card className="p-12 text-center">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">주선 이력이 없습니다</p>
              </Card>
            ) : (
              requests
                .filter((r) => r.status !== "PENDING")
                .map((request) => (
                  <RequestCard
                    key={request.id}
                    request={request}
                    onClick={() => handleCardClick(request)}
                    onApprove={() => handleApprove(request)}
                    onDecline={() => handleDecline(request)}
                  />
                ))
            )}
          </TabsContent>
        </Tabs>

        {/* How it Works */}
        <Card className="p-6 bg-accent/5 border-accent/20">
          <h3 className="mb-4">주선자 리워드 안내</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">•</span>
              <span>주선 승인 시: <strong className="text-foreground">1,000 포인트</strong> 즉시 지급</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">•</span>
              <span>매칭 성사 시: <strong className="text-foreground">추가 5,000 포인트</strong> 보너스</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-1">•</span>
              <span>포인트는 현금으로 출금하거나 앱 내에서 사용 가능합니다</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Message Modal */}
      <MessageModal
        open={showMessageModal}
        onOpenChange={setShowMessageModal}
        title={modalAction === "approve" ? "주선 승인" : "주선 거절"}
        description={
          modalAction === "approve"
            ? `${selectedRequest?.targetRealName || "피주선자"}에게 전달할 메시지 (선택사항)`
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
  const getStatusInfo = () => {
    switch (request.status) {
      case "PENDING":
        return {
          label: "주선자 승인 대기",
          color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200",
          matchmakerStatus: "pending",
          targetStatus: "waiting"
        };
      case "MATCHMAKER_APPROVED":
        return {
          label: "피주선자 응답 대기",
          color: "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200",
          matchmakerStatus: "approved",
          targetStatus: "pending"
        };
      case "REJECTED_BY_MATCHMAKER":
        return {
          label: "주선자 거절",
          color: "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200",
          matchmakerStatus: "rejected",
          targetStatus: "canceled"
        };
      case "COMPLETED":
        return {
          label: "매칭 성사",
          color: "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200",
          matchmakerStatus: "approved",
          targetStatus: "accepted"
        };
      case "REJECTED_BY_TARGET":
        return {
          label: "피주선자 거절",
          color: "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200",
          matchmakerStatus: "approved",
          targetStatus: "rejected"
        };
      default:
        return {
          label: "알 수 없음",
          color: "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-200",
          matchmakerStatus: "waiting",
          targetStatus: "waiting"
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card
      className="p-6 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="space-y-4">
        {/* Flow UI */}
        <div className="flex items-center justify-between gap-1">
          {/* Requester */}
          <div className="flex flex-col items-center gap-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-border">
              <span className="text-xs font-semibold text-primary">
                {request.requesterRealName?.charAt(0) || "?"}
              </span>
            </div>
            <span className="text-xs font-medium text-center max-w-[60px] truncate">{request.requesterRealName || "알 수 없음"}</span>
          </div>

          {/* Arrow */}
          <div className="text-muted-foreground text-sm">→</div>

          {/* Matchmaker Status */}
          <div className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${
            statusInfo.matchmakerStatus === "approved"
              ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
              : statusInfo.matchmakerStatus === "rejected"
              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200"
          }`}>
            {statusInfo.matchmakerStatus === "approved" ? "✓" :
             statusInfo.matchmakerStatus === "rejected" ? "✗" : "⋯"}
          </div>

          {/* Arrow */}
          <div className="text-muted-foreground text-sm">→</div>

          {/* Target */}
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border border-border ${
              statusInfo.targetStatus === "canceled" ? "opacity-30" : "bg-accent/20"
            }`}>
              <span className="text-xs font-semibold text-accent-foreground">
                {request.targetRealName?.charAt(0) || "?"}
              </span>
            </div>
            <span className={`text-xs font-medium text-center max-w-[60px] truncate ${statusInfo.targetStatus === "canceled" ? "opacity-30" : ""}`}>
              {request.targetRealName || "알 수 없음"}
            </span>
          </div>

          {/* Target Status (if applicable) */}
          {(statusInfo.targetStatus === "accepted" || statusInfo.targetStatus === "rejected") && (
            <>
              <div className="text-muted-foreground text-sm">→</div>
              <div className={`px-2 py-1 rounded-full text-[10px] font-medium whitespace-nowrap ${
                statusInfo.targetStatus === "accepted"
                  ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200"
                  : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200"
              }`}>
                {statusInfo.targetStatus === "accepted" ? "✓" : "✗"}
              </div>
            </>
          )}
        </div>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <div className={`px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
            {statusInfo.label}
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(request.createdAt).toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Action Buttons (only for PENDING) */}
        {request.status === "PENDING" && (
          <div className="flex gap-3 pt-2" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="outline"
              className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onDecline();
              }}
            >
              <XCircle className="w-4 h-4 mr-2" />
              거절하기
            </Button>
            <Button
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              onClick={(e) => {
                e.stopPropagation();
                onApprove();
              }}
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              승인하기
            </Button>
          </div>
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
      case "MATCHMAKER_APPROVED":
        return { label: "피주선자 응답 대기", color: "text-blue-600" };
      case "REJECTED_BY_MATCHMAKER":
        return { label: "주선자 거절", color: "text-red-600" };
      case "COMPLETED":
        return { label: "매칭 성사", color: "text-green-600" };
      case "REJECTED_BY_TARGET":
        return { label: "피주선자 거절", color: "text-orange-600" };
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
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border mx-auto mb-2">
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
