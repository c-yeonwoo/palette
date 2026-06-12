import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronLeft, Star, Heart, Users, CheckCircle2, Loader2, Send } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { tierFor } from "../../lib/matchmakerLevels";

interface MatchmakerPublicProfileScreenProps {
  matchmakerId: string;
  onBack: () => void;
  onRequestMatch: (matchmakerId: string) => void;
}

interface MatchmakerPublicDetail {
  matchmakerId: string;
  userId: string;
  nickname: string;
  profilePhotoUrl: string | null;
  level: number;
  commissionRate: number;
  successfulMatches: number;
  totalMatchRequests: number;
  bio: string | null;
  specialties: string[];
  averageRating: number;
  totalReviews: number;
  reviews: Review[];
}

interface Review {
  reviewerNickname: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export function MatchmakerPublicProfileScreen({
  matchmakerId,
  onBack,
  onRequestMatch,
}: MatchmakerPublicProfileScreenProps) {
  const [matchmaker, setMatchmaker] = useState<MatchmakerPublicDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const loadMatchmaker = async () => {
    setIsLoading(true);
    setLoadError(false);
    try {
      const data = await api.get<MatchmakerPublicDetail>(`/api/v1/matchmakers/${matchmakerId}/public`);
      setMatchmaker(data);
    } catch {
      // 더미로 채우지 않고 정직한 에러 상태 노출
      setMatchmaker(null);
      setLoadError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatchmaker();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchmakerId]);

  const handleSubmitReview = async () => {
    if (!reviewComment.trim()) { toast.info('후기를 입력해주세요'); return; }
    setIsSubmittingReview(true);
    try {
      await api.post(`/api/v1/matchmakers/${matchmakerId}/reviews`, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      toast.success('후기가 등록됐어요');
      setShowReviewForm(false);
      setReviewComment("");
    } catch {
      toast.error('후기 등록에 실패했어요');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError || !matchmaker) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center px-4 pt-12 pb-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
          <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Users className="w-7 h-7 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-semibold text-foreground">주선자 정보를 불러올 수 없어요</p>
            <p className="text-sm text-muted-foreground">잠시 후 다시 시도해주세요</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadMatchmaker}>다시 시도</Button>
            <Button variant="ghost" onClick={onBack}>돌아가기</Button>
          </div>
        </div>
      </div>
    );
  }

  const lv = tierFor(matchmaker.level);
  const approvalRate = matchmaker.totalMatchRequests > 0
    ? Math.round((matchmaker.successfulMatches / matchmaker.totalMatchRequests) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* 상단 네비 */}
      <div className="flex items-center px-4 pt-12 pb-4">
        <button onClick={onBack} className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* 프로필 헤더 */}
      <div className="px-6 pb-6 text-center border-b border-border">
        {matchmaker.profilePhotoUrl ? (
          <img
            src={matchmaker.profilePhotoUrl}
            alt={matchmaker.nickname}
            className="w-24 h-24 rounded-full object-cover mx-auto mb-3 border-4 border-background shadow-md"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center text-3xl font-bold text-muted-foreground mx-auto mb-3">
            {matchmaker.nickname.charAt(0)}
          </div>
        )}
        <h2 className="text-xl font-bold text-foreground">{matchmaker.nickname}</h2>
        <div className="flex items-center justify-center gap-2 mt-1">
          <span className="text-sm font-medium" style={{ color: lv.color }}>
            {lv.emoji} Lv.{matchmaker.level} {lv.name}
          </span>
          {matchmaker.averageRating > 0 && (
            <>
              <span className="text-muted-foreground">·</span>
              <div className="flex items-center gap-0.5">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium">{matchmaker.averageRating.toFixed(1)}</span>
              </div>
            </>
          )}
        </div>

        {/* 전문 분야 칩 */}
        {matchmaker.specialties.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-3">
            {matchmaker.specialties.map((sp) => (
              <span key={sp} className="text-xs px-2 py-0.5 rounded-full bg-brand-soft text-primary font-medium">
                {sp}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* 통계 */}
      <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
        <div className="flex flex-col items-center py-4 gap-0.5">
          <div className="flex items-center gap-1">
            <Heart className="w-3.5 h-3.5 text-primary" />
            <span className="text-base font-bold text-foreground">{matchmaker.successfulMatches}</span>
          </div>
          <span className="text-xs text-muted-foreground">성공 쌍</span>
        </div>
        <div className="flex flex-col items-center py-4 gap-0.5">
          <span className="text-base font-bold text-foreground">{approvalRate}%</span>
          <span className="text-xs text-muted-foreground">성사율</span>
        </div>
        <div className="flex flex-col items-center py-4 gap-0.5">
          <span className="text-base font-bold text-foreground">{Math.round(matchmaker.commissionRate * 100)}%</span>
          <span className="text-xs text-muted-foreground">커미션</span>
        </div>
      </div>

      <div className="divide-y divide-border">
        {/* 소개 */}
        {matchmaker.bio && (
          <section className="px-6 py-6">
            <p className="text-sm font-semibold text-foreground mb-2">주선자 소개</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{matchmaker.bio}</p>
          </section>
        )}

        {/* 매칭 안내 */}
        <section className="px-6 py-6">
          <p className="text-sm font-semibold text-foreground mb-3">매칭 안내</p>
          <div className="space-y-2.5">
            {[
              { label: "커미션", value: `매칭 성공 시 ${Math.round(matchmaker.commissionRate * 100)}%` },
              { label: "진행 방식", value: "주선자가 적합한 상대를 선별 후 연결" },
              { label: "개인정보", value: "매칭 성사 전까지 상호 비공개" },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-start gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground mt-1.5 flex-shrink-0" />
                <div>
                  <span className="text-xs font-semibold text-foreground">{label}</span>
                  <span className="text-xs text-muted-foreground ml-2">{value}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 후기 */}
        <section className="px-6 py-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-foreground">
              후기 {matchmaker.totalReviews > 0 ? `(${matchmaker.totalReviews})` : ""}
            </p>
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="text-xs text-primary font-medium"
            >
              후기 쓰기
            </button>
          </div>

          {/* 후기 작성 폼 */}
          {showReviewForm && (
            <div className="bg-muted rounded-xl p-4 mb-4 space-y-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button key={s} onClick={() => setReviewRating(s)}>
                    <Star
                      className={`w-6 h-6 ${s <= reviewRating ? "text-amber-400 fill-amber-400" : "text-muted-foreground"}`}
                    />
                  </button>
                ))}
              </div>
              <textarea
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="주선자와의 경험을 남겨주세요"
                rows={3}
                maxLength={200}
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSubmitReview} disabled={isSubmittingReview} className="flex-1">
                  {isSubmittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "등록"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowReviewForm(false)} className="flex-1">
                  취소
                </Button>
              </div>
            </div>
          )}

          {matchmaker.reviews.length > 0 ? (
            <div className="space-y-3">
              {matchmaker.reviews.map((r, i) => (
                <div key={i} className="bg-muted rounded-xl p-3.5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-foreground">{r.reviewerNickname}</span>
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: r.rating }).map((_, j) => (
                          <Star key={j} className="w-3 h-3 text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">아직 후기가 없어요</p>
          )}
        </section>
      </div>

      {/* 하단 요청 버튼 */}
      <div className="fixed bottom-0 left-0 right-0 px-6 pb-8 pt-3 bg-card/95 backdrop-blur border-t border-border">
        <Button
          onClick={() => onRequestMatch(matchmakerId)}
          className="w-full h-12 font-semibold"
        >
          <Send className="w-4 h-4 mr-2" />
          이 주선자에게 매칭 요청
        </Button>
      </div>
    </div>
  );
}
