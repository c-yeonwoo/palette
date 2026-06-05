import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Heart, Clock, CheckCircle2, XCircle, MessageSquare, Send, Users, ChevronLeft } from "lucide-react";
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
  offeredPoints?: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface MatchRequestWithRole extends MatchRequest {
  myRole: "requester" | "target";
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

type TabType = "pending" | "completed";

export function IntroductionHistoryScreen({ onBack }: { onBack?: () => void }) {
  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [pendingItems, setPendingItems] = useState<MatchRequestWithRole[]>([]);
  const [completedItems, setCompletedItems] = useState<RelationshipStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingStage, setUpdatingStage] = useState<string | null>(null);
  const [submittingFeedback, setSubmittingFeedback] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [requesterRes, targetRes, relRes] = await Promise.all([
        api.get<any>("/api/v1/matchmaking/requests/pending").catch(() => ({ requests: [] })),
        api.get<any>("/api/v1/matchmaking/requests/target/pending").catch(() => ({ requests: [] })),
        api.get<RelationshipStatus[]>("/api/v1/relationships").catch(() => []),
      ]);

      // 역할 태깅 후 병합 (중복 시 requester 우선)
      const requesterItems: MatchRequestWithRole[] = (requesterRes.requests || []).map(
        (r: MatchRequest) => ({ ...r, myRole: "requester" as const })
      );
      const targetItems: MatchRequestWithRole[] = (targetRes.requests || []).map(
        (r: MatchRequest) => ({ ...r, myRole: "target" as const })
      );
      const map = new Map<string, MatchRequestWithRole>();
      targetItems.forEach(r => map.set(r.id, r));
      requesterItems.forEach(r => map.set(r.id, r)); // requester 우선
      setPendingItems(Array.from(map.values()));
      setCompletedItems(Array.isArray(relRes) ? relRes : []);
    } catch {
      toast.error("소개 이력을 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTargetAccept = async (requestId: string) => {
    try {
      await api.put(`/api/v1/matchmaking/requests/${requestId}/target/accept`, { message: null });
      toast.success("매칭을 수락했습니다");
      fetchData();
    } catch {
      toast.error("수락에 실패했습니다");
    }
  };

  const handleTargetReject = async (requestId: string) => {
    try {
      await api.put(`/api/v1/matchmaking/requests/${requestId}/target/reject`, { message: null });
      toast.info("매칭을 거절했습니다.");
      fetchData();
    } catch {
      toast.error("거절에 실패했습니다");
    }
  };

  const updateRelationshipStage = async (requestId: string, stage: string) => {
    setUpdatingStage(requestId + stage);
    try {
      await api.put(`/api/v1/relationships/${requestId}/stage`, { stage });
      toast.success("업데이트되었습니다!");
      fetchData();
    } catch {
      toast.error("업데이트에 실패했습니다");
    } finally {
      setUpdatingStage(null);
    }
  };

  const submitPhotoFeedback = async (requestId: string, feedback: string) => {
    setSubmittingFeedback(requestId);
    try {
      await api.post(`/api/v1/relationships/${requestId}/photo-feedback`, { feedback });
      toast.success("피드백이 제출되었습니다!");
      fetchData();
    } catch {
      toast.error("피드백 제출에 실패했습니다");
    } finally {
      setSubmittingFeedback(null);
    }
  };

  // getStatusBadge → RequestTimeline 컴포넌트로 대체

  const actionNeeded = pendingItems.filter(r => r.status === "MATCHMAKER_APPROVED" && r.myRole === "target").length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 통일 헤더 (ADR 0014) */}
      <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border pt-safe-top">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <button onClick={onBack} className="p-1.5 rounded-full hover:bg-muted/50 transition-colors -ml-1.5">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-base font-bold text-foreground">소개</h1>
          </div>
          {actionNeeded > 0 && (
            <span className="text-xs font-semibold text-primary bg-brand-soft rounded-full px-2.5 py-1">
              응답 필요 {actionNeeded}건
            </span>
          )}
        </div>
      </header>

      {/* Tabs */}
      <div className="max-w-2xl mx-auto flex border-b border-border/40 px-4 bg-background sticky top-14 z-10">
        {(["pending", "completed"] as TabType[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium relative transition-colors ${
              activeTab === tab ? "text-primary" : "text-muted-foreground"
            }`}
          >
            {tab === "pending" ? (
              <span className="flex items-center justify-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                진행 중
                {pendingItems.length > 0 && (
                  <span className="bg-primary text-primary-foreground text-xs font-bold min-w-[16px] h-4 px-0.5 rounded-full inline-flex items-center justify-center">
                    {pendingItems.length}
                  </span>
                )}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-1.5">
                <Heart className="w-3.5 h-3.5" />
                매칭 완료
                {completedItems.length > 0 && (
                  <span className="bg-muted text-muted-foreground text-xs font-bold min-w-[16px] h-4 px-0.5 rounded-full inline-flex items-center justify-center">
                    {completedItems.length}
                  </span>
                )}
              </span>
            )}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-4">
        {/* ── 진행 중 탭 ── */}
        {activeTab === "pending" && (
          <>
            {pendingItems.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Send className="w-7 h-7 text-muted-foreground opacity-50" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">진행 중인 소개가 없어요</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    홈 피드에서 마음에 드는 분께<br />주선 요청을 해보세요
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingItems.map(request => {
                  const isActionNeeded = request.status === "MATCHMAKER_APPROVED" && request.myRole === "target";
                  return (
                    <div
                      key={request.id}
                      className={`bg-card rounded-2xl border overflow-hidden ${
                        isActionNeeded ? "border-primary/40 shadow-sm shadow-primary/10" : "border-border/60"
                      }`}
                    >
                      {isActionNeeded && (
                        <div className="bg-primary/5 px-4 py-2 border-b border-primary/15">
                          <p className="text-xs font-semibold text-primary">💌 소개 요청이 왔어요</p>
                        </div>
                      )}
                      <div className="p-4 space-y-4">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-semibold text-sm">
                              {request.myRole === "requester"
                                ? (request.targetNickname || request.targetRealName || "상대방")
                                : "소개 요청"
                              }
                            </p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {request.matchmakerName}님 주선 ·{" "}
                              {new Date(request.createdAt).toLocaleDateString("ko-KR", { month: "long", day: "numeric" })}
                            </p>
                          </div>
                          {(request.offeredPoints ?? 0) > 0 && request.myRole === "requester" && (
                            <span className="text-xs font-bold text-primary bg-brand-soft rounded-full px-2 py-0.5">
                              {request.offeredPoints}P 제안
                            </span>
                          )}
                        </div>

                        {/* Timeline */}
                        <RequestTimeline request={request} />

                        {/* Matchmaker message */}
                        {request.matchmakerMessage && (
                          <div className="bg-secondary rounded-xl p-3 flex gap-2">
                            <MessageSquare className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs text-muted-foreground mb-0.5">주선자 메시지</p>
                              <p className="text-sm">{request.matchmakerMessage}</p>
                            </div>
                          </div>
                        )}

                        {/* Target action buttons */}
                        {isActionNeeded && (
                          <div className="flex gap-2 pt-1">
                            <Button variant="outline" className="flex-1 h-10" onClick={() => handleTargetReject(request.id)}>
                              거절
                            </Button>
                            <Button className="flex-1 h-10" onClick={() => handleTargetAccept(request.id)}>
                              수락하기 💌
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── 매칭 완료 탭 ── */}
        {activeTab === "completed" && (
          <>
            {completedItems.length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <Users className="w-7 h-7 text-muted-foreground opacity-50" />
                </div>
                <div>
                  <p className="font-medium text-muted-foreground">아직 매칭된 인연이 없어요</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    주선이 성사되면 여기서<br />관계 단계를 기록할 수 있어요
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {completedItems.map(rel => {
                  const currentStageIdx = STAGE_STEPS.findIndex(s => s.key === rel.stage);
                  return (
                    <div key={rel.requestId} className="bg-card rounded-2xl border border-border/60 p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          <span className="font-semibold text-sm">매칭 성사</span>
                        </div>
                        <span className="text-xl">{STAGE_STEPS[currentStageIdx]?.emoji}</span>
                      </div>

                      {rel.encouragementMessage && (
                        <div className="bg-primary/5 rounded-xl p-3 flex gap-2">
                          <MessageSquare className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
                          <p className="text-sm">{rel.encouragementMessage}</p>
                        </div>
                      )}

                      {/* Stage bar */}
                      <div>
                        <div className="flex items-center gap-1 mb-2">
                          {STAGE_STEPS.map((step, idx) => (
                            <div key={step.key} className="flex-1 text-center">
                              <div className={`h-1.5 rounded-full mb-1 transition-all ${idx <= currentStageIdx ? "bg-primary" : "bg-muted"}`} />
                              <span className={`text-xs ${idx === currentStageIdx ? "text-primary font-semibold" : "text-muted-foreground"}`}>
                                {step.emoji}
                              </span>
                            </div>
                          ))}
                        </div>
                        <p className="text-xs text-center text-primary font-medium">
                          {STAGE_STEPS[currentStageIdx]?.label}
                        </p>
                      </div>

                      {/* Photo feedback */}
                      {(rel.stage === "MET" || rel.stage === "DATING") && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">실물 사진 유사도</p>
                          {rel.photoFeedback ? (
                            <div className="bg-muted/30 rounded-xl px-3 py-2 text-sm text-center">
                              {PHOTO_FEEDBACK_OPTIONS.find(o => o.value === rel.photoFeedback)?.emoji}{" "}
                              {PHOTO_FEEDBACK_OPTIONS.find(o => o.value === rel.photoFeedback)?.label}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-1.5">
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

                      {/* Stage update */}
                      {currentStageIdx < STAGE_STEPS.length - 1 ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full"
                          disabled={updatingStage !== null}
                          onClick={() => updateRelationshipStage(rel.requestId, STAGE_STEPS[currentStageIdx + 1].key)}
                        >
                          {STAGE_STEPS[currentStageIdx + 1].emoji} {STAGE_STEPS[currentStageIdx + 1].label}로 업데이트
                        </Button>
                      ) : (
                        <p className="text-center text-sm text-pink-500 font-medium">💕 행복한 연애 중이에요!</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── 요청 상태 타임라인 ────────────────────────────────────────
function RequestTimeline({ request }: { request: MatchRequestWithRole }) {
  type Step = { label: string; sub?: string; state: "done" | "active" | "failed" | "waiting" };

  const steps: Step[] = (() => {
    const { status, myRole, matchmakerName, offeredPoints } = request;
    const pts = offeredPoints ?? 0;

    if (myRole === "requester") {
      // 주선자가 검토하는 단계
      const step1: Step = { label: "주선 요청 전달", sub: `${matchmakerName}님께 전달됐어요`, state: "done" };

      if (status === "PENDING") {
        return [
          step1,
          { label: "주선자 검토 중", sub: "보통 1~2일 내 답변해요", state: "active" },
          { label: "상대방 응답 대기", state: "waiting" },
        ];
      }
      if (status === "REJECTED_BY_MATCHMAKER") {
        return [
          step1,
          { label: "이번엔 인연이 닿지 않았어요", sub: "다음 인연을 찾아볼게요 🌿", state: "failed" },
        ];
      }
      const step2: Step = {
        label: "주선자가 수락했어요",
        sub: pts > 0 ? `${pts}P가 ${matchmakerName}님께 전달됐어요` : undefined,
        state: "done",
      };
      if (status === "MATCHMAKER_APPROVED") {
        return [step1, step2, { label: "상대방 검토 중", sub: "보통 1~3일 내 답변해요", state: "active" }];
      }
      if (status === "REJECTED_BY_TARGET") {
        return [step1, step2, { label: "이번엔 인연이 닿지 않았어요", sub: "다음 인연을 찾아볼게요 🌿", state: "failed" }];
      }
      if (status === "COMPLETED") {
        return [step1, step2, { label: "매칭 성사! 🎉", sub: "연락처를 확인해보세요", state: "done" }];
      }
      return [step1, step2];
    }

    // Target(수신자) 뷰 — 훨씬 단순하게
    if (status === "MATCHMAKER_APPROVED") {
      return [
        { label: "소개 요청이 도착했어요", sub: `${matchmakerName}님이 연결해드려요`, state: "active" },
      ];
    }
    if (status === "COMPLETED") {
      return [{ label: "매칭 성사! 🎉", sub: "연락처를 확인해보세요", state: "done" }];
    }
    if (status === "REJECTED_BY_TARGET") {
      return [{ label: "거절하셨어요", sub: "언제든 마음이 바뀌면 주선을 요청해보세요", state: "failed" }];
    }
    return [{ label: "처리 중", state: "active" }];
  })();

  const dotColor: Record<Step["state"], string> = {
    done: "bg-primary",
    active: "bg-primary ring-4 ring-primary/20",
    failed: "bg-muted-foreground/30",
    waiting: "bg-muted",
  };
  const labelColor: Record<Step["state"], string> = {
    done: "text-foreground",
    active: "text-primary font-semibold",
    failed: "text-muted-foreground",
    waiting: "text-muted-foreground/50",
  };

  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3">
          {/* Dot + connector */}
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0 transition-all ${dotColor[step.state]}`} />
            {i < steps.length - 1 && (
              <div className={`w-px flex-1 my-1 ${step.state === "done" ? "bg-primary/30" : "bg-border"}`} style={{ minHeight: 16 }} />
            )}
          </div>
          {/* Content */}
          <div className="pb-3 min-w-0">
            <p className={`text-sm leading-snug ${labelColor[step.state]}`}>{step.label}</p>
            {step.sub && <p className="text-xs text-muted-foreground mt-0.5">{step.sub}</p>}
          </div>
        </div>
      ))}
    </div>
  );
}
