import { useState, useEffect, useCallback, lazy, Suspense } from "react";
// ── 초기 진입 경로만 eager (첫 페인트 깜빡임 방지) ──
import { BetaGateScreen, hasBetaPassed } from "./components/BetaGateScreen";
import { BetaWelcomeIntro, hasIntroSeen } from "./components/BetaWelcomeIntro";
import { LoginScreen } from "./components/LoginScreen";
import { OAuth2RedirectHandler } from "./components/OAuth2RedirectHandler";
import type { MutualFriend } from "./components/MainFeedScreen";
// MatchmakerInfoScreen 은 ADR 0013 에서 제거됨 — 회원가입 데이터로 충분

// ── 나머지 화면은 route-level code splitting (lazy) — 첫 bundle 크기 ↓ (ADR 0019) ──
// named export → default 로 래핑
const EmailLoginScreen = lazy(() => import("./components/EmailLoginScreen").then(m => ({ default: m.EmailLoginScreen })));
const EmailSignupScreen = lazy(() => import("./components/EmailSignupScreen").then(m => ({ default: m.EmailSignupScreen })));
const MatchmakerSignupScreen = lazy(() => import("./components/MatchmakerSignupScreen").then(m => ({ default: m.MatchmakerSignupScreen })));
const RequiredInfoScreen = lazy(() => import("./components/RequiredInfoScreen").then(m => ({ default: m.RequiredInfoScreen })));
const AccountTypeSelectionScreen = lazy(() => import("./components/AccountTypeSelectionScreen").then(m => ({ default: m.AccountTypeSelectionScreen })));
const BasicInfoScreen = lazy(() => import("./components/BasicInfoScreen").then(m => ({ default: m.BasicInfoScreen })));
const PhotoUploadScreen = lazy(() => import("./components/PhotoUploadScreen").then(m => ({ default: m.PhotoUploadScreen })));
const IdealTypeScreen = lazy(() => import("./components/IdealTypeScreen").then(m => ({ default: m.IdealTypeScreen })));
const AIProfileEnhanceScreen = lazy(() => import("./components/AIProfileEnhanceScreen").then(m => ({ default: m.AIProfileEnhanceScreen })));
const AIInterviewScreen = lazy(() => import("./components/AIInterviewScreen").then(m => ({ default: m.AIInterviewScreen })));
const LifestyleScreen = lazy(() => import("./components/LifestyleScreen").then(m => ({ default: m.LifestyleScreen })));
const MyProfileScreen = lazy(() => import("./components/MyProfileScreen").then(m => ({ default: m.MyProfileScreen })));
const ProfileEditScreen = lazy(() => import("./components/ProfileEditScreen").then(m => ({ default: m.ProfileEditScreen })));
const ProfileDetailScreen = lazy(() => import("./components/ProfileDetailScreen").then(m => ({ default: m.ProfileDetailScreen })));
const MainFeedScreen = lazy(() => import("./components/MainFeedScreen").then(m => ({ default: m.MainFeedScreen })));
const IntroductionHistoryScreen = lazy(() => import("./components/IntroductionHistoryScreen").then(m => ({ default: m.IntroductionHistoryScreen })));
const ConnectorDashboard = lazy(() => import("./components/ConnectorDashboard").then(m => ({ default: m.ConnectorDashboard })));
const MatchmakerMarketplaceScreen = lazy(() => import("./components/MatchmakerMarketplaceScreen").then(m => ({ default: m.MatchmakerMarketplaceScreen })));
const MatchmakerPublicProfileScreen = lazy(() => import("./components/MatchmakerPublicProfileScreen").then(m => ({ default: m.MatchmakerPublicProfileScreen })));
const DesignSystemScreen = lazy(() => import("./components/DesignSystemScreen").then(m => ({ default: m.DesignSystemScreen })));
const MyPageScreen = lazy(() => import("./components/MyPageScreen").then(m => ({ default: m.MyPageScreen })));
const ColorDetailScreen = lazy(() => import("./components/ColorDetailScreen").then(m => ({ default: m.ColorDetailScreen })));
const PrivacyPolicyScreen = lazy(() => import("./components/legal/PrivacyPolicyScreen").then(m => ({ default: m.PrivacyPolicyScreen })));
const TermsOfServiceScreen = lazy(() => import("./components/legal/TermsOfServiceScreen").then(m => ({ default: m.TermsOfServiceScreen })));
const DeleteAccountScreen = lazy(() => import("./components/legal/DeleteAccountScreen").then(m => ({ default: m.DeleteAccountScreen })));
const BillingScreen = lazy(() => import("./components/billing/BillingScreen").then(m => ({ default: m.BillingScreen })));
const InviteWizardScreen = lazy(() => import("./components/onboarding/InviteWizardScreen").then(m => ({ default: m.InviteWizardScreen })));
const PaymentSuccessScreen = lazy(() => import("./components/billing/PaymentSuccessScreen").then(m => ({ default: m.PaymentSuccessScreen })));
const PaymentFailScreen = lazy(() => import("./components/billing/PaymentFailScreen").then(m => ({ default: m.PaymentFailScreen })));
const PublicProfileScreen = lazy(() => import("./components/PublicProfileScreen").then(m => ({ default: m.PublicProfileScreen })));
const FriendConnectScreen = lazy(() => import("./components/FriendConnectScreen").then(m => ({ default: m.FriendConnectScreen })));
const MatchmakerRewardScreen = lazy(() => import("./components/MatchmakerRewardScreen").then(m => ({ default: m.MatchmakerRewardScreen })));
const NotificationScreen = lazy(() => import("./components/NotificationScreen").then(m => ({ default: m.NotificationScreen })));
const LeagueScreen = lazy(() => import("./components/LeagueScreen").then(m => ({ default: m.LeagueScreen })));
const AiHubScreen = lazy(() => import("./components/AiHubScreen").then(m => ({ default: m.AiHubScreen })));
const PhotoVerifyScreen = lazy(() => import("./components/PhotoVerifyScreen").then(m => ({ default: m.PhotoVerifyScreen })));
const ColorTestScreen = lazy(() => import("./components/ColorTestScreen").then(m => ({ default: m.ColorTestScreen })));
const InviteHubScreen = lazy(() => import("./components/invite/InviteHubScreen").then(m => ({ default: m.InviteHubScreen })));

import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "./components/ui/dialog";
import { Home, User, Trophy, Sparkles, Heart, Waypoints } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../lib/auth/authService";
import { PendingApprovalScreen } from "./components/PendingApprovalScreen";
import { tokenStorage } from "../lib/auth/tokenStorage";
import { api } from "../lib/api/apiClient";

/** lazy 화면 로딩 중 fallback — 경량 spinner (브랜드 톤) */
function ScreenFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-7 h-7 rounded-full border-2 border-muted border-t-primary animate-spin" />
    </div>
  );
}

type Screen =
  | "login"
  | "emailLogin"
  | "emailSignup"
  | "matchmakerSignup"
  | "oauth2Redirect"
  | "requiredInfo"
  | "accountTypeSelection"
  | "basicInfo"
  | "photoUpload"
  | "lifestyle"
  | "idealType"
  | "aiProfileEnhance"
  | "aiInterview"
  | "myProfile"
  | "profileEdit"
  | "profileDetail"
  | "mainFeed"
  | "introductionHistory"
  | "connectorDashboard"
  | "myPage"
  | "publicProfile"
  | "friendConnect"
  | "matchmakerReward"
  | "notifications"
  | "league"
  | "aiHub"
  | "matchmakerMarketplace"
  | "matchmakerPublicProfile"
  | "designSystem"
  | "photoVerify"
  | "colorTest"
  | "colorDetail"
  | "inviteHub"
  | "privacyPolicy"
  | "termsOfService"
  | "deleteAccount"
  | "billing"
  | "inviteWizard"
  | "paymentSuccess"
  | "paymentFail"
  | "pendingApproval";

const ONBOARDING_DRAFT_KEY = "palette_onboarding_draft";
const ONBOARDING_STEP_KEY = "palette_onboarding_step";
// AI 단일 트랙 (직접 작성 분기 제거) — 실제 진행 순서대로
const ONBOARDING_SCREENS: Screen[] = ["basicInfo", "lifestyle", "idealType", "photoUpload", "aiInterview", "aiProfileEnhance"];
const ONBOARDING_SCREENS_SET = new Set<Screen>(ONBOARDING_SCREENS);

function loadOnboardingDraft() {
  try {
    const raw = localStorage.getItem(ONBOARDING_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** hex → { h, s, l } (0-360, 0-100, 0-100) */
function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return null;
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/** P9: 프로필 컬러는 **장식 전용** --user-accent 에만 적용.
 *  --brand(gold) / --primary(charcoal) 는 서비스 메인색이라 절대 덮어쓰지 않음.
 *  (이전엔 프로필색이 --brand/--primary 를 교체해 gold 지배력을 흐림 — 제거) */
function applyBrandFromHsl(h: number, s: number, l: number, _hex?: string) {
  const root = document.documentElement;
  const softL = Math.min(Math.max(l + 35, 90), 97);
  root.style.setProperty('--accent-h', `${h}`);
  root.style.setProperty('--accent-s', `${s}%`);
  root.style.setProperty('--accent-l', `${l}%`);
  root.style.setProperty('--user-accent', `${h} ${s}% ${l}%`);
  root.style.setProperty('--user-accent-soft', `${h} ${s}% ${softL}%`);
}

/** Apply brand color from hex */
function applyBrandColor(hex: string) {
  if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
  const hsl = hexToHsl(hex);
  if (!hsl) return;
  applyBrandFromHsl(hsl.h, hsl.s, hsl.l, hex);
}

/** Apply brand color from localStorage color type key using pre-defined HSL values */
function applyBrandFromLocalStorage() {
  try {
    const raw = localStorage.getItem("palette_color_test");
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const key = parsed?.colorType;
    if (!key) return;
    // Import inline to avoid circular deps — use fetch from colorCompatibility COLOR_META
    const COLOR_HSL: Record<string, { h: number; s: number; l: number }> = {
      orange: { h: 22, s: 92, l: 56 },
      blue:   { h: 212, s: 78, l: 56 },
      red:    { h: 4, s: 78, l: 58 },
      pink:   { h: 340, s: 80, l: 66 },
      green:  { h: 152, s: 52, l: 46 },
      purple: { h: 268, s: 56, l: 60 },
      yellow: { h: 42, s: 92, l: 56 },
      gray:   { h: 220, s: 8, l: 48 },
    };
    const hsl = COLOR_HSL[key];
    if (hsl) applyBrandFromHsl(hsl.h, hsl.s, hsl.l);
  } catch {}
}

/**
 * PA-012 — Toss 결제 위젯 callback 라우팅.
 * Toss 가 ${origin}/payment-success 또는 /payment-fail 로 리다이렉트하면
 * SPA 초기 currentScreen 을 그 화면으로 진입시킨다.
 */
function detectInitialScreen(): Screen | null {
  if (typeof window === "undefined") return null;
  if (window.location.pathname === "/payment-success") return "paymentSuccess";
  if (window.location.pathname === "/payment-fail") return "paymentFail";
  return null;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => detectInitialScreen() ?? "login");
  const [friendConnectFrom, setFriendConnectFrom] = useState<Screen>("myPage");
  /** ProfileDetail 진입 직전 화면 — 뒤로가기 시 정확히 복귀 (메인 피드·주선 대시보드·인연 이력 등) */
  const [profileDetailFrom, setProfileDetailFrom] = useState<Screen>("mainFeed");
  // 색 상세 진입점 — myPage / myProfile 둘 다 진입 가능, 돌아갈 화면 추적
  const [colorDetailFrom, setColorDetailFrom] = useState<Screen>("myPage");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [betaPassed, setBetaPassed] = useState<boolean>(hasBetaPassed());
  const handleBetaPassed = useCallback(() => setBetaPassed(true), []);
  const [introSeen, setIntroSeen] = useState<boolean>(hasIntroSeen());
  const handleIntroDone = useCallback(() => setIntroSeen(true), []);
  const [missingRequiredFields, setMissingRequiredFields] = useState<string[]>([]);
  const [isConvertingToRegular, setIsConvertingToRegular] = useState(false);
  const [userGender, setUserGender] = useState<string | undefined>(undefined);
  const [userAccountType, setUserAccountType] = useState<"REGULAR" | "MATCHMAKER_ONLY" | undefined>(undefined);
  // ADR 0054 운영자 승인 게이팅 — 프로필 완성 후 PENDING_APPROVAL/REJECTED 면 심사중 화면만 노출
  const [approvalStatus, setApprovalStatus] = useState<string | undefined>(undefined);
  const [approvalReason, setApprovalReason] = useState<string | null>(null);
  // 승인 완료 축하 다이얼로그 — 새로고침으로 ACTIVE 확인 시 노출, 확인 누르면 진입할 화면
  const [approvalCelebration, setApprovalCelebration] = useState<Screen | null>(null);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [selectedMutualFriends, setSelectedMutualFriends] = useState<MutualFriend[]>([]);
  const [selectedDegree, setSelectedDegree] = useState<number>(2);
  const [selectedViewCost, setSelectedViewCost] = useState<number>(20);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [introMethod, setIntroMethod] = useState<"INTERVIEW" | "MANUAL">("INTERVIEW");
  /** AI 인터뷰 재분석 모드 (마이페이지에서 진입 시 true) — 완료 후 마이페이지로 복귀 */
  const [isReanalyzeMode, setIsReanalyzeMode] = useState(false);
  /** 재분석용 prefill 답변 (서버 프로필에서 로드) */
  const [reanalyzeAnswers, setReanalyzeAnswers] = useState<Record<string, string> | null>(null);
  const [prevScreen, setPrevScreen] = useState<Screen>("mainFeed");
  const [selectedMatchmakerId, setSelectedMatchmakerId] = useState<string | undefined>(undefined);
  /** 이메일 회원가입 전 선택한 계정 유형 (pre-auth 경로 전용) */
  const [preSelectedAccountType, setPreSelectedAccountType] = useState<"REGULAR" | "MATCHMAKER_ONLY" | null>(null);
  /** accountTypeSelection 화면의 동작 모드 */
  const [accountTypeSelectionMode, setAccountTypeSelectionMode] = useState<"pre-auth" | "post-auth">("post-auth");

  const navigateToNotifications = () => {
    setPrevScreen(currentScreen);
    setCurrentScreen("notifications");
  };

  // Profile data collected during registration (persisted to localStorage, excluding photos/video)
  const [profileData, setProfileData] = useState(() => {
    const draft = loadOnboardingDraft();
    return {
      basicInfo: draft?.basicInfo ?? {
        name: "",
        birthYear: "",
        birthMonth: "",
        birthDay: "",
        gender: "",
        height: 170,
        bodyType: "",
      },
      careerInfo: draft?.careerInfo ?? {
        category: "",
        company: "",
        position: "",
      },
      educationInfo: draft?.educationInfo ?? {
        level: "",
        school: "",
        major: "",
      },
      locationInfo: draft?.locationInfo ?? {
        region: "",
        district: "",
      },
      photos: [] as string[],
      mainPhotoIndex: 0,
      video: null as string | null,
      introduction: draft?.introduction ?? {
        text: "",
        interests: [] as string[],
        interviewAnswers: {
          hobby: "",
          charm: "",
          passion: "",
          happiness: "",
          motto: "",
        },
      },
      lifestyleInfo: draft?.lifestyleInfo ?? {
        smoking: "",
        drinking: "",
        religion: "",
      },
      idealType: draft?.idealType ?? {
        ageMin: null as number | null,
        ageMax: null as number | null,
        heightMin: null as number | null,
        heightMax: null as number | null,
        bodyTypes: [] as string[],
        personalities: [] as string[],
        datePreferences: [] as string[],
        importantValues: [] as string[],
        appearanceStyles: [] as string[],
        dealBreakers: [] as string[],
      },
      personalityTests: draft?.personalityTests ?? [] as Array<{ title: string; link: string }>,
    };
  });

  // Apply brand color from localStorage immediately on mount (before API call)
  useEffect(() => {
    applyBrandFromLocalStorage();
  }, []);

  // Check authentication state on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Check if this is a public profile URL or share link
      const profileMatch = window.location.pathname.match(/^\/profile\/(.+)$/);
      const shareMatch = window.location.pathname.match(/^\/share\/(.+)$/);
      if (profileMatch || shareMatch) {
        setCurrentScreen("publicProfile");
        setIsLoading(false);
        return;
      }

      // Check if this is OAuth2 redirect
      if (window.location.pathname === '/oauth2/redirect') {
        setCurrentScreen("oauth2Redirect");
        setIsLoading(false);
        return;
      }

      // Check if user has tokens
      if (tokenStorage.isAuthenticated()) {
        try {
          const user = await authService.getCurrentUser();
          if (user) {
            setIsLoggedIn(true);
            setUserGender(user.gender); // Store user gender for profile editing
            const acctType = user.accountType;
            setUserAccountType(acctType);
            // If profile is completed, go to main feed, otherwise restore or start onboarding
            // ADR 0014: MATCHMAKER_ONLY 는 mainFeed 가 아닌 ConnectorDashboard 로
            if (user.isProfileCompleted) {
              setApprovalStatus(user.approvalStatus);
              setApprovalReason(user.approvalReason ?? null);
              // ADR 0054: REGULAR 은 운영자 승인(ACTIVE) 전까지 심사중 화면만
              if (acctType === "REGULAR" && user.approvalStatus && user.approvalStatus !== "ACTIVE") {
                setCurrentScreen("pendingApproval");
              } else {
                setCurrentScreen(acctType === "MATCHMAKER_ONLY" ? "connectorDashboard" : "mainFeed");
              }
            } else {
              const savedStep = localStorage.getItem(ONBOARDING_STEP_KEY);
              const validStep = savedStep && ONBOARDING_SCREENS_SET.has(savedStep as Screen)
                ? (savedStep as Screen)
                : "basicInfo";
              setCurrentScreen(validStep);
            }
          } else {
            // Invalid tokens, clear them
            tokenStorage.clearTokens();
            setCurrentScreen("login");
          }
        } catch (error) {
          console.error('Error checking auth:', error);
          tokenStorage.clearTokens();
          setCurrentScreen("login");
        }
      } else {
        setCurrentScreen("login");
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  // Persist current onboarding step to localStorage for mid-flow restoration
  useEffect(() => {
    if (ONBOARDING_SCREENS_SET.has(currentScreen)) {
      localStorage.setItem(ONBOARDING_STEP_KEY, currentScreen);
    }
  }, [currentScreen]);

  // Persist onboarding draft to localStorage (excludes photos/video — too large)
  useEffect(() => {
    if (!ONBOARDING_SCREENS.includes(currentScreen)) return;
    try {
      const { photos: _photos, video: _video, mainPhotoIndex: _idx, ...saveable } = profileData;
      localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(saveable));
    } catch {
      // quota exceeded — silently ignore
    }
  }, [profileData, currentScreen]);

  // Apply user's color type as app primary color
  useEffect(() => {
    if (!isLoggedIn) return;
    api.get<any>('/api/v1/profile').then(p => {
      const hex = p?.colorType?.hex;
      if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
      applyBrandColor(hex);
    }).catch(() => {});
  }, [isLoggedIn]);

  // Poll unread notification count when logged in
  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchUnread = () => {
      api.get<{ count: number }>("/api/v1/notifications/unread-count")
        .then(r => setUnreadNotificationCount(r.count))
        .catch(() => {});
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 30000);
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const handleOAuth2Success = (isNewUser: boolean, missingFields?: string[]) => {
    setIsLoggedIn(true);

    // If there are missing required fields, go to RequiredInfoScreen first
    if (missingFields && missingFields.length > 0) {
      setMissingRequiredFields(missingFields);
      setCurrentScreen("requiredInfo");
      toast.info("추가 정보를 입력해주세요");
      return;
    }

    // If new user, go to account type selection (post-auth: API 호출 포함)
    if (isNewUser) {
      setAccountTypeSelectionMode("post-auth");
      setCurrentScreen("accountTypeSelection");
      toast.success("환영합니다!");
    } else {
      setCurrentScreen("mainFeed");
      toast.success("로그인되었습니다!");
    }
  };

  const handleOAuth2Error = () => {
    toast.error("로그인에 실패했습니다. 다시 시도해주세요.");
    setCurrentScreen("login");
  };

  const handleRequiredInfoComplete = () => {
    // After filling required info, go to account type selection
    setCurrentScreen("accountTypeSelection");
  };

  const handleAccountTypeSelection = (accountType: "REGULAR" | "MATCHMAKER_ONLY") => {
    if (accountType === "REGULAR") {
      // 일반 회원: 프로필 작성으로 이동
      setCurrentScreen("basicInfo");
    } else {
      // 주선자 전용: 회원가입 단계에서 이미 닉네임/휴대폰 받았으므로
      // 추가 입력 단계 없이 곧장 대시보드로 (ADR 0013)
      // - 백엔드에서 PATCH /auth/account-type 시 Matchmaker entity 자동 생성
      // - 프로필 사진 등 주선자 전용 입력은 대시보드에서 나중에
      setCurrentScreen("connectorDashboard");
      toast.success("주선자 등록이 완료되었습니다!");
    }
  };

  const handleBasicInfoNext = (data: any) => {
    setProfileData(prev => ({
      ...prev,
      basicInfo: data.basicInfo,
      careerInfo: data.careerInfo,
      educationInfo: data.educationInfo,
      locationInfo: data.locationInfo,
      personalityTests: data.personalityTests ?? prev.personalityTests,
    }));
    setUserGender(data.basicInfo.gender); // Store gender for profile editing later
    // 재배치: 구조화 선호(라이프스타일·이상형)를 먼저 → 그걸 바탕으로 인터뷰
    setCurrentScreen("lifestyle");
  };

  const handleBasicInfoBack = () => {
    // 전환 중이었다면 전환 취소하고 주선자 프로필로 복귀
    if (isConvertingToRegular) {
      setIsConvertingToRegular(false);
      toast.info("일반 회원 전환이 취소되었습니다");
      setCurrentScreen("myProfile");
    } else {
      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      setCurrentScreen("accountTypeSelection");
    }
  };

  const handlePhotoNext = (data: any) => {
    setProfileData(prev => ({
      ...prev,
      photos: data.photos.filter((p: string | null) => p !== null),
      mainPhotoIndex: data.mainPhotoIndex,
      video: data.video,
    }));
    // 사진은 인터뷰 앞 단계 → 다음은 AI 인터뷰(마지막 입력)
    setCurrentScreen("aiInterview");
  };

  const handleAIInterviewComplete = (answers: Record<string, string>) => {
    setProfileData(prev => ({
      ...prev,
      introduction: {
        ...prev.introduction,
        interviewAnswers: answers,
      },
    }));
    // 인터뷰가 마지막 입력 → 끝나면 바로 소개글 자동 생성 + 전체 프로필 확인 화면
    setCurrentScreen("aiProfileEnhance");
  };

  /**
   * 마이페이지 → 팔레트 분석 다시 받기.
   * 서버 프로필에서 기존 인터뷰 답변·이상형을 로드해 profileData 에 prefill 하고
   * 인터뷰 화면을 재진행 모드로 진입. 완료 후 마이페이지로 복귀.
   */
  const handleReanalyzeStart = async () => {
    try {
      const data = await api.get<any>('/api/v1/profile');
      const prevAnswers: Record<string, string> = data?.introduction?.interviewAnswers ?? {};
      setReanalyzeAnswers(prevAnswers);
      setProfileData(prev => ({
        ...prev,
        introduction: { ...prev.introduction, interviewAnswers: prevAnswers },
        idealType: data?.idealType ?? prev.idealType,
        lifestyleInfo: data?.lifestyleInfo ?? prev.lifestyleInfo,
      }));
      setIntroMethod("INTERVIEW");
      setIsReanalyzeMode(true);
      setCurrentScreen("aiInterview");
    } catch {
      toast.error("기존 답변을 불러오지 못했어요");
    }
  };

  const handlePhotoBack = () => {
    setCurrentScreen("idealType");
  };

  /** 공통 라이프스타일 스텝(흡연/음주/종교/관심사) — 두 경로(인터뷰/직접) 모두 거침 → idealType */
  const handleLifestyleNext = (data: {
    lifestyleInfo: { smoking: string; drinking: string; religion: string };
    introduction: { interests: string[]; datingStyle?: Record<string, string> };
  }) => {
    setProfileData(prev => ({
      ...prev,
      introduction: {
        ...prev.introduction,
        interests: data.introduction?.interests ?? prev.introduction.interests ?? [],
        datingStyle: data.introduction?.datingStyle ?? prev.introduction.datingStyle ?? {},
      },
      lifestyleInfo: data.lifestyleInfo || prev.lifestyleInfo,
    }));
    setCurrentScreen("idealType");
  };


  const handleIdealTypeNext = (data: any) => {
    setProfileData(prev => ({
      ...prev,
      idealType: data.idealType,
    }));
    // 이상형 다음은 사진 → 그 다음 AI 인터뷰(마지막 입력, 앞 단계 데이터 기반)
    setCurrentScreen("photoUpload");
  };

  const handleAIProfileComplete = async (result: { colorType: string; colorName: string; colorHex: string; colorDescription: string; generatedIntroduction: string; colorReasoning?: string; personalitySummary?: string; idealTypeInsight?: string; strengths?: string[] }) => {
    try {
      // colorType + AI 분석(근거/성향/이상형/강점) 저장
      try {
        await api.post("/api/v1/ai-interview/complete", {
          colorType: result.colorType,
          colorReasoning: result.colorReasoning,
          personalitySummary: result.personalitySummary,
          idealTypeInsight: result.idealTypeInsight,
          strengths: result.strengths,
        });
      } catch (e) {
        console.warn("컬러 타입 저장 실패 (무시하고 계속)", e);
      }

      // 프로필 생성 또는 업데이트

      // 직군 한글 라벨 → enum (인터뷰 자연어 응답 → enum value).
      // 풀 라벨/짧은 라벨 둘 다 인식 + 기존(초기 풀) 한글도 호환.
      const jobCategoryMap: { [key: string]: string } = {
        // 초기 풀 (호환)
        'IT/개발': 'IT_DEVELOPMENT', 'IT개발': 'IT_DEVELOPMENT',
        '금융/보험': 'FINANCE', '금융': 'FINANCE',
        '교육': 'EDUCATION', '교육 (교사·강사)': 'EDUCATION',
        '의료/보건': 'MEDICAL', '의료': 'MEDICAL',
        '미디어/엔터': 'MEDIA', '미디어/방송/엔터': 'MEDIA', '미디어': 'MEDIA',
        '서비스/영업': 'SERVICE',
        '제조/생산': 'MANUFACTURING', '제조/엔지니어링': 'MANUFACTURING', '제조': 'MANUFACTURING',
        '공무원/공공기관': 'PUBLIC_OFFICIAL', '공무원': 'PUBLIC_OFFICIAL',
        '전문직': 'PROFESSIONAL',
        '기타': 'OTHER',
        // 확장 (ADR 0036)
        '디자인/크리에이티브': 'DESIGN', '디자인': 'DESIGN',
        '기획/전략': 'PLANNING_STRATEGY', '기획': 'PLANNING_STRATEGY',
        '마케팅/광고/홍보': 'MARKETING', '마케팅': 'MARKETING',
        '법조 (변호사·법무사)': 'LAW', '법조': 'LAW', '변호사': 'LAW',
        '회계/세무': 'ACCOUNTING_TAX', '회계': 'ACCOUNTING_TAX', '세무': 'ACCOUNTING_TAX',
        '연구/학술 (교수·연구원)': 'RESEARCH', '연구': 'RESEARCH', '연구원': 'RESEARCH', '교수': 'RESEARCH',
        '군인/경찰/소방': 'MILITARY_POLICE', '군경': 'MILITARY_POLICE',
        '영업/세일즈': 'SALES', '영업': 'SALES',
        '서비스/유통/F&B': 'SERVICE',
        '건설/부동산': 'CONSTRUCTION_REALESTATE', '건설': 'CONSTRUCTION_REALESTATE',
        '무역/물류': 'TRADE_LOGISTICS', '물류': 'TRADE_LOGISTICS',
        '예술/문화/스포츠': 'ART_CULTURE', '예술': 'ART_CULTURE',
        '사업/창업/자영업': 'STARTUP_BUSINESS', '사업': 'STARTUP_BUSINESS',
        '프리랜서': 'FREELANCE', '프리': 'FREELANCE',
        '학생/취업준비': 'STUDENT', '학생': 'STUDENT',
      };

      const educationMap: { [key: string]: string } = {
        '고졸': 'HIGH_SCHOOL',
        '전문대': 'ASSOCIATE',
        '대졸': 'BACHELOR',
        '석사': 'MASTER',
        '박사': 'DOCTORATE',
      };

      // ADR 0057 — 체형·흡연/음주·종교·데이트선호·중요가치·외모상 칩은 어드민 관리(코드 직송).
      // 한글↔enum 변환 맵 제거. jobCategory·education 만 고정 enum 변환 유지.

      const apiData = {
        basicInfo: {
          height: profileData.basicInfo.height || null,
          bodyType: profileData.basicInfo.bodyType || null,   // ADR 0057 — 코드 직송
          mbti: profileData.basicInfo.mbti || null,   // A-1 fix: 가입 시 입력한 MBTI 가 저장되지 않던 버그
        },
        careerInfo: {
          category: profileData.careerInfo.category ? jobCategoryMap[profileData.careerInfo.category] : null,
          company: profileData.careerInfo.company || null,
          position: profileData.careerInfo.position || null,
        },
        educationInfo: {
          level: profileData.educationInfo.level ? educationMap[profileData.educationInfo.level] : null,
          school: profileData.educationInfo.school || null,
          major: profileData.educationInfo.major || null,
        },
        locationInfo: {
          sido: profileData.locationInfo.region || null,
          sigungu: profileData.locationInfo.district || null,
        },
        lifestyleInfo: {
          smoking: profileData.lifestyleInfo.smoking || null,   // ADR 0057 — 코드 직송
          drinking: profileData.lifestyleInfo.drinking || null,
          religion: profileData.lifestyleInfo.religion || null,
        },
        introduction: {
          text: result.generatedIntroduction || profileData.introduction.text || null,
          interests: profileData.introduction.interests || [],
          interviewAnswers: profileData.introduction.interviewAnswers || null,
          datingStyle: profileData.introduction.datingStyle || {},
        },
        idealType: {
          // ADR 0057 — 칩이 코드를 저장하므로 변환 없이 직송
          datePreferences: profileData.idealType.datePreferences || [],
          importantValues: profileData.idealType.importantValues || [],
          personalities: profileData.idealType.personalities || [],
          appearanceStyles: profileData.idealType.appearanceStyles || [],
          dealBreakers: profileData.idealType.dealBreakers || [],
          // DA-001 — 나이/키 범위 저장 (IdealTypeScreen 의 슬라이더 입력 → 백엔드 영속화)
          ageMin: profileData.idealType.ageMin ?? null,
          ageMax: profileData.idealType.ageMax ?? null,
          heightMin: profileData.idealType.heightMin ?? null,
          heightMax: profileData.idealType.heightMax ?? null,
        },
        personalityTests: profileData.personalityTests || [],
        settings: {
          isAcceptingMatches: true,
          hiddenAt: null,
        },
      };

      await api.put('/api/v1/profile', apiData);

      // 전환 중이었다면 실제로 전환 API 호출
      if (isConvertingToRegular) {
        await api.patch('/api/v1/auth/convert-to-regular');
        setIsConvertingToRegular(false);
        toast.success("일반 회원으로 전환되었습니다!");
      }

      localStorage.removeItem(ONBOARDING_DRAFT_KEY);
      localStorage.removeItem(ONBOARDING_STEP_KEY);
      if (isReanalyzeMode) {
        setIsReanalyzeMode(false);
        setReanalyzeAnswers(null);
        setCurrentScreen("myPage");
        toast.success("팔레트가 다시 분석했어요 ✨");
      } else {
        // ADR 0054: 신규 가입자는 프로필 완성 시 운영자 승인 대기로 전환 → 심사중 화면
        setApprovalStatus("PENDING_APPROVAL");
        setApprovalReason(null);
        setCurrentScreen("pendingApproval");
        toast.success("프로필이 제출됐어요! 운영자 승인 후 시작할 수 있어요.");
      }
    } catch (error: any) {
      console.error('Failed to complete profile:', error);
      toast.error(`프로필 생성에 실패했습니다: ${error?.message || '알 수 없는 오류'}`);
    }
  };

  const handleMyProfileBack = () => {
    setCurrentScreen("myPage");
  };

  const handleMyProfileEdit = () => {
    setCurrentScreen("profileEdit");
  };

  const handleConnectorDashboardBack = () => {
    setCurrentScreen("mainFeed");
  };

  const handleProfileEditSave = async () => {
    setProfileRefreshKey(prev => prev + 1); // Force MyProfileScreen to remount
    // 반려/심사 상태에서 보완 완료한 경우 → 무조건 심사 대기 화면으로 (ADR 0054).
    // 백엔드가 REJECTED→PENDING_APPROVAL 로 재제출 처리하므로 최신 상태를 받아 라우팅.
    const user = await authService.getCurrentUser();
    if (user && user.approvalStatus && user.approvalStatus !== "ACTIVE") {
      setApprovalStatus(user.approvalStatus);
      setApprovalReason(user.approvalReason ?? null);
      setCurrentScreen("pendingApproval");
      toast.success("프로필을 보완했어요. 다시 심사를 요청했어요.");
      return;
    }
    setCurrentScreen("myProfile");
    toast.success("프로필이 저장되었습니다!");
  };

  const handleProfileEditBack = () => {
    setCurrentScreen("myProfile");
  };

  const handleConvertToRegular = () => {
    setIsConvertingToRegular(true);
    toast.info("프로필 작성을 완료하면 일반 회원으로 전환됩니다.", {
      description: "언제든 뒤로가기를 눌러 취소할 수 있어요.",
      duration: 5000,
    });
    setCurrentScreen("basicInfo");
  };

  const handleEmailLogin = () => {
    setCurrentScreen("emailLogin");
  };

  /** 이메일 회원가입 전 타입 선택 → 타입 저장 후 이메일 폼으로 */
  const handlePreAuthAccountTypeSelect = (accountType: "REGULAR" | "MATCHMAKER_ONLY") => {
    setPreSelectedAccountType(accountType);
    setCurrentScreen("emailSignup");
  };

  const handleEmailAuthSuccess = async () => {
    setIsLoggedIn(true);

    try {
      const user = await authService.getCurrentUser();

      if (user) {
        setUserGender(user.gender);
        const acctType = user.accountType;
        setUserAccountType(acctType);
        if (user.isProfileCompleted) {
          setApprovalStatus(user.approvalStatus);
          setApprovalReason(user.approvalReason ?? null);
          // ADR 0054: REGULAR 은 운영자 승인(ACTIVE) 전까지 심사중 화면만
          if (acctType === "REGULAR" && user.approvalStatus && user.approvalStatus !== "ACTIVE") {
            setCurrentScreen("pendingApproval");
            return;
          }
          // ADR 0014: MATCHMAKER_ONLY 는 mainFeed 가 아닌 ConnectorDashboard 로
          setCurrentScreen(acctType === "MATCHMAKER_ONLY" ? "connectorDashboard" : "mainFeed");
          toast.success("로그인되었습니다!");
          return;
        }
      }

      // pre-auth 경로: 이미 타입 선택 완료 → API 호출 후 바로 다음 단계
      if (preSelectedAccountType) {
        try {
          await api.patch("/api/v1/auth/account-type", { accountType: preSelectedAccountType });
        } catch (e) {
          console.warn("account-type 설정 실패, 계속 진행", e);
        }
        const type = preSelectedAccountType;
        setPreSelectedAccountType(null);
        // 가입 완료 토스트는 EmailSignupScreen 에서 이미 노출 — 중복 "환영합니다!" 제거
        handleAccountTypeSelection(type);
        return;
      }

      // post-auth 경로 (로그인 또는 OAuth 신규): 타입 선택 화면으로
      setCurrentScreen("accountTypeSelection");
      toast.success("환영합니다! 계정 유형을 선택해주세요");
    } catch (error) {
      console.error('Error after email auth:', error);
      setCurrentScreen("accountTypeSelection");
      toast.info("계정 설정을 완료해주세요");
    }
  };

  const handleBackToLogin = () => {
    setCurrentScreen("login");
  };

  const handleMatchmakerSignupSuccess = async () => {
    setIsLoggedIn(true);

    try {
      // 주선자는 프로필 작성 없이 바로 주선자 대시보드로 이동
      setCurrentScreen("connectorDashboard");
      toast.success("주선자 가입이 완료되었습니다!");
    } catch (error) {
      console.error('Error after matchmaker signup:', error);
      setCurrentScreen("connectorDashboard");
    }
  };

  // matchmakerInfo 화면은 ADR 0013 에서 제거됨. 회원가입 단계의 정보로 충분.
  // 기존 onComplete 핸들러는 호출 경로가 없어 제거.

  const handleProfileClick = (item: any) => {
    setSelectedUserId(item.profile.userId);
    const rawFriends = item.mutualFriends || [];
    const friends: MutualFriend[] = rawFriends.map((f: any) =>
      typeof f === "string" ? { name: f } : f
    );
    setSelectedMutualFriends(friends);
    setSelectedDegree(item.degree ?? 2);
    // ADR 0044 — viewCost 는 "물감(P)" 단위. 친친 기본값 20 (2,000원 — 커피 한잔값).
    setSelectedViewCost(item.viewCost ?? 20);
    // 뒤로가기 시 복귀할 화면 기록 (현재 화면 = 진입 직전 화면)
    setProfileDetailFrom(currentScreen);
    setCurrentScreen("profileDetail");
  };

  const handleProfileDetailBack = () => {
    // 진입점에 따라 동적 복귀. 기본값은 mainFeed (소개 탭) — fallback.
    setCurrentScreen(profileDetailFrom);
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    // 흰 배경 중앙에 컬러 하트(데이팅+색=팔레트). 네이티브 스플래시·앱아이콘과 동일.
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFFFFF" }}>
        <svg
          width="116"
          height="116"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Palette"
          className="animate-pulse"
          style={{ filter: "drop-shadow(0 14px 34px rgba(224, 101, 74, 0.28))" }}
        >
          <defs>
            <linearGradient id="palette-heart-loading" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#FF7E5F" />
              <stop offset="0.4" stopColor="#FFB088" />
              <stop offset="0.72" stopColor="#FFD166" />
              <stop offset="1" stopColor="#5EEAD4" />
            </linearGradient>
          </defs>
          <path
            d="M50 80 C16 56 20 28 40 28 C49 28 50 37 50 39 C50 37 51 28 60 28 C80 28 84 56 50 80 Z"
            fill="url(#palette-heart-loading)"
          />
        </svg>
      </div>
    );
  }

  // 베타 게이트 — 로그인 안 된 신규 방문자만 차단 (이미 토큰 있으면 통과)
  if (!betaPassed && !isLoggedIn) {
    return <BetaGateScreen onPassed={handleBetaPassed} />;
  }

  // 베타 코드 통과 후 인트로 (3-slide) — 로그인 안 된 신규에게만 한 번 노출
  if (betaPassed && !introSeen && !isLoggedIn) {
    return <BetaWelcomeIntro onDone={handleIntroDone} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Suspense fallback={<ScreenFallback />}>
      {currentScreen === "pendingApproval" && (
        <PendingApprovalScreen
          status={approvalStatus ?? "PENDING_APPROVAL"}
          reason={approvalReason}
          onRefresh={async () => {
            const user = await authService.getCurrentUser();
            if (!user) return;
            setApprovalStatus(user.approvalStatus);
            setApprovalReason(user.approvalReason ?? null);
            if (user.approvalStatus === "ACTIVE") {
              // 바로 넘기지 않고 축하 확인창을 띄운 뒤 진입 (확인 시 navigate)
              setApprovalCelebration(user.accountType === "MATCHMAKER_ONLY" ? "connectorDashboard" : "mainFeed");
            } else if (user.approvalStatus === "REJECTED") {
              toast.info("프로필 보완이 필요해요");
            } else {
              toast.info("아직 심사 중이에요. 조금만 기다려주세요.");
            }
          }}
          onResubmit={() => setCurrentScreen("profileEdit")}
        />
      )}

      {currentScreen === "login" && (
        <LoginScreen
          onEmailLogin={handleEmailLogin}
          onLoginSuccess={handleEmailAuthSuccess}
        />
      )}

      {currentScreen === "emailLogin" && (
        <EmailLoginScreen
          onSuccess={handleEmailAuthSuccess}
          onBackToLogin={handleBackToLogin}
          onGoToSignup={() => {
            setAccountTypeSelectionMode("pre-auth");
            setCurrentScreen("accountTypeSelection");
          }}
        />
      )}

      {currentScreen === "emailSignup" && (
        <EmailSignupScreen
          onSuccess={handleEmailAuthSuccess}
          onBackToLogin={handleBackToLogin}
        />
      )}

      {currentScreen === "matchmakerSignup" && (
        <MatchmakerSignupScreen
          onSuccess={handleMatchmakerSignupSuccess}
          onBack={handleBackToLogin}
        />
      )}

      {/* matchmakerInfo 화면은 ADR 0013 에서 제거 — 회원가입 데이터로 충분 */}

      {currentScreen === "oauth2Redirect" && (
        <OAuth2RedirectHandler
          onSuccess={handleOAuth2Success}
          onError={handleOAuth2Error}
        />
      )}

      {currentScreen === "requiredInfo" && (
        <RequiredInfoScreen
          missingFields={missingRequiredFields}
          onComplete={handleRequiredInfoComplete}
        />
      )}

      {currentScreen === "accountTypeSelection" && (
        accountTypeSelectionMode === "pre-auth" ? (
          // 이메일 회원가입 전 타입 선택 → 이메일 폼으로 이동 (API 호출 없음)
          <AccountTypeSelectionScreen
            mode="pre-auth"
            onComplete={handlePreAuthAccountTypeSelect}
            onBack={() => setCurrentScreen("emailLogin")}
          />
        ) : (
          // OAuth/로그인 후 타입 선택 → API 호출 후 온보딩으로
          <AccountTypeSelectionScreen
            mode="post-auth"
            onComplete={handleAccountTypeSelection}
          />
        )
      )}

      {currentScreen === "basicInfo" && (
        <BasicInfoScreen
          onNext={handleBasicInfoNext}
          onBack={handleBasicInfoBack}
          initialData={{
            basicInfo: profileData.basicInfo,
            careerInfo: profileData.careerInfo,
            educationInfo: profileData.educationInfo,
            locationInfo: profileData.locationInfo,
          }}
        />
      )}
      
      {currentScreen === "photoUpload" && (
        <PhotoUploadScreen
          onNext={handlePhotoNext}
          onBack={handlePhotoBack}
          initialData={{
            photos: profileData.photos,
            mainPhotoIndex: profileData.mainPhotoIndex,
            video: profileData.video,
          }}
        />
      )}
      
      {currentScreen === "aiInterview" && (
        <AIInterviewScreen
          onComplete={handleAIInterviewComplete}
          onBack={() => {
            if (isReanalyzeMode) {
              setIsReanalyzeMode(false);
              setReanalyzeAnswers(null);
              setCurrentScreen("myPage");
            } else {
              setCurrentScreen("photoUpload");
            }
          }}
          initialAnswers={
            isReanalyzeMode
              ? reanalyzeAnswers
              // "답변 다시하기"/뒤로가기 시 기존 답변 prefill (있을 때만 재진행 모드)
              : (Object.keys(profileData.introduction.interviewAnswers ?? {}).length > 0
                  ? profileData.introduction.interviewAnswers
                  : null)
          }
          // ADR 0068 — 앞 단계(라이프스타일·이상형·MBTI)를 바탕으로 맞춤 질문 생성. 코드 그대로 전달.
          profileContext={{
            mbti: profileData.basicInfo?.mbti,
            jobCategory: profileData.careerInfo?.category,
            interests: profileData.introduction?.interests ?? [],
            smoking: profileData.lifestyleInfo?.smoking || undefined,
            drinking: profileData.lifestyleInfo?.drinking || undefined,
            datingStyle: profileData.introduction?.datingStyle ?? {},
            idealPersonalities: profileData.idealType?.personalities ?? [],
            idealDatePreferences: profileData.idealType?.datePreferences ?? [],
            idealImportantValues: profileData.idealType?.importantValues ?? [],
          }}
        />
      )}

      {currentScreen === "lifestyle" && (
        <LifestyleScreen
          onNext={handleLifestyleNext}
          onBack={() => setCurrentScreen("basicInfo")}
          initialData={{
            lifestyleInfo: profileData.lifestyleInfo,
            introduction: {
              interests: profileData.introduction.interests,
            },
          }}
        />
      )}

      {currentScreen === "idealType" && (
        <IdealTypeScreen
          onNext={handleIdealTypeNext}
          onBack={() => setCurrentScreen("lifestyle")}
          initialData={{
            idealType: profileData.idealType,
          }}
          userGender={userGender || profileData.basicInfo.gender}
        />
      )}
      
      {currentScreen === "aiProfileEnhance" && (
        <AIProfileEnhanceScreen
          onComplete={handleAIProfileComplete}
          onRedoAnswers={() => setCurrentScreen("aiInterview")}
          introMethod={introMethod}
          profileData={profileData}
        />
      )}
      
      {currentScreen === "myProfile" && (
        <MyProfileScreen
          key={profileRefreshKey}
          onBack={handleMyProfileBack}
          onEdit={handleMyProfileEdit}
          onConvertToRegular={handleConvertToRegular}
          onNavigateToColor={() => { setColorDetailFrom("myProfile"); setCurrentScreen("colorDetail"); }}
        />
      )}

      {currentScreen === "profileEdit" && (
        <ProfileEditScreen
          onBack={handleProfileEditBack}
          onSave={handleProfileEditSave}
          userGender={userGender || profileData.basicInfo.gender}
        />
      )}
      
      {currentScreen === "mainFeed" && (
        <MainFeedScreen
          onProfileClick={handleProfileClick}
          onNotificationClick={navigateToNotifications}
          onNavigateToFriends={() => { setFriendConnectFrom(currentScreen); setCurrentScreen("friendConnect"); }}
          onNavigateToMyPage={() => setCurrentScreen("myPage")}
          onNavigateToBilling={() => setCurrentScreen("billing")}
          unreadNotifications={unreadNotificationCount}
        />
      )}

      {currentScreen === "introductionHistory" && (
        <IntroductionHistoryScreen
          onViewProfile={(userId) => {
            // 소개 요청 수신자가 수락 전 상대(요청자) 프로필 확인 — 무료 열람(게이트 없음)
            setSelectedUserId(userId);
            setSelectedMutualFriends([]);
            setSelectedDegree(0);
            setSelectedViewCost(0);
            setProfileDetailFrom("introductionHistory");
            setCurrentScreen("profileDetail");
          }}
        />
      )}

      {currentScreen === "profileDetail" && selectedUserId && (
        <ProfileDetailScreen
          userId={selectedUserId}
          onBack={handleProfileDetailBack}
          mutualFriends={selectedMutualFriends}
          degree={selectedDegree}
          viewCost={selectedViewCost}
          onNavigateToFriends={() => { setFriendConnectFrom(currentScreen); setCurrentScreen("friendConnect"); }}
          onNavigateToBilling={() => setCurrentScreen("billing")}
        />
      )}

      {currentScreen === "connectorDashboard" && (
        <ConnectorDashboard
          // 주선은 하단 탭(최상단) — 뒤로가기 없음. 하위 화면(리워드/마켓)은 각자 헤더에 back 보유
          onBack={undefined}
          onNavigateToReward={() => setCurrentScreen("matchmakerReward")}
          onNavigateToLeague={() => setCurrentScreen("league")}
          onNavigateToFriends={() => { setFriendConnectFrom(currentScreen); setCurrentScreen("friendConnect"); }}
          onNavigateToMarketplace={() => setCurrentScreen("matchmakerMarketplace")}
          onMemberProfileClick={(userId) => {
            // 1촌 지인 프로필 — degree=1 + 무료 열람. ProfileDetailScreen 의 detailsHidden 룰로 비공개는 자동 hide (ADR 0035).
            setSelectedUserId(userId);
            setSelectedMutualFriends([]);
            setSelectedDegree(1);
            setSelectedViewCost(0);
            setProfileDetailFrom("connectorDashboard");
            setCurrentScreen("profileDetail");
          }}
        />
      )}

      {currentScreen === "matchmakerMarketplace" && (
        <MatchmakerMarketplaceScreen
          onBack={() => setCurrentScreen("connectorDashboard")}
          onViewMatchmaker={(id) => {
            setSelectedMatchmakerId(id);
            setCurrentScreen("matchmakerPublicProfile");
          }}
        />
      )}

      {currentScreen === "matchmakerPublicProfile" && selectedMatchmakerId && (
        <MatchmakerPublicProfileScreen
          matchmakerId={selectedMatchmakerId}
          onBack={() => setCurrentScreen("matchmakerMarketplace")}
          onRequestMatch={(id) => {
            toast.info("매칭 요청 기능은 곧 오픈돼요!");
          }}
        />
      )}

      {currentScreen === "myPage" && (
        <MyPageScreen
          onNavigateToProfile={() => setCurrentScreen("myProfile")}
          onConvertToRegular={handleConvertToRegular}
          onNavigateToFriends={() => { setFriendConnectFrom(currentScreen); setCurrentScreen("friendConnect"); }}
          onNavigateToColor={() => { setColorDetailFrom("myPage"); setCurrentScreen("colorDetail"); }}
          onReanalyze={handleReanalyzeStart}
          onNavigatePrivacy={() => setCurrentScreen("privacyPolicy")}
          onNavigateTerms={() => setCurrentScreen("termsOfService")}
          onNavigateDeleteAccount={() => setCurrentScreen("deleteAccount")}
          onNavigateBilling={() => setCurrentScreen("billing")}
          onLogout={() => {
            localStorage.removeItem(ONBOARDING_DRAFT_KEY);
            localStorage.removeItem(ONBOARDING_STEP_KEY);
            setIsLoggedIn(false);
            setCurrentScreen("login");
          }}
        />
      )}

      {currentScreen === "publicProfile" && <PublicProfileScreen />}

      {currentScreen === "friendConnect" && (
        <FriendConnectScreen onBack={() => setCurrentScreen(friendConnectFrom)} />
      )}

      {currentScreen === "matchmakerReward" && (
        <MatchmakerRewardScreen onBack={() => setCurrentScreen("connectorDashboard")} />
      )}

      {currentScreen === "notifications" && (
        <NotificationScreen
          onBack={() => setCurrentScreen(prevScreen)}
          onOpenMatch={() => {
            // 실제 관계 진행은 인연 탭에서 관리 (matchDetail 스텁은 제거됨)
            setCurrentScreen("introductionHistory");
          }}
        />
      )}

      {currentScreen === "league" && (
        <LeagueScreen onNavigateToMatchmaker={() => setCurrentScreen("connectorDashboard")} />
      )}

      {currentScreen === "aiHub" && (
        <AiHubScreen onProfileClick={(userId) => {
          setSelectedUserId(userId);
          setSelectedMutualFriends([] as MutualFriend[]);
          setSelectedDegree(2);
          setSelectedViewCost(0);
          setProfileDetailFrom("aiHub");
          setCurrentScreen("profileDetail");
        }} />
      )}

      {currentScreen === "designSystem" && (
        <DesignSystemScreen onBack={() => setCurrentScreen("myProfile")} />
      )}

      {currentScreen === "photoVerify" && (
        <PhotoVerifyScreen
          onBack={() => setCurrentScreen("myPage")}
          onComplete={() => {
            setCurrentScreen("myPage");
            toast.success("본인인증이 완료됐어요! 🛡️");
          }}
          userId="me-001"
        />
      )}

      {/* F12: 친구 초대 허브 */}
      {currentScreen === "inviteHub" && (
        <InviteHubScreen onBack={() => setCurrentScreen("myPage")} />
      )}

      {/* F05: 컬러 타입 진단 */}
      {currentScreen === "colorTest" && (
        <ColorTestScreen
          onComplete={(colorType) => {
            setCurrentScreen("myPage");
            toast.success(`나의 컬러 타입: ${colorType} 🎨`);
          }}
          onSkip={() => setCurrentScreen("myPage")}
        />
      )}

      {currentScreen === "colorDetail" && (
        <ColorDetailScreen
          onBack={() => setCurrentScreen(colorDetailFrom)}
          onNavigateToProfile={() => setCurrentScreen("aiProfileEnhance")}
        />
      )}

      {currentScreen === "privacyPolicy" && (
        <PrivacyPolicyScreen onBack={() => setCurrentScreen("myPage")} />
      )}

      {currentScreen === "termsOfService" && (
        <TermsOfServiceScreen onBack={() => setCurrentScreen("myPage")} />
      )}

      {currentScreen === "billing" && (
        <BillingScreen onBack={() => setCurrentScreen("myPage")} />
      )}

      {currentScreen === "paymentSuccess" && (
        <PaymentSuccessScreen
          onDone={() => {
            // URL 정리 (사용자가 새로고침해도 재confirm 시도 X)
            try { window.history.replaceState({}, "", "/"); } catch {}
            setCurrentScreen(isLoggedIn ? "billing" : "login");
          }}
        />
      )}

      {currentScreen === "paymentFail" && (
        <PaymentFailScreen
          onDone={() => {
            try { window.history.replaceState({}, "", "/"); } catch {}
            setCurrentScreen(isLoggedIn ? "billing" : "login");
          }}
        />
      )}

      {currentScreen === "inviteWizard" && (
        <InviteWizardScreen
          onSkip={() => setCurrentScreen("mainFeed")}
          onDone={() => setCurrentScreen("mainFeed")}
        />
      )}

      {currentScreen === "deleteAccount" && (
        <DeleteAccountScreen
          onBack={() => setCurrentScreen("myPage")}
          onCompleted={() => {
            localStorage.removeItem(ONBOARDING_DRAFT_KEY);
            localStorage.removeItem(ONBOARDING_STEP_KEY);
            setIsLoggedIn(false);
            setCurrentScreen("login");
          }}
        />
      )}
      </Suspense>

      {/* Bottom Navigation - Only show when logged in and not on login/onboarding/detail screens */}
      {isLoggedIn && !["login", "emailLogin", "emailSignup", "matchmakerSignup", "oauth2Redirect", "requiredInfo", "accountTypeSelection", "pendingApproval", "basicInfo", "photoUpload", "aiInterview", "lifestyle", "idealType", "aiProfileEnhance", "profileEdit", "profileDetail", "publicProfile", "friendConnect", "matchmakerReward", "league", "photoVerify", "colorTest", "colorDetail", "inviteHub", "privacyPolicy", "termsOfService", "deleteAccount", "billing", "inviteWizard", "paymentSuccess", "paymentFail"].includes(currentScreen) && (
        <BottomNavigation
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          accountType={userAccountType}
        />
      )}

      {/* 승인 완료 축하 — 새로고침으로 ACTIVE 확인 시 (ADR 0062) */}
      <Dialog open={approvalCelebration !== null} onOpenChange={(open) => { if (!open) setApprovalCelebration(null); }}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader className="items-center">
            <div className="w-16 h-16 rounded-full bg-brand-soft flex items-center justify-center mb-2">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <DialogTitle className="text-center">승인 축하드려요! 🎉</DialogTitle>
            <DialogDescription className="text-center">
              프로필 심사가 완료됐어요. 이제부터 팔레트의 모든 기능을 사용할 수 있어요.
              마음에 드는 인연을 찾아보세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              className="w-full h-12"
              onClick={() => {
                const target = approvalCelebration;
                setApprovalCelebration(null);
                if (target) setCurrentScreen(target);
              }}
            >
              팔레트 시작하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-center" />
    </div>
  );
}

function BottomNavigation({
  currentScreen,
  onNavigate,
  accountType,
}: {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  accountType?: "REGULAR" | "MATCHMAKER_ONLY";
}) {
  // ADR 0014: MATCHMAKER_ONLY 는 일반 데이팅 흐름(홈/소개) 안 씀 → 2탭 단순화
  const tabs: { screen: Screen; icon: React.ElementType; label: string; matchScreens?: Screen[] }[] =
    accountType === "MATCHMAKER_ONLY"
      ? [
          { screen: "connectorDashboard", icon: Waypoints, label: "주선 대시보드" },
          { screen: "myPage", icon: User, label: "나", matchScreens: ["myPage", "myProfile"] },
        ]
      : [
          { screen: "mainFeed", icon: Home, label: "홈" },
          { screen: "introductionHistory", icon: Heart, label: "인연" },
          { screen: "connectorDashboard", icon: Waypoints, label: "주선" },
          { screen: "myPage", icon: User, label: "나", matchScreens: ["myPage", "myProfile"] },
        ];

  return (
    // sticky (not fixed): 모바일 프레임(.app-frame)이 transform+overflow 스크롤 컨테이너라
    // fixed 자식은 콘텐츠에 묶여 같이 스크롤됨("딸려 올라감"). sticky 는 스크롤포트 하단에
    // 고정되어 모바일 뷰포트/데스크탑 프레임 두 모드 모두 정상 (ADR 0063).
    <div
      className="sticky bottom-0 left-0 right-0 z-30"
      style={{
        background: "hsl(var(--surface) / 0.92)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 -1px 0 hsl(0 0% 0% / 0.06), 0 -4px 16px hsl(0 0% 0% / 0.04)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-around h-[60px] px-2">
        {tabs.map(({ screen, icon: Icon, label, matchScreens }) => {
          const active = (matchScreens ?? [screen]).includes(currentScreen as Screen);
          return (
            <button
              key={screen}
              onClick={() => onNavigate(screen)}
              className="flex flex-col items-center justify-center gap-0 px-3 py-1.5 min-w-[52px] transition-all"
            >
              <div
                className="w-11 h-7 rounded-full flex items-center justify-center transition-all duration-200"
                style={active ? { background: "hsl(var(--brand) / 0.16)" } : undefined}
              >
                <Icon
                  className="w-[19px] h-[19px] transition-colors duration-200"
                  style={{ color: active ? "hsl(var(--brand))" : "hsl(var(--text-tertiary))" }}
                  strokeWidth={active ? 2.4 : 2}
                />
              </div>
              <span
                className="text-xs transition-colors duration-200 mt-0.5"
                style={{
                  color: active ? "hsl(var(--brand))" : "hsl(var(--text-tertiary))",
                  fontWeight: active ? 700 : 500,
                }}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}