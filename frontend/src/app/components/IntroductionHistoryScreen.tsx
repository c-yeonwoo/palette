import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Heart, Clock, CheckCircle2, XCircle } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

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

export function IntroductionHistoryScreen() {
  const [pendingItems, setPendingItems] = useState<MatchRequest[]>([]);
  const [completedItems, setCompletedItems] = useState<MatchRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchIntroductionHistory();
  }, []);

  const fetchIntroductionHistory = async () => {
    try {
      setIsLoading(true);

      // Fetch both requester's pending requests and target's pending requests
      const [requesterPendingResponse, targetPendingResponse] = await Promise.all([
        api.get<any>("/api/v1/matchmaking/requests/pending"),
        api.get<any>("/api/v1/matchmaking/requests/target/pending")
      ]);

      // Combine and deduplicate
      const allPending = [
        ...(requesterPendingResponse.requests || []),
        ...(targetPendingResponse.requests || [])
      ];

      // Remove duplicates by id
      const uniquePending = allPending.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );

      setPendingItems(uniquePending);

      // For completed, we need to fetch all requests and filter by COMPLETED status
      // For now, we'll use a placeholder - you might need a new API endpoint
      setCompletedItems([]);

    } catch (error: any) {
      console.error("Failed to fetch introduction history:", error);
      toast.error("소개 이력을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTargetAccept = async (requestId: string) => {
    try {
      await api.put(`/api/v1/matchmaking/requests/${requestId}/target/accept`, {
        message: null
      });
      toast.success("매칭을 수락했습니다! 연락처가 공유됩니다.");
      await fetchIntroductionHistory();
    } catch (error: any) {
      console.error("Failed to accept request:", error);
      toast.error("수락에 실패했습니다");
    }
  };

  const handleTargetReject = async (requestId: string) => {
    try {
      await api.put(`/api/v1/matchmaking/requests/${requestId}/target/reject`, {
        message: null
      });
      toast.info("매칭을 거절했습니다.");
      await fetchIntroductionHistory();
    } catch (error: any) {
      console.error("Failed to reject request:", error);
      toast.error("거절에 실패했습니다");
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "PENDING":
        return {
          label: "주선자 승인 대기",
          color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
          icon: <Clock className="w-4 h-4" />
        };
      case "MATCHMAKER_APPROVED":
        return {
          label: "응답 필요",
          color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
          icon: <Heart className="w-4 h-4" />
        };
      case "COMPLETED":
        return {
          label: "매칭 완료",
          color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
          icon: <CheckCircle2 className="w-4 h-4" />
        };
      case "REJECTED_BY_MATCHMAKER":
      case "REJECTED_BY_TARGET":
        return {
          label: "매칭 불발",
          color: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200",
          icon: <XCircle className="w-4 h-4" />
        };
      default:
        return {
          label: status,
          color: "bg-gray-100 text-gray-800",
          icon: <Clock className="w-4 h-4" />
        };
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-center text-xl font-semibold">소개 이력</h2>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="w-full grid grid-cols-2 px-6 py-4 bg-background">
          <TabsTrigger value="pending" className="data-[state=active]:bg-card">
            <Clock className="w-4 h-4 mr-2" />
            기다리는 중
            {pendingItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {pendingItems.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-card">
            <Heart className="w-4 h-4 mr-2" />
            매칭완료
            {completedItems.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {completedItems.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Pending Requests Tab */}
        <TabsContent value="pending" className="px-6 mt-4">
          {pendingItems.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">대기 중인 주선 요청이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingItems.map((request) => {
                const statusInfo = getStatusInfo(request.status);
                const isTargetUser = request.status === "MATCHMAKER_APPROVED";

                return (
                  <div
                    key={request.id}
                    className="bg-card rounded-2xl overflow-hidden border border-border"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-medium text-lg">
                            {request.targetNickname || request.targetRealName || "알 수 없음"}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {request.matchmakerName}님의 주선
                          </p>
                        </div>
                        <div className={`px-3 py-1 rounded-full flex items-center gap-2 ${statusInfo.color}`}>
                          {statusInfo.icon}
                          <span className="text-xs font-medium">{statusInfo.label}</span>
                        </div>
                      </div>

                      {request.message && (
                        <div className="bg-muted/50 rounded-lg p-3 mb-3">
                          <p className="text-sm text-muted-foreground mb-1">요청자 메시지</p>
                          <p className="text-sm">{request.message}</p>
                        </div>
                      )}

                      {isTargetUser && (
                        <div className="flex gap-3 mt-4">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleTargetReject(request.id)}
                          >
                            거절하기
                          </Button>
                          <Button
                            className="flex-1 bg-gradient-to-r from-pink-400 to-rose-400"
                            onClick={() => handleTargetAccept(request.id)}
                          >
                            수락하기
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Completed Matches Tab */}
        <TabsContent value="completed" className="px-6 mt-4">
          {completedItems.length === 0 ? (
            <div className="text-center py-12">
              <Heart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">아직 매칭 완료된 소개가 없습니다</p>
              <p className="text-sm text-muted-foreground mt-2">
                주선을 통해 멋진 인연을 만나보세요!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedItems.map((request) => (
                <div
                  key={request.id}
                  className="bg-card rounded-2xl overflow-hidden border border-border"
                >
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-lg">
                          {request.targetNickname || request.targetRealName || "알 수 없음"}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {request.matchmakerName}님의 주선
                        </p>
                      </div>
                      <div className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="text-xs font-medium">매칭 완료</span>
                      </div>
                    </div>

                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-800 dark:text-green-200">
                        💕 연락처가 교환되었습니다. 멋진 대화를 시작해보세요!
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
