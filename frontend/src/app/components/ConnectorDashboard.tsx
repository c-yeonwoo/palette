import { useState } from "react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Card } from "./ui/card";
import { CheckCircle2, XCircle, TrendingUp, Users, Coins } from "lucide-react";
import { toast } from "sonner";

interface MatchRequest {
  id: number;
  requester: string;
  requesterPhoto: string;
  target: string;
  targetPhoto: string;
  timestamp: string;
  status: "pending" | "approved" | "declined";
}

const mockRequests: MatchRequest[] = [
  {
    id: 1,
    requester: "김민수",
    requesterPhoto: "https://images.unsplash.com/photo-1554765345-6ad6a5417cde?w=200",
    target: "이지은",
    targetPhoto: "https://images.unsplash.com/photo-1649589244330-09ca58e4fa64?w=200",
    timestamp: "2시간 전",
    status: "pending",
  },
  {
    id: 2,
    requester: "박서준",
    requesterPhoto: "https://images.unsplash.com/photo-1764816657425-b3c79b616d14?w=200",
    target: "최유진",
    targetPhoto: "https://images.unsplash.com/photo-1760552069572-6a6caeeb82d9?w=200",
    timestamp: "1일 전",
    status: "pending",
  },
];

export function ConnectorDashboard() {
  const [requests, setRequests] = useState<MatchRequest[]>(mockRequests);
  const totalPoints = 35000;
  const totalConnections = 12;
  const successRate = 85;

  const handleApprove = (requestId: number) => {
    setRequests(
      requests.map((req) =>
        req.id === requestId ? { ...req, status: "approved" as const } : req
      )
    );
    toast.success("주선을 승인했습니다! 포인트가 적립됩니다.");
  };

  const handleDecline = (requestId: number) => {
    setRequests(
      requests.map((req) =>
        req.id === requestId ? { ...req, status: "declined" as const } : req
      )
    );
    toast.info("주선을 거절했습니다.");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-center">주선자 대시보드</h2>
      </div>

      {/* Stats Cards */}
      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Points */}
          <Card className="p-6 bg-gradient-to-br from-accent/20 to-accent/5 border-accent/30">
            <div className="flex items-center justify-between mb-3">
              <Coins className="w-8 h-8 text-accent" />
              <Badge className="bg-accent text-accent-foreground">누적</Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-1">누적 포인트</p>
            <h2 className="text-accent-foreground">{totalPoints.toLocaleString()} P</h2>
          </Card>

          {/* Total Connections */}
          <Card className="p-6 bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">총 주선 횟수</p>
            <h2>{totalConnections}번</h2>
          </Card>

          {/* Success Rate */}
          <Card className="p-6 bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <div className="flex items-center justify-between mb-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground mb-1">매칭 성공률</p>
            <h2 className="text-green-600">{successRate}%</h2>
          </Card>
        </div>

        {/* Pending Requests */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3>대기 중인 요청</h3>
            <Badge variant="secondary">
              {requests.filter((r) => r.status === "pending").length}건
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

          {requests.filter((r) => r.status === "pending").length === 0 && (
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
  if (request.status !== "pending") {
    return null;
  }

  return (
    <Card className="p-6 hover:shadow-md transition-shadow">
      <div className="space-y-4">
        {/* Request Info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 flex-1">
            <img
              src={request.requesterPhoto}
              alt={request.requester}
              className="w-12 h-12 rounded-full object-cover border-2 border-border"
            />
            <div>
              <p className="text-sm text-muted-foreground">요청자</p>
              <p>{request.requester}</p>
            </div>
          </div>

          <div className="text-muted-foreground text-2xl">→</div>

          <div className="flex items-center gap-3 flex-1">
            <img
              src={request.targetPhoto}
              alt={request.target}
              className="w-12 h-12 rounded-full object-cover border-2 border-border"
            />
            <div>
              <p className="text-sm text-muted-foreground">대상자</p>
              <p>{request.target}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <p className="text-sm text-muted-foreground">{request.timestamp}</p>
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
