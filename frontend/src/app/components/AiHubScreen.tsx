import { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Brain,
  Heart,
  Star,
  Calculator,
  Lock,
  ChevronRight,
  Zap,
  X,
} from "lucide-react";
import { FortuneBanner } from "./FortuneBanner";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProfilePhoto {
  id: string;
  url: string;
  displayOrder: number;
  isPrimary: boolean;
}
interface BasicInfoDto {
  height: number | null;
  bodyType: string | null;
  mbti: string | null;
}
interface CareerInfoDto {
  category: string | null;
  company: string | null;
  incomeRange: string | null;
}
interface LocationInfoDto {
  sido: string | null;
  sigungu: string | null;
}
interface IntroductionDto {
  text: string | null;
  interests: string[] | null;
  interviewAnswers: unknown;
}
interface ProfileMetricsDto {
  completionRate: number;
  trustScore: number;
  viewCount: number;
}

interface ProfileResponse {
  userId: string;
  primaryPhotoUrl: string | null;
  photos: ProfilePhoto[];
  basicInfo: BasicInfoDto;
  careerInfo: CareerInfoDto;
  locationInfo: LocationInfoDto;
  introduction: IntroductionDto;
  metrics: ProfileMetricsDto;
  accountType?: string;
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
}

interface MyInsightsResponse {
  attachmentStyle: string | null;
  loveLanguage: string | null;
}

interface CompatibilityBreakdown {
  mbtiScore: number;
  mbtiLabel: string;
  zodiacScore: number;
  zodiacLabel: string;
  elementScore: number;
  elementLabel: string;
  colorScore: number;
  colorLabel: string;
}

interface CompatibilityResponse {
  totalScore: number;
  level: string;
  emoji: string;
  breakdown: CompatibilityBreakdown;
  summary: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const JOB_MAP: Record<string, string> = {
  IT_DEVELOPMENT: "IT개발",
  FINANCE: "금융",
  EDUCATION: "교육",
  MEDICAL: "의료",
  MEDIA: "미디어",
  SERVICE: "서비스",
  MANUFACTURING: "제조",
  PUBLIC_OFFICIAL: "공무원",
  PROFESSIONAL: "전문직",
  OTHER: "기타",
};

const MBTI_OPTIONS = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

const GOLDEN_PAIRS: Record<string, string[]> = {
  INTJ: ["ENFP", "ENTP"],
  INTP: ["ENTJ", "ENFJ"],
  ENTJ: ["INTP", "INFP"],
  ENTP: ["INFJ", "INTJ"],
  INFJ: ["ENTP", "ENFP"],
  INFP: ["ENTJ", "ENFJ"],
  ENFJ: ["INFP", "INTP"],
  ENFP: ["INTJ", "INFJ"],
  ISTJ: ["ESFP", "ESTP"],
  ISFJ: ["ESTP", "ESFP"],
  ESTJ: ["ISFP", "ISTP"],
  ESFJ: ["ISTP", "ISFP"],
  ISTP: ["ESFJ", "ESTJ"],
  ISFP: ["ESTJ", "ESFJ"],
  ESTP: ["ISFJ", "ISTJ"],
  ESFP: ["ISTJ", "ISFJ"],
};

// ─── Zodiac Helpers ───────────────────────────────────────────────────────────

function getZodiacSign(dateStr: string): { name: string; emoji: string } {
  if (!dateStr) return { name: "알 수 없음", emoji: "✨" };
  const date = new Date(dateStr);
  const m = date.getMonth() + 1;
  const d = date.getDate();
  if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return { name: "양자리", emoji: "♈" };
  if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return { name: "황소자리", emoji: "♉" };
  if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return { name: "쌍둥이자리", emoji: "♊" };
  if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return { name: "게자리", emoji: "♋" };
  if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return { name: "사자자리", emoji: "♌" };
  if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return { name: "처녀자리", emoji: "♍" };
  if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return { name: "천칭자리", emoji: "♎" };
  if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return { name: "전갈자리", emoji: "♏" };
  if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return { name: "사수자리", emoji: "♐" };
  if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return { name: "염소자리", emoji: "♑" };
  if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return { name: "물병자리", emoji: "♒" };
  return { name: "물고기자리", emoji: "♓" };
}

// ─── Quiz Data ────────────────────────────────────────────────────────────────

type AttachmentResult = "SECURE" | "ANXIOUS" | "AVOIDANT";
type LoveLanguageResult = "WORDS" | "ACTS" | "GIFTS" | "TIME" | "TOUCH";

interface QuizOption {
  label: string;
  value: string;
}

interface QuizQuestion {
  question: string;
  options: QuizOption[];
}

const ATTACHMENT_QUESTIONS: QuizQuestion[] = [
  {
    question: "연인이 연락이 늦을 때 나는?",
    options: [
      { label: "불안하고 계속 확인하게 된다", value: "ANXIOUS" },
      { label: "바쁜가보다 생각하고 기다린다", value: "SECURE" },
      { label: "오히려 내 시간을 즐긴다", value: "AVOIDANT" },
    ],
  },
  {
    question: "연인과 갈등이 생겼을 때?",
    options: [
      { label: "즉시 해결하려고 대화를 시도한다", value: "ANXIOUS" },
      { label: "차분하게 서로의 입장을 얘기한다", value: "SECURE" },
      { label: "혼자 생각을 정리하는 시간이 필요하다", value: "AVOIDANT" },
    ],
  },
  {
    question: "새로운 연인이 생겼을 때?",
    options: [
      { label: "빨리 더 가까워지고 싶어 먼저 표현한다", value: "ANXIOUS" },
      { label: "자연스럽게 천천히 알아간다", value: "SECURE" },
      { label: "나의 독립적인 생활 패턴을 지키려 한다", value: "AVOIDANT" },
    ],
  },
  {
    question: "연인이 나 말고 다른 사람과 친하게 지내면?",
    options: [
      { label: "나를 덜 좋아하는 건 아닐까 불안하다", value: "ANXIOUS" },
      { label: "건강한 관계를 위해 당연한 일이라 생각한다", value: "SECURE" },
      { label: "솔직히 조금 편하다", value: "AVOIDANT" },
    ],
  },
  {
    question: "연애에서 가장 힘든 것은?",
    options: [
      { label: "상대방의 마음을 확신하지 못할 때", value: "ANXIOUS" },
      { label: "서로 다른 가치관을 조율하는 것", value: "SECURE" },
      { label: "나만의 공간과 시간이 줄어드는 것", value: "AVOIDANT" },
    ],
  },
  {
    question: "이상적인 연인 관계는?",
    options: [
      { label: "항상 함께하며 모든 것을 공유하는 관계", value: "ANXIOUS" },
      { label: "서로 존중하며 함께 성장하는 관계", value: "SECURE" },
      { label: "각자의 생활을 유지하며 만날 때 즐거운 관계", value: "AVOIDANT" },
    ],
  },
];

const LOVE_LANGUAGE_QUESTIONS: QuizQuestion[] = [
  {
    question: "연인에게 가장 듣고 싶은 말은?",
    options: [
      { label: '"정말 사랑해" "너가 최고야"', value: "WORDS" },
      { label: '"내가 도와줄게" "네 일을 내가 할게"', value: "ACTS" },
      { label: "(선물을 주며) \"너 생각나서 샀어\"", value: "GIFTS" },
      { label: '"오늘 나랑 하루종일 있자"', value: "TIME" },
      { label: "(안아주며) \"많이 힘들었지?\"", value: "TOUCH" },
    ],
  },
  {
    question: "연인이 나를 사랑한다고 느낄 때는?",
    options: [
      { label: "자주 칭찬하고 응원해줄 때", value: "WORDS" },
      { label: "내가 힘들 때 먼저 도움을 줄 때", value: "ACTS" },
      { label: "기억해서 선물을 줄 때", value: "GIFTS" },
      { label: "바쁜데도 시간을 내줄 때", value: "TIME" },
      { label: "자연스럽게 손을 잡거나 안아줄 때", value: "TOUCH" },
    ],
  },
  {
    question: "생일에 연인이 해줬으면 하는 것은?",
    options: [
      { label: "감동적인 편지나 말", value: "WORDS" },
      { label: "평소 내가 힘들어했던 것을 대신 해결해주기", value: "ACTS" },
      { label: "오래 갖고 싶었던 선물", value: "GIFTS" },
      { label: "하루 종일 함께 데이트", value: "TIME" },
      { label: "많이 안아주기", value: "TOUCH" },
    ],
  },
  {
    question: "가장 기억에 남는 연인의 행동은?",
    options: [
      { label: '"네가 있어서 행복해"라고 말해줬을 때', value: "WORDS" },
      { label: "내가 아플 때 옆에서 다 챙겨줬을 때", value: "ACTS" },
      { label: "내가 좋아하는 걸 기억해 깜짝 선물", value: "GIFTS" },
      { label: "아무것도 안 해도 그냥 같이 있어줬을 때", value: "TIME" },
      { label: "힘들 때 말없이 안아줬을 때", value: "TOUCH" },
    ],
  },
  {
    question: "연인에게 서운함을 느낄 때는?",
    options: [
      { label: "칭찬이나 인정하는 말이 없을 때", value: "WORDS" },
      { label: "내가 바쁠 때 도움을 주지 않을 때", value: "ACTS" },
      { label: "기념일을 그냥 넘길 때", value: "GIFTS" },
      { label: "자꾸 약속을 미루거나 바쁘다고 할 때", value: "TIME" },
      { label: "스킨십이 줄어들 때", value: "TOUCH" },
    ],
  },
];

const ATTACHMENT_LABELS: Record<AttachmentResult, { label: string; emoji: string; desc: string }> = {
  SECURE: {
    label: "안정형",
    emoji: "🌟",
    desc: "건강한 애착 관계를 형성하며 상대방을 신뢰하고 자신도 사랑받을 자격이 있다고 느껴요.",
  },
  ANXIOUS: {
    label: "불안형",
    emoji: "💫",
    desc: "상대방의 사랑이 확실하지 않으면 불안해지며 더 가까워지고 싶은 욕구가 강해요.",
  },
  AVOIDANT: {
    label: "회피형",
    emoji: "🌙",
    desc: "독립성을 중요시하며 감정적 친밀함이 부담스럽게 느껴질 수 있어요.",
  },
};

const LOVE_LANGUAGE_LABELS: Record<LoveLanguageResult, { label: string; emoji: string; desc: string }> = {
  WORDS: { label: "칭찬의 말", emoji: "💬", desc: "언어로 표현되는 사랑과 인정이 가장 큰 힘이 돼요." },
  ACTS: { label: "봉사 행위", emoji: "🤝", desc: "실질적인 도움과 배려로 사랑을 표현하고 느껴요." },
  GIFTS: { label: "선물", emoji: "🎁", desc: "선물의 가치보다 기억하고 챙겨준 마음이 중요해요." },
  TIME: { label: "함께하는 시간", emoji: "⏰", desc: "진심으로 함께하는 시간이 최고의 사랑 표현이에요." },
  TOUCH: { label: "신체적 접촉", emoji: "🤗", desc: "포옹이나 스킨십으로 따뜻함과 안정감을 느껴요." },
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

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

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

        {!revealed && (
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: "url('/paint-overlay.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              clipPath: "polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, 0% 0%)",
              animation: peeling ? "diagonal-wipe 1.1s cubic-bezier(0.4, 0, 0.2, 1) forwards" : "none",
            }}
          />
        )}

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
              <p className="text-white/70 text-xs">{[job, location].filter(Boolean).join(" · ")}</p>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 px-0.5 truncate">{rec.reason}</p>
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
        <div className="w-6 h-6 rounded-lg bg-brand-soft flex items-center justify-center">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
        </div>
        <p className="text-sm font-semibold">오늘의 AI 시그널</p>
        <span className="ml-auto text-xs text-muted-foreground">매일 1장 무료</span>
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
                    {rec.teaserLocation && <p className="text-white/70 text-xs">{rec.teaserLocation}</p>}
                  </div>
                  <button
                    onClick={() => handleUnlock(rec)}
                    disabled={unlocking}
                    className="mt-1 w-full py-1.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-lg active:scale-95 transition-transform disabled:opacity-60"
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
              <p className="text-xs text-muted-foreground mt-1.5 px-0.5 truncate">{rec.reason}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Quiz Modal ───────────────────────────────────────────────────────────────

function QuizModal({
  open,
  onClose,
  title,
  questions,
  onComplete,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  questions: QuizQuestion[];
  onComplete: (result: string) => void;
}) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);

  const handleAnswer = (value: string) => {
    const newAnswers = [...answers, value];
    if (step < questions.length - 1) {
      setAnswers(newAnswers);
      setStep(step + 1);
    } else {
      // Calculate result
      const counts: Record<string, number> = {};
      for (const a of newAnswers) {
        counts[a] = (counts[a] ?? 0) + 1;
      }
      const result = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      onComplete(result);
      setStep(0);
      setAnswers([]);
    }
  };

  const handleClose = () => {
    setStep(0);
    setAnswers([]);
    onClose();
  };

  const currentQ = questions[step];

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-sm mx-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-base">{title}</DialogTitle>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1 mb-4">
          {questions.map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <p className="text-xs text-muted-foreground mb-1">Q{step + 1} / {questions.length}</p>
        <p className="text-sm font-semibold mb-4 leading-relaxed">{currentQ?.question}</p>

        <div className="space-y-2">
          {currentQ?.options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleAnswer(opt.value)}
              className="w-full text-left px-4 py-3 rounded-xl border border-border hover:border-primary hover:bg-primary/5 text-sm transition-colors"
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-4 h-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}

// ─── Attachment Style Card ────────────────────────────────────────────────────

function AttachmentStyleCard({
  result,
  onStartQuiz,
}: {
  result: string | null;
  onStartQuiz: () => void;
}) {
  const info = result ? ATTACHMENT_LABELS[result as AttachmentResult] : null;

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 min-h-[120px] flex flex-col justify-between hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
          <Brain className="w-4 h-4 text-violet-600 dark:text-violet-400" />
        </div>
        <p className="text-xs font-semibold">애착 유형</p>
      </div>

      {info ? (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg">{info.emoji}</span>
            <span className="text-sm font-bold">{info.label}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{info.desc}</p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground mb-2">나의 연애 방식을 알아보세요</p>
          <button
            onClick={onStartQuiz}
            className="text-xs font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all"
          >
            테스트 시작 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Love Language Card ───────────────────────────────────────────────────────

function LoveLanguageCard({
  result,
  onStartQuiz,
}: {
  result: string | null;
  onStartQuiz: () => void;
}) {
  const info = result ? LOVE_LANGUAGE_LABELS[result as LoveLanguageResult] : null;

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 min-h-[120px] flex flex-col justify-between hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-xl bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
          <Heart className="w-4 h-4 text-rose-500" />
        </div>
        <p className="text-xs font-semibold">러브 랭귀지</p>
      </div>

      {info ? (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg">{info.emoji}</span>
            <span className="text-sm font-bold">{info.label}</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{info.desc}</p>
        </div>
      ) : (
        <div>
          <p className="text-xs text-muted-foreground mb-2">사랑 표현 방식을 알아보세요</p>
          <button
            onClick={onStartQuiz}
            className="text-xs font-semibold text-primary flex items-center gap-1 hover:gap-2 transition-all"
          >
            테스트 시작 <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
}

// ─── MBTI 궁합 Card ───────────────────────────────────────────────────────────

function MbtiCompatCard({ mbti }: { mbti: string | null }) {
  const goldenPairs = mbti ? (GOLDEN_PAIRS[mbti.toUpperCase()] ?? []) : [];

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 min-h-[120px] flex flex-col justify-between hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Zap className="w-4 h-4 text-blue-500" />
        </div>
        <p className="text-xs font-semibold">MBTI 궁합</p>
      </div>

      {mbti ? (
        <div>
          <p className="text-xs text-muted-foreground mb-1">나의 MBTI</p>
          <p className="text-base font-bold text-primary mb-1">{mbti.toUpperCase()}</p>
          {goldenPairs.length > 0 && (
            <p className="text-xs text-muted-foreground">
              최고 궁합: <span className="font-semibold text-foreground">{goldenPairs.join(", ")}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed">
          프로필에서 MBTI를<br />설정해주세요
        </p>
      )}
    </div>
  );
}

// ─── Zodiac Card ──────────────────────────────────────────────────────────────

function ZodiacCard({ birthDate }: { birthDate: string | null }) {
  const zodiac = birthDate ? getZodiacSign(birthDate) : null;

  // Generate deterministic daily score from date
  const todayLoveScore = (() => {
    if (!birthDate) return 3;
    const today = new Date();
    const seed = today.getDate() + today.getMonth() * 31 + (birthDate.charCodeAt(5) || 0);
    return (seed % 5) + 1;
  })();

  const zodiacMessages: Record<number, string> = {
    1: "오늘은 차분하게 마음을 돌아보는 날이에요",
    2: "소소한 인연이 쌓이는 하루예요",
    3: "새로운 만남의 기운이 감돌아요",
    4: "진심이 통하는 좋은 날이에요",
    5: "오늘은 특별한 인연이 찾아올 수 있어요!",
  };

  return (
    <div className="rounded-2xl bg-card border border-border/60 p-4 min-h-[120px] flex flex-col justify-between hover:border-primary/40 transition-colors">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
          <Star className="w-4 h-4 text-amber-500" />
        </div>
        <p className="text-xs font-semibold">별자리 연애운</p>
      </div>

      {zodiac ? (
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-lg">{zodiac.emoji}</span>
            <span className="text-sm font-bold">{zodiac.name}</span>
          </div>
          <div className="flex gap-0.5 mb-1">
            {Array.from({ length: 5 }, (_, i) => (
              <span key={i} className={`text-xs ${i < todayLoveScore ? "text-amber-400" : "text-muted"}`}>★</span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
            {zodiacMessages[todayLoveScore]}
          </p>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground leading-relaxed">
          프로필에서 생년월일을<br />설정하면 확인할 수 있어요
        </p>
      )}
    </div>
  );
}

// ─── Compatibility Calculator ─────────────────────────────────────────────────

function CompatibilityCalculatorCard() {
  const [date1, setDate1] = useState("");
  const [date2, setDate2] = useState("");
  const [mbti1, setMbti1] = useState("");
  const [mbti2, setMbti2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CompatibilityResponse | null>(null);

  const handleCalculate = async () => {
    if (!date1 || !date2) {
      toast.error("생년월일을 모두 입력해주세요");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await api.post<CompatibilityResponse>("/api/v1/ai/compatibility", {
        birthDate1: date1,
        birthDate2: date2,
        mbti1: mbti1 || undefined,
        mbti2: mbti2 || undefined,
      });
      setResult(res);
    } catch {
      toast.error("계산에 실패했어요. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-4 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/10 via-card to-primary/5 border border-primary/20">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
            <Calculator className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium">AI 분석</p>
            <p className="text-sm font-bold">인연 점수 계산기</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">나의 생년월일</label>
            <input
              type="date"
              value={date1}
              onChange={(e) => setDate1(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-primary transition-colors"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">상대방 생년월일</label>
            <input
              type="date"
              value={date2}
              onChange={(e) => setDate2(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">나의 MBTI (선택)</label>
            <select
              value={mbti1}
              onChange={(e) => setMbti1(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">선택 안함</option>
              {MBTI_OPTIONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">상대방 MBTI (선택)</label>
            <select
              value={mbti2}
              onChange={(e) => setMbti2(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs focus:outline-none focus:border-primary transition-colors"
            >
              <option value="">선택 안함</option>
              {MBTI_OPTIONS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCalculate}
          disabled={loading || !date1 || !date2}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 active:scale-[0.98] transition-transform"
        >
          {loading ? "계산 중..." : "인연 점수 계산하기 ✨"}
        </button>
      </div>

      {result && (
        <div className="border-t border-primary/20 p-4 space-y-4">
          {/* Score reveal */}
          <div className="text-center">
            <div className="text-5xl font-black text-primary mb-1">{result.totalScore}</div>
            <div className="text-2xl mb-2">{result.emoji}</div>
            <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold">
              {result.level}
            </span>
          </div>

          {/* Breakdown bars */}
          <div className="space-y-2">
            {[
              { label: "MBTI", score: result.breakdown.mbtiScore, sub: result.breakdown.mbtiLabel },
              { label: "별자리", score: result.breakdown.zodiacScore, sub: result.breakdown.zodiacLabel },
              { label: "오행", score: result.breakdown.elementScore, sub: result.breakdown.elementLabel },
              { label: "컬러", score: result.breakdown.colorScore, sub: result.breakdown.colorLabel },
            ].map(({ label, score, sub }) => (
              <div key={label}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-xs font-semibold text-foreground">{score}점 · {sub}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Summary */}
          <p className="text-xs text-muted-foreground leading-relaxed text-center bg-muted/50 rounded-xl px-3 py-2">
            {result.summary}
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Matchmaker AI Tools ──────────────────────────────────────────────────────

function MatchmakerAiTools() {
  const tools = [
    { icon: "✍️", title: "소개 메시지 도우미", desc: "AI가 맞춤형 소개 문구를 생성해요" },
    { icon: "🎯", title: "소개 성공 예감 점수", desc: "두 사람의 궁합을 AI로 예측해요" },
    { icon: "📊", title: "주선 패턴 분석", desc: "나의 주선 성향을 분석해 드려요" },
  ];

  return (
    <div className="px-4">
      <div className="mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">주선자 전용</p>
        <p className="text-sm font-bold">AI 주선 도구</p>
      </div>
      <div className="space-y-2">
        {tools.map((tool) => (
          <div
            key={tool.title}
            className="rounded-2xl bg-card border border-border/60 p-4 flex items-center gap-3 opacity-70"
          >
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-xl">
              {tool.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{tool.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{tool.desc}</p>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">준비 중</span>
              <Lock className="w-3 h-3 text-muted-foreground" />
            </div>
          </div>
        ))}
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
  const [signalLoading, setSignalLoading] = useState(true);
  const [insights, setInsights] = useState<MyInsightsResponse>({ attachmentStyle: null, loveLanguage: null });
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [userBirthDate, setUserBirthDate] = useState<string | null>(null);
  const [isMatchmaker, setIsMatchmaker] = useState(false);
  const [attachmentQuizOpen, setAttachmentQuizOpen] = useState(false);
  const [loveLanguageQuizOpen, setLoveLanguageQuizOpen] = useState(false);
  const [savingInsight, setSavingInsight] = useState(false);

  useEffect(() => {
    // Load AI signal
    api.get<AiSignalResponse>("/api/v1/feed/ai-signal")
      .then(setSignal)
      .catch(() => {})
      .finally(() => setSignalLoading(false));

    // Load my AI insights
    api.get<MyInsightsResponse>("/api/v1/ai/my-insights")
      .then(setInsights)
      .catch(() => {});

    // Load profile
    api.get<ProfileResponse>("/api/v1/profile/me")
      .then((p) => {
        setProfile(p);
        if (p.accountType === "MATCHMAKER_ONLY") setIsMatchmaker(true);
      })
      .catch(() => {});

    // Load birth date from auth/me
    api.get<{ birthDate?: string; accountType?: string }>("/api/v1/auth/me")
      .then((u) => {
        if (u.birthDate) setUserBirthDate(u.birthDate);
        if (u.accountType === "MATCHMAKER_ONLY") setIsMatchmaker(true);
      })
      .catch(() => {});
  }, []);

  const handleAttachmentQuizComplete = async (result: string) => {
    setAttachmentQuizOpen(false);
    setSavingInsight(true);
    try {
      const saved = await api.post<{ attachmentStyle: string | null; loveLanguage: string | null }>(
        "/api/v1/ai/attachment-style",
        { result },
      );
      setInsights((prev) => ({ ...prev, attachmentStyle: saved.attachmentStyle }));
      toast.success("애착 유형 테스트 완료!");
    } catch {
      toast.error("저장에 실패했어요");
    } finally {
      setSavingInsight(false);
    }
  };

  const handleLoveLanguageQuizComplete = async (result: string) => {
    setLoveLanguageQuizOpen(false);
    setSavingInsight(true);
    try {
      const saved = await api.post<{ attachmentStyle: string | null; loveLanguage: string | null }>(
        "/api/v1/ai/love-language",
        { result },
      );
      setInsights((prev) => ({ ...prev, loveLanguage: saved.loveLanguage }));
      toast.success("러브 랭귀지 테스트 완료!");
    } catch {
      toast.error("저장에 실패했어요");
    } finally {
      setSavingInsight(false);
    }
  };

  const mbti = profile?.basicInfo?.mbti ?? null;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border/40">
        <div className="px-4 pt-safe-top pb-0">
          <div className="flex items-center gap-2 h-14">
            <div className="w-7 h-7 rounded-xl bg-brand-soft flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-base font-bold">AI 허브</h1>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto pt-4 space-y-6">
        {/* 오늘의 연애 운세 */}
        <FortuneBanner />

        {/* AI 시그널 */}
        {signalLoading ? (
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

        {/* 나를 알아가기 section */}
        <div className="px-4">
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-0.5">Self Discovery</p>
            <p className="text-sm font-bold">나를 알아가기</p>
          </div>

          {/* 2x2 grid */}
          <div className="grid grid-cols-2 gap-3">
            <MbtiCompatCard mbti={mbti} />
            <AttachmentStyleCard
              result={insights.attachmentStyle}
              onStartQuiz={() => setAttachmentQuizOpen(true)}
            />
            <LoveLanguageCard
              result={insights.loveLanguage}
              onStartQuiz={() => setLoveLanguageQuizOpen(true)}
            />
            <ZodiacCard birthDate={userBirthDate} />
          </div>
        </div>

        {/* 인연 점수 계산기 */}
        <CompatibilityCalculatorCard />

        {/* 주선자 AI 도구 (matchmaker only) */}
        {isMatchmaker && <MatchmakerAiTools />}

        {/* AI Guide */}
        <div className="px-4">
          <div className="rounded-2xl bg-card border border-border/60 p-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">팔레트 AI 가이드</p>
            {[
              { icon: "🎨", title: "컬러 타입", desc: "AI 인터뷰로 결정된 내 성격 색상이 매칭 기준이 돼요" },
              { icon: "✨", title: "AI 시그널", desc: "매일 1장 무료 — 컬러 유사도 기반 추천 프로필" },
              { icon: "🔮", title: "오늘의 운세", desc: "컬러 타입별 맞춤 연애 운세를 매일 확인해보세요" },
              { icon: "🧠", title: "나를 알아가기", desc: "애착 유형, 러브 랭귀지로 더 나은 연애를 시작해요" },
              { icon: "💑", title: "인연 점수", desc: "생년월일과 MBTI로 궁합을 AI가 분석해 드려요" },
            ].map((item) => (
              <div key={item.title} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-base">
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quizzes */}
      <QuizModal
        open={attachmentQuizOpen}
        onClose={() => setAttachmentQuizOpen(false)}
        title="애착 유형 테스트"
        questions={ATTACHMENT_QUESTIONS}
        onComplete={handleAttachmentQuizComplete}
      />
      <QuizModal
        open={loveLanguageQuizOpen}
        onClose={() => setLoveLanguageQuizOpen(false)}
        title="러브 랭귀지 테스트"
        questions={LOVE_LANGUAGE_QUESTIONS}
        onComplete={handleLoveLanguageQuizComplete}
      />

      {/* Saving overlay */}
      {savingInsight && (
        <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
          <div className="bg-card rounded-2xl px-6 py-4 flex items-center gap-3 shadow-lg">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
            <p className="text-sm font-medium">결과 저장 중...</p>
          </div>
        </div>
      )}
    </div>
  );
}
