import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import { Heart, Clock, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
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
  matchmakerMessage: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface RelationshipStatus {
  requestId: string;
  stage: string;
  message: string | null;
  encouragementMessage: string | null;
  updatedAt: string;
  photoFeedback: string | null;
}

const PHOTO_FEEDBACK_OPTIONS = [
  { value: "VERY_SIMILAR", label: "사진과 매우 비슷해요", emoji: "😍" },
  { value: "SIMILAR", label: "사진과 비슷해요", emoji: "😊" },
  { value: "DIFFERENT", label: "사진과 조금 달라요", emoji: "🤔" },
  { value: "VERY_DIFFERENT", label: "사진과 많이 달라요", emoji: "😅" },
];

const STAGE_STEPS = [
  { key: "MATCHED", label: "매칭 성사", emoji: "🎉" },
  { key: "CONTACTS_EXCHANGED", label: "연락 시작", emoji: "💬" },
  { key: "MET", label: "만남 완료", emoji: "☕" },
  { key: "DATING", label: "연애 중", emoji: "💕" },
];

export function IntroductionHistoryScreen() {
  const [pendingItems, setPendingItems] = useState<MatchRequest[]>([]);
  const [completedItems, setCompletedItems] = useState<RelationshipStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

  const submitPhotoFeedback = async (requestId: string, feedback: string) => {
    setSubmittingFeedback(requestId);
    try {
      await api.post(`/api/v1/relationships/${requestId}/photo-feedback`, { feedback });
      toast.success("피드백이 제출되었습니다!");
      await fetchIntroductionHistory();
    } catch {
      toast.error("피드백 제출에 실패했습니다");
    } finally {
      setSubmittingFeedback(null);
    }
  };

  useEffect(() => {
    fetchIntroductionHistory();
  }, []);

  const fetchIntroductionHistory = async () => {
    try {
      setIsLoading(true);

      const [requesterPendingResponse, targetPendingResponse, relationshipsResponse] = await Promise.all([
        api.get<any>("/api/v1/matchmaking/requests/pending"),
        api.get<any>("/api/v1/matchmaking/requests/target/pending"),
        api.get<RelationshipStatus[]>("/api/v1/relationships").catch(() => [])
      ]);

      const allPending = [
        ...(requesterPendingResponse.requests || []),
        ...(targetPendingResponse.requests || [])
      ];

      const uniquePending = allPending.filter((item, index, self) =>
        index === self.findIndex((t) => t.id === item.id)
      );

      setPendingItems(uniquePending);
      setCompletedItems(Array.isArray(relationshipsResponse) ? relationshipsResponse : []);

    } catch (error: any) {
      console.error("Failed to fetch introduction history:", error);
      toast.error("소개 이력을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const updateRelationshipStage = async (requestId: string, stage: string) => {
    setUpdatingStage(requestId + stage);
    try {
      await api.put(`/api/v1/relationships/${requestId}/stage`, { stage });
      toast.success("관계 단계가 업데이트되었습니다!");
      await fetchIntroductionHistory();
    } catch {
      toast.error("업데이트에 실패했습니다");
    } finally {
      setUpdatingStage(null);
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
                        <div className="bg-muted/50 rounded-lg p-3 mb-2">
                          <p className="text-xs text-muted-foreground mb-1">요청자 메시지</p>
                          <p className="text-sm">{request.message}</p>
                        </div>
                      )}

                      {request.matchmakerMessage && (
                        <div className="bg-primary/5 rounded-lg p-3 mb-2 flex gap-2">
                          <MessageSquare className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">주선자 응원 메시지</p>
                            <p className="text-sm">{request.matchmakerMessage}</p>
                          </div>
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
              {completedItems.map((rel) => {
                const currentStageIdx = STAGE_STEPS.findIndex(s => s.key === rel.stage);
                return (
                  <div key={rel.requestId} className="bg-card rounded-2xl overflow-hidden border border-border">
                    <div className="p-4 space-y-4">
                      {/* Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <span className="font-medium">매칭 성사</span>
                        </div>
                        <span className="text-lg">{STAGE_STEPS[currentStageIdx]?.emoji}</span>
                      </div>

                      {/* Encouragement message from matchmaker */}
                      {rel.encouragementMessage && (
                        <div className="bg-primary/5 rounded-xl p-3 flex gap-2">
                          <MessageSquare className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-muted-foreground mb-0.5">주선자 응원 메시지</p>
                            <p className="text-sm">{rel.encouragementMessage}</p>
                          </div>
                        </div>
                      )}

                      {/* Stage progress */}
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">관계 단계</p>
                        <div className="flex items-center gap-1">
                          {STAGE_STEPS.map((step, idx) => (
                            <div key={step.key} className="flex-1 text-center">
                              <div className={`h-1 rounded-full mb-1 ${idx <= currentStageIdx ? "bg-primary" : "bg-muted"}`} />
                              <span className={`text-[10px] ${idx === currentStageIdx ? "text-primary font-medium" : "text-muted-foreground"}`}>
                                {step.emoji}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-center text-primary mt-1 font-medium">
                          {STAGE_STEPS[currentStageIdx]?.label}
                        </p>
                      </div>

                      {/* Photo feedback */}
                      {(rel.stage === "MET" || rel.stage === "DATING") && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">사진 유사도 피드백</p>
                          {rel.photoFeedback ? (
                            <div className="bg-muted/30 rounded-xl px-3 py-2 text-sm text-center">
                              {PHOTO_FEEDBACK_OPTIONS.find(o => o.value === rel.photoFeedback)?.emoji}{" "}
                              {PHOTO_FEEDBACK_OPTIONS.find(o => o.value === rel.photoFeedback)?.label}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {PHOTO_FEEDBACK_OPTIONS.map(opt => (
                                <button
                                  key={opt.value}
                                  disabled={submittingFeedback === rel.requestId}
                                  onClick={() => submitPhotoFeedback(rel.requestId, opt.value)}
                                  className="flex items-center gap-1.5 bg-muted/30 hover:bg-muted/60 rounded-xl px-3 py-2 text-xs text-left transition-colors disabled:opacity-50"
                                >
                                  <span>{opt.emoji}</span>
                                  <span>{opt.label}</span>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Stage update buttons */}
                      {currentStageIdx < STAGE_STEPS.length - 1 && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full gap-1"
                          disabled={updatingStage !== null}
                          onClick={() => updateRelationshipStage(rel.requestId, STAGE_STEPS[currentStageIdx + 1].key)}
                        >
                          {STAGE_STEPS[currentStageIdx + 1].emoji} {STAGE_STEPS[currentStageIdx + 1].label}로 업데이트
                        </Button>
                      )}
                      {currentStageIdx === STAGE_STEPS.length - 1 && (
                        <div className="text-center text-sm text-pink-500 font-medium">
                          💕 행복한 연애 중이에요!
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
