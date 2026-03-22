import { useState, useEffect, useRef } from "react";
import { Sparkles } from "lucide-react";
import { FortuneBanner } from "./FortuneBanner";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";

interface ProfilePhoto { id: string; url: string; displayOrder: number; isPrimary: boolean; }
interface BasicInfoDto { height: number | null; bodyType: string | null; mbti: string; }
interface CareerInfoDto { category: string | null; company: string | null; incomeRange: string | null; }
interface LocationInfoDto { sido: string | null; sigungu: string | null; }
interface IntroductionDto { text: string | null; interests: string[] | null; interviewAnswers: unknown; }
interface ProfileMetricsDto { completionRate: number; trustScore: number; viewCount: number; }

interface ProfileResponse {
  userId: string;
  primaryPhotoUrl: string | null;
  photos: ProfilePhoto[];
  basicInfo: BasicInfoDto;
  careerInfo: CareerInfoDto;
  locationInfo: LocationInfoDto;
  introduction: IntroductionDto;
  metrics: ProfileMetricsDto;
}

interface AiSignalRecommendation {
  profile: ProfileResponse | null;
  reason: string;
  similarityScore: number;
  isFree: boolean;
  isUnlocked: boolean;
  unlockPrice: number;
  isOpened: boolean;
  teaserAge: number | null;
  teaserLocation: string | null;
}

interface AiSignalResponse {
  recommendations: AiSignalRecommendation[];
  generatedAt: string;
  isStub: boolean;
}

const JOB_MAP: Record<string, string> = {
  IT_DEVELOPMENT: "IT개발", FINANCE: "금융", EDUCATION: "교육", MEDICAL: "의료",
  MEDIA: "미디어", SERVICE: "서비스", MANUFACTURING: "제조", PUBLIC_OFFICIAL: "공무원",
  PROFESSIONAL: "전문직", OTHER: "기타",
};

// ─── Paint Wipe Card ──────────────────────────────────────────────────────────
function PaintCard({
  rec,
  onProfileClick,
}: {
  rec: AiSignalRecommendation;
  onProfileClick?: (userId: string) => void;
}) {
  const profile = rec.profile!;
  const [revealed, setRevealed] = useState(rec.isOpened);
  const [peeling, setPeeling] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = () => {
    if (revealed) {
      onProfileClick?.(profile.userId);
      return;
    }
    if (peeling) return;
    setPeeling(true);
    timerRef.current = setTimeout(() => {
      setRevealed(true);
      setPeeling(false);
      api.post(`/api/v1/feed/open/${profile.userId}`, {}).catch(() => {});
    }, 1200);
  };

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const job = profile.careerInfo.category ? JOB_MAP[profile.careerInfo.category] ?? null : null;
  const location = profile.locationInfo.sido;

  return (
    <div onClick={handleClick} className="flex-shrink-0 w-40 cursor-pointer select-none">
      <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-muted shadow-sm">
        {profile.primaryPhotoUrl ? (
          <img src={profile.primaryPhotoUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-muted via-accent to-muted/60 flex items-center justify-center">
            <span className="text-4xl opacity-20 select-none">👤</span>
          </div>
        )}
        {revealed && <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />}

        {/* Diagonal Wipe Transition */}
        {!revealed && (
          <div className="absolute inset-0" style={{
            backgroundImage: "url('/paint-overlay.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 0% 0%)",
            animation: peeling ? "diagonal-wipe 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards" : "none",
          }} />
        )}

        {/* AI badge */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground flex items-center gap-0.5">
            <Sparkles className="w-2.5 h-2.5" /> AI
          </span>
        </div>
        {rec.isFree && (
          <div className="absolute top-2 right-2 z-10">
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/90 text-white">FREE</span>
          </div>
        )}

        {revealed && (
          <div className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5">
            {profile.basicInfo.height && (
              <p className="text-white text-xs font-semibold">{profile.basicInfo.height}cm</p>
            )}
            {(job || location) && (
              <p className="text-white/70 text-[10px]">{[job, location].filter(Boolean).join(" · ")}</p>
            )}
          </div>
        )}
      </div>
      <p className="text-[10px] text-muted-foreground mt-1.5 px-0.5 truncate">{rec.reason}</p>
    </div>
  );
}

// ─── AI Signal Section ────────────────────────────────────────────────────────
function AiSignalSection({
  signal,
  onSignalChange,
  onProfileClick,
}: {
  signal: AiSignalResponse;
  onSignalChange: (s: AiSignalResponse) => void;
  onProfileClick?: (userId: string) => void;
}) {
  const [unlocking, setUnlocking] = useState(false);

  const handleUnlock = async (rec: AiSignalRecommendation) => {
    if (unlocking) return;
    setUnlocking(true);
    try {
      await api.post("/api/v1/feed/ai-signal/unlock", {});
      const updated = await api.get<AiSignalResponse>("/api/v1/feed/ai-signal");
      onSignalChange(updated);
      toast.success(`${rec.unlockPrice.toLocaleString()}원으로 AI 추천을 열었어요`);
    } catch {
      toast.error("열람에 실패했어요. 다시 시도해주세요.");
    } finally {
      setUnlocking(false);
    }
  };

  return (
    <div className="px-4 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-sm font-semibold">오늘의 AI 시그널</p>
        <span className="ml-auto text-[10px] text-muted-foreground">매일 1장 무료</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 -mx-4 px-4">
        {signal.recommendations.map((rec, i) => {
          if (rec.isUnlocked && rec.profile) {
            return <PaintCard key={i} rec={rec} onProfileClick={onProfileClick} />;
          }
          return (
            <div key={i} className="flex-shrink-0 w-40">
              <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-muted shadow-sm">
                <div className="w-full h-full bg-gradient-to-br from-primary/20 via-primary/10 to-muted flex items-center justify-center">
                  <span className="text-5xl opacity-10 select-none">👤</span>
                </div>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-3">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="text-center">
                    {rec.teaserAge && <p className="text-white/90 text-xs font-semibold">{rec.teaserAge}세</p>}
                    {rec.teaserLocation && <p className="text-white/70 text-[10px]">{rec.teaserLocation}</p>}
                  </div>
                  <button
                    onClick={() => handleUnlock(rec)}
                    disabled={unlocking}
                    className="mt-1 w-full py-1.5 rounded-xl bg-primary text-primary-foreground text-[10px] font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-60"
                  >
                    {unlocking ? "처리 중..." : `열기 ${rec.unlockPrice.toLocaleString()}원`}
                  </button>
                </div>
                <div className="absolute top-2 left-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-primary/90 text-primary-foreground flex items-center gap-0.5">
                    <Sparkles className="w-2.5 h-2.5" /> AI
                  </span>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5 px-0.5 truncate">{rec.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────
export function AiHubScreen({
  onProfileClick,
}: {
  onProfileClick?: (userId: string) => void;
}) {
  const [signal, setSignal] = useState<AiSignalResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<AiSignalResponse>("/api/v1/feed/ai-signal")
      .then(setSignal)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border/40">
        <div className="px-4 pt-safe-top pb-0">
          <div className="flex items-center gap-2 h-14">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-base font-bold">AI 허브</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto pt-4 space-y-2">
        {/* 오늘의 연애 운세 */}
        <FortuneBanner />

        {/* AI 시그널 */}
        {loading ? (
          <div className="px-4">
            <div className="h-48 rounded-2xl bg-muted animate-pulse" />
          </div>
        ) : signal && signal.recommendations.length > 0 ? (
          <AiSignalSection
            signal={signal}
            onSignalChange={setSignal}
            onProfileClick={onProfileClick}
          />
        ) : (
          <div className="px-4">
            <div className="rounded-2xl bg-card p-6 text-center">
              <Sparkles className="w-8 h-8 text-primary/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">오늘의 AI 시그널을 불러올 수 없어요</p>
            </div>
          </div>
        )}

        {/* 더 많은 AI 기능 Coming Soon */}
        <div className="px-4">
          <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Coming Soon</p>
            {["나의 연애 유형 분석", "AI 대화 시작 도우미", "이상형 유사도 분석"].map((item) => (
              <div key={item} className="flex items-center gap-3 opacity-40">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                </div>
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
