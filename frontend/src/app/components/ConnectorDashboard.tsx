import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { CheckCircle2, XCircle, TrendingUp, Users, Coins, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";

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
  targetUserId: string;
  targetNickname: string | null;
  matchmakerId: string;
  matchmakerName: string | null;
  message: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export function ConnectorDashboard() {
  const [matchmakerData, setMatchmakerData] = useState<MatchmakerData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requests, setRequests] = useState<MatchRequest[]>([]);

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

  const handleApprove = async (requestId: string) => {
    try {
      await api.put(`/api/v1/matchmaking/requests/${requestId}/approve`, {});
      toast.success("주선을 승인했습니다! 포인트가 적립됩니다.");
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast.error("주선 승인에 실패했습니다");
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      await api.put(`/api/v1/matchmaking/requests/${requestId}/reject`, {});
      toast.info("주선을 거절했습니다.");
      // Refresh data
      await fetchData();
    } catch (error) {
      console.error('Failed to reject request:', error);
      toast.error("주선 거절에 실패했습니다");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-center">주선자 대시보드</h2>
      </div>

      {/* Stats Cards */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
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

        {/* Pending Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3>나에게 들어온 주선요청</h3>
            <Badge variant="secondary">
              {requests.filter((r) => r.status === "PENDING").length}건
            </Badge>
          </div>

          <div className="space-y-4">
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onApprove={() => handleApprove(request.id)}
                onDecline={() => handleDecline(request.id)}
              />
            ))}
          </div>

          {requests.filter((r) => r.status === "PENDING").length === 0 && (
            <Card className="p-12 text-center">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">대기 중인 요청이 없습니다</p>
            </Card>
          )}
        </div>

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
    </div>
  );
}

function RequestCard({
  request,
  onApprove,
  onDecline,
}: {
  request: MatchRequest;
  onApprove: () => void;
  onDecline: () => void;
}) {
  if (request.status !== "PENDING") {
    return null;
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Request Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border-2 border-border">
              <span className="text-lg font-semibold text-primary">
                {request.requesterNickname?.charAt(0) || "?"}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">요청자</p>
              <p className="font-medium">{request.requesterNickname || "알 수 없음"}</p>
            </div>
          </div>

          <div className="text-muted-foreground text-2xl">→</div>

          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center border-2 border-border">
              <span className="text-lg font-semibold text-accent-foreground">
                {request.targetNickname?.charAt(0) || "?"}
              </span>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">대상자</p>
              <p className="font-medium">{request.targetNickname || "알 수 없음"}</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {request.message && (
          <div className="bg-accent/10 rounded-lg p-3">
            <p className="text-sm text-muted-foreground">{request.message}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">
            {new Date(request.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-destructive/50 text-destructive hover:bg-destructive/10"
            onClick={onDecline}
          >
            <XCircle className="w-4 h-4 mr-2" />
            거절하기
          </Button>
          <Button
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
            onClick={onApprove}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            승인하고 전달하기
          </Button>
        </div>
      </div>
    </Card>
  );
}
