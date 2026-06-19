import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, ChevronDown, Loader2, Plus, Video, X, Sparkles } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { toast } from "sonner";
import { PersonalityTestManager } from "./PersonalityTestManager";
import { JOB_CATEGORY_OPTIONS } from "../../lib/jobCategory";

interface ProfileEditScreenProps {
  onBack: () => void;
  onSave: () => void;
  userGender?: string; // "MALE" or "FEMALE"
}

interface ProfileData {
  id: string;
  userId: string;
  basicInfo: {
    height: number | null;
    bodyType: string | null;
    mbti: string;
  };
  careerInfo: {
    category: string | null;
    company: string | null;
    incomeRange: string | null;
  };
  educationInfo: {
    level: string | null;
    school: string | null;
    major: string | null;
  };
  locationInfo: {
    sido: string | null;
    sigungu: string | null;
    hometownSido: string | null;
    hometownSigungu: string | null;
  };
  lifestyleInfo: {
    smoking: string | null;
    drinking: string | null;
    religion: string | null;
  };
  introduction: {
    text: string | null;
    interests: string[];
    interviewAnswers?: {
      hobby: string | null;
      charm: string | null;
      passion: string | null;
      happiness: string | null;
      motto: string | null;
    } | null;
    datingStyle?: Record<string, string>; // questionKey -> optionKey
  };
  idealType: {
    datePreferences: string[];
    importantValues: string[];
    personalities: string[];
    appearanceStyles: string[];
    dealBreakers: string[];
    bucketList: string[]; // 시스템 키 or "custom:..." 최대 10개
    // DA-001 — 나이/키 범위. 가입 시 입력한 값을 편집 화면에서도 보존하기 위해 보유.
    // 편집 UI 는 추후 추가 (현재는 가입 시점 값을 유지·송신만)
    ageMin?: number | null;
    ageMax?: number | null;
    heightMin?: number | null;
    heightMax?: number | null;
  };
  personalityTests?: Array<{
    link: string;
    title: string;
  }>;
  colorType?: {
    type: string | null;
    name: string | null;
    hex: string | null;
    description: string | null;
  } | null;
  attachmentProfile?: {
    contactAnxiety: number;
    intimacyAvoidance: number;
    conflictStyle: number;
    emotionExpression: number;
    independenceLevel: number;
    attachmentType?: string;
    attachmentTypeLabel?: string;
    attachmentTypeDescription?: string;
    attachmentTypeEmoji?: string;
  } | null;
  photos: Array<{
    id: string;
    url: string;
    displayOrder: number;
    isPrimary: boolean;
    rejected?: boolean;
  }>;
  settings: {
    isAcceptingMatches: boolean;
    hiddenAt: string | null;
  };
}

// ─── 애착 유형 ───────────────────────────────────────────────

interface AttachmentSlider {
  key: "contactAnxiety" | "intimacyAvoidance" | "conflictStyle" | "emotionExpression" | "independenceLevel";
  title: string;
  leftLabel: string;
  rightLabel: string;
}

const ATTACHMENT_SLIDERS: AttachmentSlider[] = [
  { key: "contactAnxiety",    title: "연락 & 관계",  leftLabel: "연락 없어도 편해요",   rightLabel: "연락 없으면 불안해요" },
  { key: "intimacyAvoidance", title: "거리감",       leftLabel: "밀착이 좋아요",        rightLabel: "내 공간이 필요해요"  },
  { key: "conflictStyle",     title: "갈등 처리",    leftLabel: "바로 해결해요",        rightLabel: "시간이 필요해요"     },
  { key: "emotionExpression", title: "감정 표현",    leftLabel: "솔직하게 표현해요",    rightLabel: "속으로 삭이는 편"   },
  { key: "independenceLevel", title: "독립성",       leftLabel: "같이 있고 싶어요",     rightLabel: "각자의 시간도 중요해요" },
];

const ATTACHMENT_TYPE_INFO: Record<string, { label: string; description: string; emoji: string; color: string }> = {
  SECURE:       { label: "안정형", emoji: "🌿", color: "#22C55E", description: "신뢰를 바탕으로 편안하게 가까워질 수 있어요" },
  ANXIOUS:      { label: "불안형", emoji: "🌊", color: "#3B82F6", description: "상대방에게 확신을 많이 구하는 편이에요" },
  AVOIDANT:     { label: "회피형", emoji: "🦋", color: "#A855F7", description: "독립성을 중요하게 여기고 거리감이 필요해요" },
  DISORGANIZED: { label: "혼란형", emoji: "🌪️", color: "#F97316", description: "친밀함을 원하지만 동시에 두려움도 느껴요" },
};

function computeAttachmentTypeClient(contactAnxiety: number, intimacyAvoidance: number): string {
  if (contactAnxiety < 40 && intimacyAvoidance < 40) return "SECURE";
  if (contactAnxiety >= 60 && intimacyAvoidance < 40) return "ANXIOUS";
  if (contactAnxiety < 40 && intimacyAvoidance >= 60) return "AVOIDANT";
  return "DISORGANIZED";
}

// ─── 연애 스타일 Q&A ────────────────────────────────────────

interface DatingStyleQuestion {
  key: string;
  emoji: string;
  label: string;
  options: { key: string; label: string }[];
}

const DATING_STYLE_QUESTIONS: DatingStyleQuestion[] = [
  {
    key: "MEET_FREQUENCY",
    emoji: "📅",
    label: "만남 빈도",
    options: [
      { key: "WEEKLY_1_2",        label: "주 1~2회" },
      { key: "WEEKEND_TOGETHER",  label: "주말은 같이 보내요" },
      { key: "WHENEVER_POSSIBLE", label: "시간 될 때마다" },
    ],
  },
  {
    key: "CONTACT_STYLE",
    emoji: "💬",
    label: "연락 스타일",
    options: [
      { key: "FREQUENT",   label: "자주 연락해요" },
      { key: "DAILY_FEW",  label: "하루 몇 번이면 충분" },
      { key: "WHENEVER",   label: "생각날 때 연락" },
    ],
  },
  {
    key: "DATE_STYLE",
    emoji: "🗓️",
    label: "데이트 스타일",
    options: [
      { key: "OUTDOOR", label: "나들이·액티비티" },
      { key: "INDOOR",  label: "집·카페 인도어" },
      { key: "MIX",     label: "둘 다 좋아요" },
    ],
  },
  {
    key: "DRINKING_DATE",
    emoji: "🍻",
    label: "음주 스타일",
    options: [
      { key: "ENJOY",     label: "술자리 즐겨요" },
      { key: "SOMETIMES", label: "가끔 한 잔" },
      { key: "NO_NEED",   label: "없어도 충분해요" },
    ],
  },
  {
    key: "OPPOSITE_FRIENDS",
    emoji: "🙋",
    label: "이성 친구",
    options: [
      { key: "FREE",           label: "자유롭게 OK" },
      { key: "SOME_BOUNDARY",  label: "어느 정도 선은 있어요" },
      { key: "UNCOMFORTABLE",  label: "적극적 연락은 불편해요" },
    ],
  },
  {
    key: "LEAD_STYLE",
    emoji: "🎯",
    label: "리드 스타일",
    options: [
      { key: "LEAD",      label: "내가 리드하는 편" },
      { key: "FOLLOW",    label: "따라가는 편" },
      { key: "ALTERNATE", label: "번갈아가며" },
    ],
  },
  {
    key: "CONFLICT_STYLE",
    emoji: "🕊️",
    label: "갈등 해결",
    options: [
      { key: "TALK_NOW",  label: "바로 대화해요" },
      { key: "COOL_DOWN", label: "식히고 나서 얘기해요" },
      { key: "LET_GO",    label: "웬만하면 넘겨요" },
    ],
  },
  {
    key: "AFFECTION_STYLE",
    emoji: "💝",
    label: "애정 표현",
    options: [
      { key: "PHYSICAL", label: "스킨십으로" },
      { key: "WORDS",    label: "말·문자로" },
      { key: "ACTIONS",  label: "챙겨주는 것으로" },
    ],
  },
  {
    key: "MARRIAGE_PLAN",
    emoji: "💍",
    label: "결혼 계획",
    options: [
      { key: "SERIOUS_FAST",  label: "빠르게 진지하게" },
      { key: "SLOW_NATURAL",  label: "천천히 자연스럽게" },
      { key: "NOT_YET",       label: "아직 생각 중" },
    ],
  },
  {
    key: "SNS_PUBLIC",
    emoji: "📸",
    label: "SNS 공개",
    options: [
      { key: "LOVE_IT",        label: "커플 인증 좋아요" },
      { key: "PRIVATE",        label: "우리끼리만" },
      { key: "FOLLOW_PARTNER", label: "상대 따라갈게요" },
    ],
  },
];

// ─── 버킷리스트 풀 ────────────────────────────────────────────

interface BucketItem {
  key: string;
  label: string;
  emoji: string;
  category: string;
}

const BUCKET_POOL: BucketItem[] = [
  // 여행
  { key: "JEJU_MONTH",       label: "제주도 한 달 살기",     emoji: "🌴", category: "여행" },
  { key: "BACKPACKING",      label: "배낭여행",               emoji: "🎒", category: "여행" },
  { key: "OSAKA",            label: "오사카 2박 3일",         emoji: "🇯🇵", category: "여행" },
  { key: "BANGKOK",          label: "방콕 뚝뚝이",           emoji: "🛺", category: "여행" },
  { key: "SOLO_ABROAD",      label: "혼자 해외여행",          emoji: "✈️", category: "여행" },
  { key: "ROAD_TRIP",        label: "아무 계획 없는 드라이브", emoji: "🚗", category: "여행" },
  { key: "CAMPING",          label: "캠핑 & 불멍",            emoji: "🏕️", category: "여행" },
  { key: "DAYTRIP",          label: "주말 당일치기",          emoji: "🗺️", category: "여행" },
  // 새벽 감성
  { key: "CONVENIENCE_NIGHT", label: "새벽 편의점 치킨",     emoji: "🍗", category: "새벽감성" },
  { key: "HANGANG_RAMYEON",  label: "한강에서 라면",          emoji: "🍜", category: "새벽감성" },
  { key: "MIDNIGHT_MOVIE",   label: "새벽 영화관",            emoji: "🎬", category: "새벽감성" },
  { key: "ROOFTOP_BAR",      label: "루프탑 바",              emoji: "🌃", category: "새벽감성" },
  { key: "NIGHT_DRIVE",      label: "야경 드라이브",          emoji: "🌉", category: "새벽감성" },
  // 음식/술
  { key: "FOOD_TOUR",        label: "맛집 웨이팅 성공",       emoji: "🍽️", category: "음식" },
  { key: "NIGHT_MARKET",     label: "야시장 투어",            emoji: "🏮", category: "음식" },
  { key: "HOME_PARTY",       label: "홈파티 열기",            emoji: "🥂", category: "음식" },
  { key: "COOK_TOGETHER",    label: "함께 요리 도전",         emoji: "👨‍🍳", category: "음식" },
  // 문화/취미
  { key: "MUSICAL",          label: "뮤지컬 관람",            emoji: "🎭", category: "문화" },
  { key: "MUSEUM_DATE",      label: "미술관 데이트",          emoji: "🖼️", category: "문화" },
  { key: "FESTIVAL",         label: "음악 페스티벌",          emoji: "🎵", category: "문화" },
  { key: "HANOK_VILLAGE",    label: "한옥마을 투어",          emoji: "🏯", category: "문화" },
  // 도전
  { key: "BUNGEE",           label: "번지점프",               emoji: "🪂", category: "도전" },
  { key: "SURFING",          label: "서핑 배우기",            emoji: "🏄", category: "도전" },
  { key: "SKI",              label: "스키장",                 emoji: "⛷️", category: "도전" },
  { key: "HIKING",           label: "한라산 or 설악산",       emoji: "🏔️", category: "도전" },
  { key: "STARGAZING",       label: "별빛 텐트",              emoji: "⭐", category: "도전" },
];

// ─── 데이터 정의 ────────────────────────────────────────────

const mbtiTypes = [
  "ISTJ", "ISFJ", "INFJ", "INTJ",
  "ISTP", "ISFP", "INFP", "INTP",
  "ESTP", "ESFP", "ENFP", "ENTP",
  "ESTJ", "ESFJ", "ENFJ", "ENTJ"
];

const bodyTypeOptions = [
  { value: "SLIM", label: "슬림", emoji: "🩶" },
  { value: "AVERAGE", label: "보통", emoji: "😊" },
  { value: "ATHLETIC", label: "탄탄", emoji: "💪" },
  { value: "MUSCULAR", label: "건장", emoji: "🏋️" },
  { value: "CURVY", label: "통통", emoji: "🍑" },
];

// 직군 옵션 — SoT: lib/jobCategory.ts (ADR 0036). 22 카테고리, legacy PROFESSIONAL 숨김.
const careerCategories = JOB_CATEGORY_OPTIONS;

const educationLevels = [
  { value: "HIGH_SCHOOL", label: "고졸" },
  { value: "ASSOCIATE", label: "전문대" },
  { value: "BACHELOR", label: "대졸" },
  { value: "MASTER", label: "석사" },
  { value: "DOCTORATE", label: "박사" },
];

const smokingOptions = [
  { value: "NEVER", label: "비흡연" },
  { value: "SOMETIMES", label: "가끔" },
  { value: "OFTEN", label: "자주" },
];

const drinkingOptions = [
  { value: "NEVER", label: "안 마심" },
  { value: "SOMETIMES", label: "가끔" },
  { value: "OFTEN", label: "자주" },
];

const religionOptions = [
  { value: "NONE", label: "무교" },
  { value: "CHRISTIANITY", label: "기독교" },
  { value: "CATHOLICISM", label: "천주교" },
  { value: "BUDDHISM", label: "불교" },
  { value: "OTHER", label: "기타" },
];

// 통합 성격 어휘 (자기소개 인터뷰 칩 / 온보딩 옵션과 동일 — 매칭 정합성)
const personalityOptions = [
  { value: "다정한", emoji: "🥰" },
  { value: "유머있는", emoji: "😄" },
  { value: "차분한", emoji: "🌊" },
  { value: "열정적인", emoji: "🔥" },
  { value: "지적인", emoji: "📚" },
  { value: "섬세한", emoji: "🌸" },
  { value: "긍정적인", emoji: "☀️" },
  { value: "솔직한", emoji: "✨" },
  { value: "활발한", emoji: "⚡" },
  { value: "신중한", emoji: "🧭" },
  { value: "배려심많은", emoji: "💝" },
  { value: "자유로운", emoji: "🦋" },
];

// 라이프스타일·가치 핏 중심 (스펙 항목 제거 — 브랜드 정합성). value=한글(온보딩 옵션과 동일).
const importantValueOptions = [
  { value: "가치관", label: "가치관", emoji: "🌟" },
  { value: "성격·성향", label: "성격·성향", emoji: "💫" },
  { value: "라이프스타일 핏", label: "라이프스타일 핏", emoji: "🌿" },
  { value: "대화 코드", label: "대화 코드", emoji: "💬" },
  { value: "유머 코드", label: "유머 코드", emoji: "😆" },
  { value: "정서적 안정", label: "정서적 안정", emoji: "🫶" },
  { value: "취향·관심사", label: "취향·관심사", emoji: "🎨" },
  { value: "가족관", label: "가족관", emoji: "🏠" },
];

const datePreferenceOptions = [
  { value: "ACTIVE", label: "액티브", desc: "여행, 운동, 액티비티" },
  { value: "INDOOR", label: "인도어", desc: "집, 카페, 넷플릭스" },
  { value: "CULTURE", label: "문화생활", desc: "전시, 공연, 맛집" },
  { value: "NATURE", label: "자연속으로", desc: "산책, 드라이브, 피크닉" },
  { value: "NIGHT", label: "야경/술자리", desc: "바, 루프탑, 한강" },
  { value: "RELAXED", label: "여유롭게", desc: "브런치, 독서, 산책" },
];

// 남자가 선택 (여자 외모 스타일)
const femaleAppearanceStyles = [
  { value: "PUPPY", label: "강아지상", emoji: "🐶" },
  { value: "CAT", label: "고양이상", emoji: "🐱" },
  { value: "RABBIT", label: "토끼상", emoji: "🐰" },
  { value: "FOX", label: "여우상", emoji: "🦊" },
  { value: "DEER", label: "사슴상", emoji: "🦌" },
  { value: "TOFU", label: "두부상", emoji: "🍞" },
  { value: "SOFT_TOFU", label: "순두부상", emoji: "☁️" },
  { value: "ARAB", label: "아랍상", emoji: "🌙" },
  { value: "BOSS", label: "일진상", emoji: "😎" },
  { value: "MOTHER_IN_LAW_APPROVED", label: "상견례", emoji: "👰" },
];

// 여자가 선택 (남자 외모 스타일)
const maleAppearanceStyles = [
  { value: "PUPPY", label: "강아지상", emoji: "🐶" },
  { value: "CAT", label: "고양이상", emoji: "🐱" },
  { value: "STUDENT_COUNCIL", label: "전교회장상", emoji: "🏆" },
  { value: "ATHLETIC", label: "체대상", emoji: "🏋️" },
  { value: "NERD", label: "너드상", emoji: "🤓" },
  { value: "TOFU", label: "두부상", emoji: "🍞" },
  { value: "ARAB", label: "아랍상", emoji: "🌙" },
  { value: "DINOSAUR", label: "공룡상", emoji: "🦕" },
];

const dealBreakerOptions = [
  { value: "SMOKING", label: "흡연자", emoji: "🚬" },
  { value: "HEAVY_DRINKING", label: "과음", emoji: "🍺" },
  { value: "DISLIKES_PETS", label: "반려동물 기피", emoji: "🐾" },
  { value: "LONG_DISTANCE", label: "장거리", emoji: "✈️" },
  { value: "DIFFERENT_RELIGION", label: "종교 차이", emoji: "🙏" },
  { value: "NO_MARRIAGE_PLAN", label: "결혼 의사 없음", emoji: "💍" },
  { value: "CHILDREN_PLAN", label: "자녀계획 불일치", emoji: "👶" },
  { value: "UNSTABLE_JOB", label: "불안정한 직업", emoji: "💸" },
  { value: "CONTACTS_EX", label: "전 연인 연락", emoji: "📱" },
  { value: "LARGE_AGE_GAP", label: "큰 나이차", emoji: "🎂" },
];

// ─── 공통 칩 컴포넌트 ─────────────────────────────────────

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-xs font-medium transition-all ${
        selected
          ? "bg-brand-soft text-gold-strong border-brand/40 shadow-sm scale-[1.02]"
          : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ─── 섹션 래퍼 ──────────────────────────────────────────

function Section({
  emoji,
  title,
  subtitle,
  children,
  headerRight,
  completionText,
  defaultOpen = true,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  /** "완료 ✓" | "3/10" | "미작성" 등 — 접혔을 때 우측에 표시 */
  completionText?: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const isDone = !!completionText && !completionText.startsWith("미");

  return (
    <section className="bg-card border border-border rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="w-full px-6 py-4 border-b border-border flex items-center justify-between text-left"
      >
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm">{title}</h3>
          {subtitle && isOpen && (
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-2 ml-3 shrink-0">
          {/* 접혔을 때: 완료 배지 */}
          {!isOpen && completionText && (
            <span className={`text-xs px-2 py-px rounded-full font-medium ${
              isDone
                ? "bg-brand-soft text-primary"
                : "bg-muted text-muted-foreground"
            }`}>
              {completionText}
            </span>
          )}
          {/* 펼쳐졌을 때: headerRight (AI 버튼 등) */}
          {isOpen && headerRight}
          <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </div>
      </button>
      {isOpen && <div className="p-5 space-y-5">{children}</div>}
    </section>
  );
}

// ─── 서브섹션 레이블 ──────────────────────────────────────

function SubLabel({
  children,
  hint,
}: {
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-3">
      <p className="text-sm font-semibold text-foreground">{children}</p>
      {hint && <p className="text-xs text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

// ─── 메인 컴포넌트 ────────────────────────────────────────

export function ProfileEditScreen({ onBack, onSave, userGender }: ProfileEditScreenProps) {
  const appearanceStyleOptions = userGender === "MALE" ? femaleAppearanceStyles : maleAppearanceStyles;
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  // 사진: {id, url} 또는 null — id는 삭제 API 호출에 사용
  const [photos, setPhotos] = useState<({ id: string; url: string; rejected?: boolean } | null)[]>(Array(6).fill(null));
  const [video, setVideo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"about" | "ideal">("about");
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState<number | null>(null);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [newInterest, setNewInterest] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await api.get<ProfileData>('/api/v1/profile');
        setProfile(data);
        if (data.photos && data.photos.length > 0) {
          const photoSlots: ({ id: string; url: string; rejected?: boolean } | null)[] = Array(6).fill(null);
          data.photos
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .forEach((photo, index) => {
              if (index < 6) photoSlots[index] = { id: photo.id, url: photo.url, rejected: photo.rejected };
            });
          setPhotos(photoSlots);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
        toast.error('프로필을 불러오는데 실패했습니다');
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!profile) return;
    setIsSaving(true);
    try {
      await api.put('/api/v1/profile', {
        basicInfo: profile.basicInfo,
        careerInfo: profile.careerInfo,
        educationInfo: profile.educationInfo,
        locationInfo: profile.locationInfo,
        lifestyleInfo: profile.lifestyleInfo,
        introduction: profile.introduction,
        idealType: profile.idealType,
        personalityTests: profile.personalityTests || [],
        attachmentProfile: profile.attachmentProfile ?? null,
        // settings은 PATCH /api/v1/profile/settings 전용 엔드포인트로 관리
      });
      toast.success('프로필이 저장되었습니다');
      onSave();
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast.error('프로필 저장에 실패했습니다');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoClick = (index: number) => {
    setCurrentPhotoIndex(index);
    fileInputRef.current?.click();
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (!photos[index]) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const newPhotos = [...photos];
    const draggedPhoto = newPhotos[draggedIndex];
    newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);
    setPhotos(newPhotos);
    setDraggedIndex(null);
    updatePhotoOrder(newPhotos);
  };

  const updatePhotoOrder = async (newPhotos: ({ id: string; url: string } | null)[]) => {
    try {
      const photoUpdates = newPhotos
        .map((p, index) => p ? { id: p.id, displayOrder: index } : null)
        .filter(Boolean);
      await api.put('/api/v1/profile/photos/reorder', { photos: photoUpdates });
      toast.success('사진 순서가 변경되었습니다');
      const data = await api.get<ProfileData>('/api/v1/profile');
      setProfile(data);
    } catch (error) {
      console.error('Failed to update photo order:', error);
      toast.error('사진 순서 변경에 실패했습니다');
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || currentPhotoIndex === null) return;
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('파일 크기는 10MB 이하여야 합니다');
      return;
    }
    try {
      setIsUploading(true);
      const idx = currentPhotoIndex;

      // 기존 슬롯에 사진이 있으면 먼저 삭제
      const existing = photos[idx];
      if (existing) {
        try {
          await api.delete(`/api/v1/profile/photo/${existing.id}`);
        } catch {
          // 삭제 실패해도 업로드 계속
        }
      }

      const formData = new FormData();
      formData.append('file', file);
      const data = await api.postForm<{ photoId: string; photoUrl: string }>('/api/v1/profile/photo', formData);

      const newPhotos = [...photos];
      newPhotos[idx] = { id: data.photoId, url: data.photoUrl };
      setPhotos(newPhotos);
      toast.success('사진이 업로드됐어요');
    } catch (error: any) {
      console.error('Failed to upload photo:', error);
      toast.error('사진 업로드에 실패했습니다');
    } finally {
      setIsUploading(false);
      setCurrentPhotoIndex(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">프로필을 불러올 수 없습니다</p>
          <Button onClick={onBack} variant="outline">돌아가기</Button>
        </div>
      </div>
    );
  }

  // ── 완성도 계산 ──────────────────────────────────────────
  const photoCount     = photos.filter(Boolean).length;
  const lifestyleCount = [profile.lifestyleInfo.smoking, profile.lifestyleInfo.drinking, profile.lifestyleInfo.religion].filter(Boolean).length;
  const datingStyleCount = Object.keys(profile.introduction.datingStyle || {}).length;
  const bucketCount    = (profile.idealType.bucketList ?? []).length;
  const testCount      = (profile.personalityTests ?? []).length;
  const importantCount = (profile.idealType.importantValues ?? []).length;
  const personalityCount = (profile.idealType.personalities ?? []).length;
  const dealBreakerCount = (profile.idealType.dealBreakers ?? []).length;
  const interestCount  = (profile.introduction.interests ?? []).length;
  const introText      = profile.introduction.text ?? "";
  const hasAttachment  = profile.attachmentProfile != null;

  const ct = (n: number, max: number, unit = "") =>
    n > 0 ? `${n}${unit}/${max}` : "미작성";
  const done = (filled: boolean) => (filled ? "완료 ✓" : "미작성");

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* ── 헤더 ── */}
      <div className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="px-6 py-4">
          <div className="flex items-center justify-center relative">
            <button
              onClick={onBack}
              className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors"
              aria-label="뒤로 가기"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-lg font-semibold">프로필 수정</h2>
          </div>
        </div>
        <div className="px-6">
          <div className="flex gap-4">
            {(["about", "ideal"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-2 border-b-2 font-medium transition-colors ${
                  activeTab === tab
                    ? "border-brand/50 text-gold-strong"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "about" ? "내 소개" : "이상형"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-5 space-y-4">
        {/* ════ 내 소개 탭 ════ */}
        {activeTab === "about" && (
          <>
            {/* ── 프로필 사진 ── */}
            <Section
              emoji="📸"
              title="프로필 사진"
              subtitle="첫인상을 만드는 가장 중요한 요소예요"
              completionText={photoCount > 0 ? `${photoCount}장` : "미등록"}
              defaultOpen={photoCount === 0}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-foreground">
                    사진 ({photos.filter((p) => p !== null).length}/6)
                  </p>
                  <p className="text-xs text-muted-foreground">첫 번째 사진이 대표 사진이에요</p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <div className="grid grid-cols-3 gap-3">
                  {photos.map((photo, index) => (
                    <div
                      key={index}
                      draggable={!!photo}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                      onClick={() => handlePhotoClick(index)}
                      className={`relative aspect-square bg-muted rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                        index === 0
                          ? "border-brand/50 ring-2 ring-brand/20"
                          : photo
                          ? "border-border hover:border-primary/50"
                          : "border-dashed border-border hover:border-primary/50"
                      } ${isUploading && currentPhotoIndex === index ? "opacity-50" : ""} ${
                        draggedIndex === index ? "opacity-50" : ""
                      }`}
                    >
                      {photo ? (
                        <>
                          <img src={photo.url} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          {photo.rejected && (
                            <div className="absolute inset-0 ring-2 ring-red-500 rounded-xl pointer-events-none" />
                          )}
                          {index === 0 && (
                            <div className="absolute top-1.5 right-1.5 bg-brand-soft text-gold-strong rounded-full px-2 py-0.5 text-xs font-semibold">
                              대표
                            </div>
                          )}
                          {photo.rejected && (
                            <div className="absolute bottom-1 left-1 right-1 bg-red-600 text-white rounded-md px-1 py-0.5 text-[10px] text-center font-medium">
                              재촬영 필요
                            </div>
                          )}
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const target = photos[index];
                              if (!target) return;
                              try {
                                await api.delete(`/api/v1/profile/photo/${target.id}`);
                              } catch {
                                toast.error('사진 삭제에 실패했습니다');
                                return;
                              }
                              const newPhotos = [...photos];
                              newPhotos[index] = null;
                              setPhotos(newPhotos);
                            }}
                            className="absolute top-1.5 left-1.5 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                          {isUploading && currentPhotoIndex === index ? (
                            <Loader2 className="w-5 h-5 text-muted-foreground animate-spin" />
                          ) : (
                            <>
                              <Plus className="w-5 h-5 text-muted-foreground" />
                              {index === 0 && (
                                <span className="text-xs text-muted-foreground">대표사진</span>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 동영상 */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-foreground">동영상 <span className="text-muted-foreground font-normal">(선택)</span></p>
                </div>
                <div
                  className={`relative aspect-video rounded-xl border-2 overflow-hidden cursor-pointer transition-all ${
                    video ? "border-primary bg-brand-soft" : "border-dashed border-border hover:border-primary/50 bg-muted"
                  }`}
                >
                  {video ? (
                    <>
                      <video src={video} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setVideo(null)}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1.5 hover:bg-black/80"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                      <Video className="w-7 h-7 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">동영상 추가 (5~30초)</p>
                    </div>
                  )}
                </div>
              </div>
            </Section>

            {/* ── 기본 정보 ── */}
            <Section emoji="✏️" title="기본 정보"
              completionText={done(!!(profile.basicInfo.height || profile.basicInfo.bodyType))}
              defaultOpen={!(profile.basicInfo.height || profile.basicInfo.bodyType)}
            >
              {/* 키 */}
              <div>
                <SubLabel>키</SubLabel>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl font-bold text-primary">
                    {profile.basicInfo.height || 170}
                  </span>
                  <span className="text-muted-foreground">cm</span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="220"
                  value={profile.basicInfo.height || 170}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      basicInfo: { ...profile.basicInfo, height: parseInt(e.target.value) },
                    })
                  }
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>140cm</span>
                  <span>220cm</span>
                </div>
              </div>

              {/* 체형 */}
              <div>
                <SubLabel>체형</SubLabel>
                <div className="flex flex-wrap gap-2">
                  {bodyTypeOptions.map((type) => (
                    <Chip
                      key={type.value}
                      selected={profile.basicInfo.bodyType === type.value}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          basicInfo: { ...profile.basicInfo, bodyType: type.value },
                        })
                      }
                    >
                      {type.label}
                    </Chip>
                  ))}
                </div>
              </div>

              {/* MBTI */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <SubLabel>MBTI</SubLabel>
                  <span className="text-lg font-bold text-primary">{profile.basicInfo.mbti}</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { pairs: ["E", "I"], label: "외향/내향", idx: 0 },
                    { pairs: ["S", "N"], label: "감각/직관", idx: 1 },
                    { pairs: ["T", "F"], label: "사고/감정", idx: 2 },
                    { pairs: ["P", "J"], label: "인식/판단", idx: 3 },
                  ].map(({ pairs, label, idx }) => (
                    <div key={label} className="space-y-1.5">
                      <p className="text-xs text-center text-muted-foreground">{label}</p>
                      <div className="flex flex-col gap-1">
                        {pairs.map((type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              const mbti = profile.basicInfo.mbti;
                              const newMbti =
                                mbti.substring(0, idx) + type + mbti.substring(idx + 1);
                              setProfile({
                                ...profile,
                                basicInfo: { ...profile.basicInfo, mbti: newMbti },
                              });
                            }}
                            className={`py-1.5 rounded-lg text-sm font-medium transition-all border ${
                              profile.basicInfo.mbti[idx] === type
                                ? "bg-brand-soft text-gold-strong border-brand/40"
                                : "bg-card border-border text-muted-foreground hover:border-primary/50"
                            }`}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>

            {/* ── 직업 정보 ── */}
            <Section emoji="💼" title="직업 정보"
              completionText={done(!!profile.careerInfo.category)}
              defaultOpen={!profile.careerInfo.category}
            >
              <div>
                <SubLabel>직업 분야</SubLabel>
                <div className="flex flex-wrap gap-2">
                  {careerCategories.map((cat) => (
                    <Chip
                      key={cat.value}
                      selected={profile.careerInfo.category === cat.value}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          careerInfo: { ...profile.careerInfo, category: cat.value },
                        })
                      }
                    >
                      {cat.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="company" className="block mb-2 text-sm font-semibold">직장명</Label>
                <Input
                  id="company"
                  value={profile.careerInfo.company || ""}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      careerInfo: { ...profile.careerInfo, company: e.target.value || null },
                    })
                  }
                  placeholder="직장명을 입력하세요 (선택)"
                />
              </div>

              <div>
                <Label className="block mb-2 text-sm font-semibold">소득 인증 <span className="text-muted-foreground font-normal">(선택)</span></Label>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed hover:border-primary/50 hover:bg-muted"
                  onClick={() => toast.info('홈택스 연동 기능은 준비 중입니다')}
                >
                  {profile.careerInfo.incomeRange ? '소득인증 완료' : '소득인증하기'}
                </Button>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                  홈택스 연동 인증 시 고소득 뱃지가 표시돼요. (연소득 7,500만원 이상)
                </p>
              </div>
            </Section>

            {/* ── 학력 ── */}
            <Section emoji="🎓" title="학력"
              completionText={done(!!profile.educationInfo.level)}
              defaultOpen={!profile.educationInfo.level}
            >
              <div>
                <SubLabel>최종 학력</SubLabel>
                <div className="flex flex-wrap gap-2">
                  {educationLevels.map((lvl) => (
                    <Chip
                      key={lvl.value}
                      selected={profile.educationInfo.level === lvl.value}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          educationInfo: { ...profile.educationInfo, level: lvl.value },
                        })
                      }
                    >
                      {lvl.label}
                    </Chip>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="school" className="block mb-2 text-sm font-semibold">학교명</Label>
                  <Input
                    id="school"
                    value={profile.educationInfo.school || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        educationInfo: { ...profile.educationInfo, school: e.target.value || null },
                      })
                    }
                    placeholder="학교명"
                  />
                </div>
                <div>
                  <Label htmlFor="major" className="block mb-2 text-sm font-semibold">전공</Label>
                  <Input
                    id="major"
                    value={profile.educationInfo.major || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        educationInfo: { ...profile.educationInfo, major: e.target.value || null },
                      })
                    }
                    placeholder="전공"
                  />
                </div>
              </div>
            </Section>

            {/* ── 지역 ── */}
            <Section emoji="📍" title="거주 지역"
              completionText={profile.locationInfo.sido ?? "미입력"}
              defaultOpen={!profile.locationInfo.sido}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="sido" className="block mb-2 text-sm font-semibold">시/도</Label>
                  <select
                    id="sido"
                    value={profile.locationInfo.sido || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        locationInfo: { ...profile.locationInfo, sido: e.target.value || null },
                      })
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">선택</option>
                    {["서울", "경기", "인천", "부산", "대구", "광주", "대전", "울산", "세종", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"].map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label htmlFor="sigungu" className="block mb-2 text-sm font-semibold">시/군/구</Label>
                  <Input
                    id="sigungu"
                    value={profile.locationInfo.sigungu || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        locationInfo: { ...profile.locationInfo, sigungu: e.target.value || null },
                      })
                    }
                    placeholder="예: 강남구"
                  />
                </div>

                {/* DA-004 — 고향 (선택). 백엔드는 받을 준비 OK, UI만 없던 갭 해소 */}
                <div className="col-span-2 pt-2 border-t border-border/40">
                  <Label className="block mb-2 text-sm font-semibold">고향 <span className="text-muted-foreground font-normal">(선택)</span></Label>
                  <p className="text-[11px] text-muted-foreground mb-2">대화 소재 · 같은 고향 추천에 활용돼요</p>
                </div>
                <div>
                  <Input
                    value={profile.locationInfo.hometownSido || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        locationInfo: { ...profile.locationInfo, hometownSido: e.target.value || null },
                      })
                    }
                    placeholder="고향 시/도"
                  />
                </div>
                <div>
                  <Input
                    value={profile.locationInfo.hometownSigungu || ""}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        locationInfo: { ...profile.locationInfo, hometownSigungu: e.target.value || null },
                      })
                    }
                    placeholder="고향 시/군/구"
                  />
                </div>
              </div>
            </Section>

            {/* ── 라이프스타일 ── */}
            <Section emoji="🌱" title="라이프스타일"
              completionText={lifestyleCount > 0 ? `${lifestyleCount}/3` : "미작성"}
              defaultOpen={lifestyleCount < 2}
            >
              {/* DA-006 — 가입 시 입력한 값 있으면 안내 (수정 시 혼란 줄임) */}
              {lifestyleCount > 0 && (
                <p className="text-[11px] text-muted-foreground mb-3 px-1">
                  가입 시 입력하신 정보예요. 수정 가능합니다.
                </p>
              )}
              <div>
                <SubLabel>흡연</SubLabel>
                <div className="flex flex-wrap gap-2">
                  {smokingOptions.map((opt) => (
                    <Chip
                      key={opt.value}
                      selected={profile.lifestyleInfo.smoking === opt.value}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          lifestyleInfo: { ...profile.lifestyleInfo, smoking: opt.value },
                        })
                      }
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <SubLabel>음주</SubLabel>
                <div className="flex flex-wrap gap-2">
                  {drinkingOptions.map((opt) => (
                    <Chip
                      key={opt.value}
                      selected={profile.lifestyleInfo.drinking === opt.value}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          lifestyleInfo: { ...profile.lifestyleInfo, drinking: opt.value },
                        })
                      }
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </div>
              <div>
                <SubLabel>종교</SubLabel>
                <div className="flex flex-wrap gap-2">
                  {religionOptions.map((opt) => (
                    <Chip
                      key={opt.value}
                      selected={profile.lifestyleInfo.religion === opt.value}
                      onClick={() =>
                        setProfile({
                          ...profile,
                          lifestyleInfo: { ...profile.lifestyleInfo, religion: opt.value },
                        })
                      }
                    >
                      {opt.label}
                    </Chip>
                  ))}
                </div>
              </div>
            </Section>

            {/* ── 소개글 ── */}
            <Section
              emoji="💬"
              title="소개글"
              subtitle="AI가 작성했거나 직접 수정할 수 있어요"
              completionText={introText.length >= 30 ? "완료 ✓" : "미작성"}
              defaultOpen={introText.length < 30}
              headerRight={
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isGeneratingAI}
                  onClick={async () => {
                    const datingStyle = profile.introduction.datingStyle || {};
                    const hasDatingStyle = Object.keys(datingStyle).length >= 3;
                    const hasInterview = !!profile.introduction.interviewAnswers;
                    if (!hasDatingStyle && !hasInterview) {
                      toast.info('연애 스타일(이상형 탭)을 먼저 3개 이상 골라주세요');
                      return;
                    }
                    setIsGeneratingAI(true);
                    try {
                      const payload = hasDatingStyle
                        ? { introMethod: 'DATING_STYLE', datingStyle }
                        : { introMethod: 'MANUAL', manualAnswers: profile.introduction.interviewAnswers };
                      const data = await api.post<{
                        generatedIntroduction: string;
                        colorType: string;
                        colorName: string;
                        colorHex: string;
                        colorDescription: string;
                      }>('/api/v1/ai-profile/generate', payload);
                      setProfile((prev) =>
                        prev ? {
                          ...prev,
                          introduction: { ...prev.introduction, text: data.generatedIntroduction },
                          colorType: {
                            type: data.colorType,
                            name: data.colorName,
                            hex: data.colorHex,
                            description: data.colorDescription,
                          },
                        } : prev
                      );
                      toast.success(`소개글 완성 · 색깔 타입 ${data.colorName}`);
                    } catch {
                      toast.error('AI 생성에 실패했어요');
                    } finally {
                      setIsGeneratingAI(false);
                    }
                  }}
                  className="gap-1.5 shrink-0"
                >
                  {isGeneratingAI ? (
                    <><Loader2 className="w-3.5 h-3.5 animate-spin" /> 생성 중</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> AI 다듬기</>
                  )}
                </Button>
              }
            >
              <div>
                <textarea
                  value={introText}
                  onChange={(e) =>
                    setProfile({
                      ...profile,
                      introduction: { ...profile.introduction, text: e.target.value || null },
                    })
                  }
                  placeholder="나를 표현하는 소개글을 써보거나, AI 다듬기로 자동 생성해보세요 (150~300자 권장)"
                  maxLength={500}
                  rows={6}
                  className="w-full px-3.5 py-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring leading-relaxed placeholder:text-muted-foreground"
                />
                <p className={`text-xs mt-1.5 text-right ${introText.length > 300 ? "text-amber-500" : "text-muted-foreground"}`}>
                  {introText.length}/500자
                </p>
              </div>
            </Section>

            {/* ── 심리 프로필 ── */}
            {(() => {
              const ap = profile.attachmentProfile;
              const anxiety = ap?.contactAnxiety ?? 50;
              const avoidance = ap?.intimacyAvoidance ?? 50;
              const typeKey = ap ? computeAttachmentTypeClient(anxiety, avoidance) : null;
              const typeInfo = typeKey ? ATTACHMENT_TYPE_INFO[typeKey] : null;
              return (
                <Section
                  emoji="🧬"
                  title="심리 프로필"
                  subtitle="연애에서 나는 어떤 유형인지 슬라이더로 표현해보세요"
                  completionText={hasAttachment ? "완료 ✓" : "미작성"}
                  defaultOpen={!hasAttachment}
                >
                  <div className="space-y-6">
                    {ATTACHMENT_SLIDERS.map((slider) => {
                      const value = ap?.[slider.key] ?? 50;
                      return (
                        <div key={slider.key}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-muted-foreground leading-tight max-w-[38%]">{slider.leftLabel}</span>
                            <span className="text-xs font-semibold text-foreground">{slider.title}</span>
                            <span className="text-xs text-muted-foreground leading-tight max-w-[38%] text-right">{slider.rightLabel}</span>
                          </div>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={value}
                            onChange={(e) => {
                              const newVal = Number(e.target.value);
                              const newAp = {
                                contactAnxiety: ap?.contactAnxiety ?? 50,
                                intimacyAvoidance: ap?.intimacyAvoidance ?? 50,
                                conflictStyle: ap?.conflictStyle ?? 50,
                                emotionExpression: ap?.emotionExpression ?? 50,
                                independenceLevel: ap?.independenceLevel ?? 50,
                                [slider.key]: newVal,
                              };
                              setProfile({ ...profile, attachmentProfile: newAp });
                            }}
                            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                        </div>
                      );
                    })}
                  </div>

                  {/* 유형 결과 */}
                  {typeInfo && (
                    <div
                      className="rounded-xl p-4 border"
                      style={{ backgroundColor: `${typeInfo.color}15`, borderColor: `${typeInfo.color}40` }}
                    >
                      <p className="text-sm font-semibold mb-1" style={{ color: typeInfo.color }}>
                        {typeInfo.label}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">{typeInfo.description}</p>
                      <p className="text-xs text-muted-foreground mt-2 opacity-70">
                        슬라이더를 조정하면 유형이 바뀌어요
                      </p>
                    </div>
                  )}
                </Section>
              );
            })()}

            {/* ── 관심사 ── */}
            <Section
              emoji="🎯"
              title="관심사"
              subtitle="최대 10개"
              completionText={interestCount > 0 ? `${interestCount}개` : "미작성"}
              defaultOpen={interestCount === 0}
            >
              {/* 선택된 관심사 칩 */}
              {(profile.introduction.interests ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(profile.introduction.interests ?? []).map((interest) => (
                    <span
                      key={interest}
                      className="inline-flex items-center gap-1 pl-3 pr-2 py-1 rounded-full border border-border bg-brand-soft text-primary text-xs font-medium"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() =>
                          setProfile({
                            ...profile,
                            introduction: {
                              ...profile.introduction,
                              interests: (profile.introduction.interests ?? []).filter((i) => i !== interest),
                            },
                          })
                        }
                        className="text-primary/60 hover:text-primary transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* 직접 입력 */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">
                  관심사를 입력하고 Enter 또는 추가 버튼을 눌러요
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newInterest}
                    onChange={(e) => setNewInterest(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const trimmed = newInterest.trim();
                        if (!trimmed) return;
                        const current = profile.introduction.interests ?? [];
                        if (current.length >= 10) { toast.info('최대 10개까지 추가할 수 있어요'); return; }
                        if (current.includes(trimmed)) { toast.info('이미 있는 관심사예요'); return; }
                        setProfile({ ...profile, introduction: { ...profile.introduction, interests: [...current, trimmed] } });
                        setNewInterest("");
                      }
                    }}
                    placeholder="예) 맛집탐방, 영화, 여행..."
                    maxLength={15}
                    className="flex-1 h-10 px-3.5 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const trimmed = newInterest.trim();
                      if (!trimmed) return;
                      const current = profile.introduction.interests ?? [];
                      if (current.length >= 10) { toast.info('최대 10개까지 추가할 수 있어요'); return; }
                      if (current.includes(trimmed)) { toast.info('이미 있는 관심사예요'); return; }
                      setProfile({ ...profile, introduction: { ...profile.introduction, interests: [...current, trimmed] } });
                      setNewInterest("");
                    }}
                    disabled={!newInterest.trim()}
                    className="h-10 px-3.5"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {(profile.introduction.interests ?? []).length}/10개
                </p>
              </div>
            </Section>

            {/* ── 성격 테스트 ── */}
            <PersonalityTestManager
              tests={profile.personalityTests || []}
              onChange={(tests) => setProfile({ ...profile, personalityTests: tests })}
            />
          </>
        )}

        {/* ════ 이상형 탭 ════ */}
        {activeTab === "ideal" && (
          <>
            {/* ── 연애 스타일 ── */}
            <Section
              emoji="💘"
              title="연애 스타일"
              subtitle="원하는 관계 방식을 골라봐요"
              completionText={datingStyleCount > 0 ? `${datingStyleCount}/10` : "미작성"}
              defaultOpen={datingStyleCount < 5}
            >
              <div className="space-y-5">
                {DATING_STYLE_QUESTIONS.map((q) => {
                  const selected = profile.introduction.datingStyle?.[q.key];
                  return (
                    <div key={q.key}>
                      <p className="text-sm font-semibold text-foreground mb-2.5">
                        {q.label}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {q.options.map((opt) => (
                          <Chip
                            key={opt.key}
                            selected={selected === opt.key}
                            onClick={() => {
                              const newStyle = { ...(profile.introduction.datingStyle || {}) };
                              if (selected === opt.key) {
                                delete newStyle[q.key];
                              } else {
                                newStyle[q.key] = opt.key;
                              }
                              setProfile({
                                ...profile,
                                introduction: { ...profile.introduction, datingStyle: newStyle },
                              });
                            }}
                          >
                            {opt.label}
                          </Chip>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                {Object.keys(profile.introduction.datingStyle || {}).length}/{DATING_STYLE_QUESTIONS.length}개 선택됨 · 소개글 탭의 AI 다듬기에서 소개글 자동 생성에 활용돼요
              </p>
            </Section>

            {/* ── 버킷리스트 ── */}
            <BucketListSection
              selected={profile.idealType.bucketList ?? []}
              onChange={(list) =>
                setProfile({
                  ...profile,
                  idealType: { ...profile.idealType, bucketList: list },
                })
              }
            />

            {/* ── 중요하게 보는 것 ── */}
            <Section
              emoji="🔑"
              title="중요하게 보는 것"
              subtitle="최대 3개"
              completionText={ct(importantCount, 3)}
              defaultOpen={importantCount === 0}
            >
              <div className="flex flex-wrap gap-2">
                {importantValueOptions.map(({ value, label, emoji }) => {
                  const isSelected = (profile.idealType.importantValues ?? []).includes(value);
                  return (
                    <Chip
                      key={value}
                      selected={isSelected}
                      onClick={() => {
                        const current = profile.idealType.importantValues ?? [];
                        let newValues;
                        if (isSelected) {
                          newValues = current.filter((v) => v !== value);
                        } else if (current.length < 3) {
                          newValues = [...current, value];
                        } else {
                          toast.info('최대 3개까지 선택할 수 있어요');
                          return;
                        }
                        setProfile({
                          ...profile,
                          idealType: { ...profile.idealType, importantValues: newValues },
                        });
                      }}
                    >
                      {label}
                    </Chip>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                선택: {(profile.idealType.importantValues ?? []).length}/3
              </p>
            </Section>

            {/* ── 선호 성격 ── */}
            <Section
              emoji="✨"
              title="선호하는 성격"
              subtitle="최대 5개"
              completionText={ct(personalityCount, 5)}
              defaultOpen={personalityCount === 0}
            >
              <div className="flex flex-wrap gap-2">
                {personalityOptions.map(({ value, emoji }) => {
                  const isSelected = (profile.idealType.personalities ?? []).includes(value);
                  return (
                    <Chip
                      key={value}
                      selected={isSelected}
                      onClick={() => {
                        const current = profile.idealType.personalities ?? [];
                        let newPersonalities;
                        if (isSelected) {
                          newPersonalities = current.filter((p) => p !== value);
                        } else if (current.length < 5) {
                          newPersonalities = [...current, value];
                        } else {
                          toast.info('최대 5개까지 선택할 수 있어요');
                          return;
                        }
                        setProfile({
                          ...profile,
                          idealType: { ...profile.idealType, personalities: newPersonalities },
                        });
                      }}
                    >
                      {value}
                    </Chip>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                선택: {(profile.idealType.personalities ?? []).length}/5
              </p>
            </Section>

            {/* ── 외모 스타일 ── */}
            <Section emoji="👀" title="끌리는 외모 스타일" subtitle="하나만 선택"
              completionText={done((profile.idealType.appearanceStyles ?? []).length > 0)}
              defaultOpen={(profile.idealType.appearanceStyles ?? []).length === 0}
            >
              <div className="flex flex-wrap gap-2">
                {appearanceStyleOptions.map(({ value, label, emoji }) => {
                  const isSelected = (profile.idealType.appearanceStyles ?? []).includes(value);
                  return (
                    <Chip
                      key={value}
                      selected={isSelected}
                      onClick={() => {
                        const newStyles = isSelected ? [] : [value];
                        setProfile({
                          ...profile,
                          idealType: { ...profile.idealType, appearanceStyles: newStyles },
                        });
                      }}
                    >
                      {label}
                    </Chip>
                  );
                })}
              </div>
            </Section>

            {/* ── 딜브레이커 ── */}
            <Section
              emoji="🚫"
              title="절대 안 되는 것"
              subtitle="최대 3개 — 정말 중요한 것만 골라요"
              completionText={ct(dealBreakerCount, 3)}
              defaultOpen={dealBreakerCount === 0}
            >
              <div className="flex flex-wrap gap-2">
                {dealBreakerOptions.map(({ value, label, emoji }) => {
                  const isSelected = (profile.idealType.dealBreakers ?? []).includes(value);
                  return (
                    <Chip
                      key={value}
                      selected={isSelected}
                      onClick={() => {
                        const current = profile.idealType.dealBreakers ?? [];
                        let newDealBreakers;
                        if (isSelected) {
                          newDealBreakers = current.filter((d) => d !== value);
                        } else if (current.length < 3) {
                          newDealBreakers = [...current, value];
                        } else {
                          toast.info('최대 3개까지 선택할 수 있어요');
                          return;
                        }
                        setProfile({
                          ...profile,
                          idealType: { ...profile.idealType, dealBreakers: newDealBreakers },
                        });
                      }}
                    >
                      {label}
                    </Chip>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                선택: {(profile.idealType.dealBreakers ?? []).length}/3
              </p>
            </Section>
          </>
        )}

        {/* ── 저장 버튼 ── */}
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full h-12"
            size="lg"
          >
            {isSaving ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 저장 중...</>
            ) : (
              "저장하기"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── 버킷리스트 섹션 컴포넌트 ──────────────────────────────────

function BucketListSection({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (list: string[]) => void;
}) {
  const [customInput, setCustomInput] = useState("");
  const [customItems, setCustomItems] = useState<BucketItem[]>([]);

  const MAX = 10;
  const allItems = [...BUCKET_POOL, ...customItems];
  const categories = ["여행", "새벽감성", "음식", "문화", "도전"];

  const toggle = (key: string) => {
    if (selected.includes(key)) {
      onChange(selected.filter((k) => k !== key));
    } else if (selected.length < MAX) {
      onChange([...selected, key]);
    } else {
      toast.info(`최대 ${MAX}개까지 선택할 수 있어요`);
    }
  };

  const addCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (trimmed.length > 20) {
      toast.info("20자 이내로 입력해주세요");
      return;
    }
    const key = `custom:${trimmed}`;
    if (allItems.some((i) => i.key === key)) {
      toast.info("이미 있는 항목이에요");
      return;
    }
    const newItem: BucketItem = {
      key,
      label: trimmed,
      emoji: "✍️",
      category: "직접입력",
    };
    setCustomItems((prev) => [...prev, newItem]);
    setCustomInput("");
    // 추가하면서 바로 선택
    if (selected.length < MAX) {
      onChange([...selected, key]);
    }
  };

  return (
    <Section
      emoji="🪣"
      title="버킷리스트"
      subtitle={`같이 하고 싶은 것들 (${selected.length}/${MAX})`}
      completionText={selected.length > 0 ? `${selected.length}개` : "미작성"}
      defaultOpen={selected.length < 3}
    >
      {/* 카테고리별 항목 */}
      <div className="space-y-4">
        {categories.map((cat) => {
          const items = allItems.filter((i) => i.category === cat);
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                {cat}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((item) => (
                  <Chip
                    key={item.key}
                    selected={selected.includes(item.key)}
                    onClick={() => toggle(item.key)}
                  >
                    {item.label}
                  </Chip>
                ))}
              </div>
            </div>
          );
        })}

        {/* 직접 입력한 것들 */}
        {customItems.filter((i) => i.category === "직접입력").length > 0 && (
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              직접 추가
            </p>
            <div className="flex flex-wrap gap-2">
              {customItems
                .filter((i) => i.category === "직접입력")
                .map((item) => (
                  <Chip
                    key={item.key}
                    selected={selected.includes(item.key)}
                    onClick={() => toggle(item.key)}
                  >
                    {item.label}
                  </Chip>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 직접 입력 */}
      <div className="pt-2 border-t border-border">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          원하는 게 없으면 직접 추가해요
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="예) 새벽 한강 자전거..."
            maxLength={20}
            className="flex-1 h-9 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addCustom}
            disabled={!customInput.trim()}
            className="h-9 px-3"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          직접 추가한 항목은 상대방에게 그대로 보여요 — 개성 있게 써보세요
        </p>
      </div>
    </Section>
  );
}
