import { useState, useEffect, useCallback } from "react";
import { BetaGateScreen, hasBetaPassed } from "./components/BetaGateScreen";
import { BetaWelcomeIntro, hasIntroSeen } from "./components/BetaWelcomeIntro";
import { LoginScreen } from "./components/LoginScreen";
import { EmailLoginScreen } from "./components/EmailLoginScreen";
import { EmailSignupScreen } from "./components/EmailSignupScreen";
import { MatchmakerSignupScreen } from "./components/MatchmakerSignupScreen";
// MatchmakerInfoScreen 은 ADR 0013 에서 제거됨 — 회원가입 데이터로 충분
import { OAuth2RedirectHandler } from "./components/OAuth2RedirectHandler";
import { RequiredInfoScreen } from "./components/RequiredInfoScreen";
import { AccountTypeSelectionScreen } from "./components/AccountTypeSelectionScreen";
import { BasicInfoScreen } from "./components/BasicInfoScreen";
import { PhotoUploadScreen } from "./components/PhotoUploadScreen";
import { AboutMeScreen } from "./components/AboutMeScreen";
import { IdealTypeScreen } from "./components/IdealTypeScreen";
import { AIProfileEnhanceScreen } from "./components/AIProfileEnhanceScreen";
import { AIInterviewScreen } from "./components/AIInterviewScreen";
import { IntroMethodSelectionScreen } from "./components/IntroMethodSelectionScreen";
import { MyProfileScreen } from "./components/MyProfileScreen";
import { ProfileEditScreen } from "./components/ProfileEditScreen";
import { ProfileDetailScreen } from "./components/ProfileDetailScreen";
import { MainFeedScreen, type MutualFriend } from "./components/MainFeedScreen";
import { IntroductionHistoryScreen } from "./components/IntroductionHistoryScreen";
import { ConnectorDashboard } from "./components/ConnectorDashboard";
import { MatchmakerMarketplaceScreen } from "./components/MatchmakerMarketplaceScreen";
import { MatchmakerPublicProfileScreen } from "./components/MatchmakerPublicProfileScreen";
import { DesignSystemScreen } from "./components/DesignSystemScreen";
import { MyPageScreen } from "./components/MyPageScreen";
import { PublicProfileScreen } from "./components/PublicProfileScreen";
import { FriendConnectScreen } from "./components/FriendConnectScreen";
import { MatchmakerRewardScreen } from "./components/MatchmakerRewardScreen";
import { NotificationScreen } from "./components/NotificationScreen";
import { LeagueScreen } from "./components/LeagueScreen";
import { AiHubScreen } from "./components/AiHubScreen";
import { MatchDetailScreen } from "./components/MatchDetailScreen";
import { PhotoVerifyScreen } from "./components/PhotoVerifyScreen";
import { ColorTestScreen } from "./components/ColorTestScreen";
import { InviteHubScreen } from "./components/invite/InviteHubScreen";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Home, User, Clock, Trophy, Sparkles, Heart } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../lib/auth/authService";
import { tokenStorage } from "../lib/auth/tokenStorage";
import { api } from "../lib/api/apiClient";

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
  | "introMethodSelection"
  | "aboutMe"
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
  | "matchDetail"
  | "photoVerify"
  | "colorTest"
  | "inviteHub";

const ONBOARDING_DRAFT_KEY = "palette_onboarding_draft";
const ONBOARDING_STEP_KEY = "palette_onboarding_step";
const ONBOARDING_SCREENS: Screen[] = ["basicInfo", "photoUpload", "introMethodSelection", "aboutMe", "aiInterview", "idealType", "aiProfileEnhance"];
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

/** Apply brand color from HSL values to all relevant CSS custom properties */
function applyBrandFromHsl(h: number, s: number, l: number, hex?: string) {
  const root = document.documentElement;
  const softL = Math.min(Math.max(l + 35, 90), 97);
  const fgLight = l > 62 ? '0 0% 10%' : '0 0% 100%';
  // shadcn/ui primary (hex-based, derive if not provided)
  if (hex) {
    root.style.setProperty('--primary', hex);
    root.style.setProperty('--ring', hex);
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const bv = parseInt(hex.slice(5, 7), 16) / 255;
    const luminance = 0.299 * r + 0.587 * g + 0.114 * bv;
    root.style.setProperty('--primary-foreground', luminance > 0.62 ? '#1A1916' : '#FFFFFF');
  }
  // --brand (HSL triplet: "h s% l%") used by BottomNavigation, brand buttons, etc.
  root.style.setProperty('--brand', `${h} ${s}% ${l}%`);
  root.style.setProperty('--brand-foreground', fgLight);
  root.style.setProperty('--brand-soft', `${h} ${s}% ${softL}%`);
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

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
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
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [selectedMutualFriends, setSelectedMutualFriends] = useState<MutualFriend[]>([]);
  const [selectedDegree, setSelectedDegree] = useState<number>(2);
  const [selectedViewCost, setSelectedViewCost] = useState<number>(3000);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [introMethod, setIntroMethod] = useState<"INTERVIEW" | "MANUAL">("INTERVIEW");
  const [prevScreen, setPrevScreen] = useState<Screen>("mainFeed");
  const [selectedMatchmakerId, setSelectedMatchmakerId] = useState<string | undefined>(undefined);
  const [selectedMatchId, setSelectedMatchId] = useState<string>("match-001");
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
            const acctType = (user as { accountType?: string }).accountType as "REGULAR" | "MATCHMAKER_ONLY" | undefined;
            setUserAccountType(acctType);
            // If profile is completed, go to main feed, otherwise restore or start onboarding
            // ADR 0014: MATCHMAKER_ONLY 는 mainFeed 가 아닌 ConnectorDashboard 로
            if (user.isProfileCompleted) {
              setCurrentScreen(acctType === "MATCHMAKER_ONLY" ? "connectorDashboard" : "mainFeed");
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
    }));
    setUserGender(data.basicInfo.gender); // Store gender for profile editing later
    setCurrentScreen("photoUpload");
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
    setCurrentScreen("introMethodSelection");
  };

  const handleAIInterviewComplete = (answers: Record<string, string>) => {
    setProfileData(prev => ({
      ...prev,
      introduction: {
        ...prev.introduction,
        interviewAnswers: answers,
      },
    }));
    setCurrentScreen("idealType");
  };

  const handleIntroMethodAIInterview = () => {
    setIntroMethod("INTERVIEW");
    setCurrentScreen("aiInterview");
  };

  const handleIntroMethodManual = () => {
    setIntroMethod("MANUAL");
    setCurrentScreen("aboutMe");
  };

  const handlePhotoBack = () => {
    setCurrentScreen("basicInfo");
  };

  const handleAboutMeNext = (data: any) => {
    setProfileData(prev => ({
      ...prev,
      introduction: {
        ...prev.introduction,
        interviewAnswers: data.introduction?.interviewAnswers ?? {},
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
    setCurrentScreen("aiProfileEnhance");
  };

  const handleAIProfileComplete = async (result: { colorType: string; colorName: string; colorHex: string; colorDescription: string; generatedIntroduction: string }) => {
    try {
      // colorType 저장
      try {
        await api.post("/api/v1/ai-interview/complete", { colorType: result.colorType });
      } catch (e) {
        console.warn("컬러 타입 저장 실패 (무시하고 계속)", e);
      }

      // 프로필 생성 또는 업데이트

      // Convert form data to API format
      const bodyTypeMap: { [key: string]: string } = {
        '슬림': 'SLIM',
        '보통': 'AVERAGE',
        '탄탄': 'ATHLETIC',
        '건장': 'MUSCULAR',
        '풍만': 'CURVY',
      };

      const jobCategoryMap: { [key: string]: string } = {
        'IT/개발': 'IT_DEVELOPMENT',
        '금융/보험': 'FINANCE',
        '교육': 'EDUCATION',
        '의료/보건': 'MEDICAL',
        '미디어/엔터': 'MEDIA',
        '서비스/영업': 'SERVICE',
        '제조/생산': 'MANUFACTURING',
        '공무원/공공기관': 'PUBLIC_OFFICIAL',
        '전문직': 'PROFESSIONAL',
        '기타': 'OTHER',
      };

      const educationMap: { [key: string]: string } = {
        '고졸': 'HIGH_SCHOOL',
        '전문대': 'ASSOCIATE',
        '대졸': 'BACHELOR',
        '석사': 'MASTER',
        '박사': 'DOCTORATE',
      };

      const frequencyMap: { [key: string]: string } = {
        '비흡연': 'NEVER',
        '가끔': 'SOMETIMES',
        '자주': 'OFTEN',
        '안마심': 'NEVER',
      };

      const religionMap: { [key: string]: string } = {
        '무교': 'NONE',
        '기독교': 'CHRISTIANITY',
        '천주교': 'CATHOLICISM',
        '불교': 'BUDDHISM',
        '기타': 'OTHER',
      };

      const datePreferenceMap: { [key: string]: string } = {
        'active': 'ACTIVE',
        'indoor': 'INDOOR',
        'culture': 'CULTURE',
        'nature': 'NATURE',
      };

      const importantValueMap: { [key: string]: string } = {
        '성격/성향': 'PERSONALITY',
        '외모': 'APPEARANCE',
        '학력': 'EDUCATION',
        '능력/커리어': 'CAREER',
        '집안/가족': 'FAMILY',
        '직업': 'JOB',
        '경제력': 'WEALTH',
        '가치관': 'VALUES',
      };

      const appearanceStyleMap: { [key: string]: string } = {
        '강아지상': 'PUPPY',
        '고양이상': 'CAT',
        '토끼상': 'RABBIT',
        '여우상': 'FOX',
        '사슴상': 'DEER',
        '두부상': 'TOFU',
        '순두부상': 'SOFT_TOFU',
        '아랍상': 'ARAB',
        '일진상': 'BOSS',
        '상견례입구컷상': 'MOTHER_IN_LAW_APPROVED',
        '전교회장상': 'STUDENT_COUNCIL',
        '체대상': 'ATHLETIC',
        '너드상': 'NERD',
        '공룡상': 'DINOSAUR',
      };

      const apiData = {
        basicInfo: {
          height: profileData.basicInfo.height || null,
          bodyType: profileData.basicInfo.bodyType ? bodyTypeMap[profileData.basicInfo.bodyType] : null,
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
          smoking: profileData.lifestyleInfo.smoking ? frequencyMap[profileData.lifestyleInfo.smoking] || null : null,
          drinking: profileData.lifestyleInfo.drinking ? frequencyMap[profileData.lifestyleInfo.drinking] || null : null,
          religion: profileData.lifestyleInfo.religion ? religionMap[profileData.lifestyleInfo.religion] || null : null,
        },
        introduction: {
          text: result.generatedIntroduction || profileData.introduction.text || null,
          interests: profileData.introduction.interests || [],
          interviewAnswers: profileData.introduction.interviewAnswers || null,
        },
        idealType: {
          datePreferences: (profileData.idealType.datePreferences || []).map(
            pref => datePreferenceMap[pref] || pref
          ),
          importantValues: (profileData.idealType.importantValues || []).map(
            val => importantValueMap[val] || val
          ),
          personalities: profileData.idealType.personalities || [],
          appearanceStyles: (profileData.idealType.appearanceStyles || []).map(
            style => appearanceStyleMap[style] || style
          ),
          dealBreakers: profileData.idealType.dealBreakers || [],
        },
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
      setCurrentScreen("mainFeed");
      toast.success("프로필이 성공적으로 생성되었습니다!");
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

  const handleProfileEditSave = () => {
    setProfileRefreshKey(prev => prev + 1); // Force MyProfileScreen to remount
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
        const acctType = (user as { accountType?: string }).accountType as "REGULAR" | "MATCHMAKER_ONLY" | undefined;
        setUserAccountType(acctType);
        if (user.isProfileCompleted) {
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
        toast.success("환영합니다!");
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
    setSelectedViewCost(item.viewCost ?? 3000);
    setCurrentScreen("profileDetail");
  };

  const handleProfileDetailBack = () => {
    setCurrentScreen("mainFeed");
  };

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
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
      {currentScreen === "login" && (
        <LoginScreen
          onEmailLogin={handleEmailLogin}
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
      
      {currentScreen === "introMethodSelection" && (
        <IntroMethodSelectionScreen
          onSelectAIInterview={handleIntroMethodAIInterview}
          onSelectManual={handleIntroMethodManual}
          onBack={() => setCurrentScreen("photoUpload")}
        />
      )}

      {currentScreen === "aiInterview" && (
        <AIInterviewScreen
          onComplete={handleAIInterviewComplete}
          onBack={() => setCurrentScreen("introMethodSelection")}
        />
      )}

{currentScreen === "aboutMe" && (
        <AboutMeScreen
          onNext={handleAboutMeNext}
          onBack={() => setCurrentScreen("introMethodSelection")}
          initialData={{
            introduction: profileData.introduction,
            lifestyleInfo: profileData.lifestyleInfo,
          }}
        />
      )}
      
      {currentScreen === "idealType" && (
        <IdealTypeScreen
          onNext={handleIdealTypeNext}
          onBack={() => introMethod === "INTERVIEW" ? setCurrentScreen("aiInterview") : setCurrentScreen("aboutMe")}
          initialData={{
            idealType: profileData.idealType,
          }}
          userGender={profileData.basicInfo.gender}
        />
      )}
      
      {currentScreen === "aiProfileEnhance" && (
        <AIProfileEnhanceScreen
          onComplete={handleAIProfileComplete}
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
          onNavigateToFriends={() => setCurrentScreen("friendConnect")}
          unreadNotifications={unreadNotificationCount}
        />
      )}

      {currentScreen === "introductionHistory" && (
        <IntroductionHistoryScreen onBack={() => setCurrentScreen("mainFeed")} />
      )}

      {currentScreen === "profileDetail" && selectedUserId && (
        <ProfileDetailScreen
          userId={selectedUserId}
          onBack={handleProfileDetailBack}
          mutualFriends={selectedMutualFriends}
          degree={selectedDegree}
          viewCost={selectedViewCost}
          onNavigateToFriends={() => setCurrentScreen("friendConnect")}
        />
      )}

      {currentScreen === "connectorDashboard" && (
        <ConnectorDashboard
          onBack={handleConnectorDashboardBack}
          onNavigateToReward={() => setCurrentScreen("matchmakerReward")}
          onNavigateToFriends={() => setCurrentScreen("friendConnect")}
          onNavigateToMarketplace={() => setCurrentScreen("matchmakerMarketplace")}
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
          onNavigateToConnector={() => setCurrentScreen("connectorDashboard")}
          onConvertToRegular={handleConvertToRegular}
          onNavigateToFriends={() => setCurrentScreen("friendConnect")}
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
        <FriendConnectScreen onBack={() => setCurrentScreen("myPage")} />
      )}

      {currentScreen === "matchmakerReward" && (
        <MatchmakerRewardScreen onBack={() => setCurrentScreen("connectorDashboard")} />
      )}

      {currentScreen === "notifications" && (
        <NotificationScreen
          onBack={() => setCurrentScreen(prevScreen)}
          onOpenMatch={(matchId) => {
            setSelectedMatchId(matchId);
            setCurrentScreen("matchDetail");
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
          setCurrentScreen("profileDetail");
        }} />
      )}

      {currentScreen === "designSystem" && (
        <DesignSystemScreen onBack={() => setCurrentScreen("myProfile")} />
      )}

      {/* F01~F04: 매칭 상세 / 사진 인증 */}
      {currentScreen === "matchDetail" && (
        <MatchDetailScreen
          matchId={selectedMatchId}
          onBack={() => setCurrentScreen("mainFeed")}
        />
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

      {/* Bottom Navigation - Only show when logged in and not on login/onboarding/detail screens */}
      {isLoggedIn && !["login", "emailLogin", "emailSignup", "matchmakerSignup", "oauth2Redirect", "requiredInfo", "accountTypeSelection", "basicInfo", "photoUpload", "introMethodSelection", "aboutMe", "aiInterview", "idealType", "aiProfileEnhance", "profileEdit", "profileDetail", "publicProfile", "friendConnect", "matchmakerReward", "matchDetail", "photoVerify", "colorTest", "inviteHub"].includes(currentScreen) && (
        <BottomNavigation
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          accountType={userAccountType}
        />
      )}

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
          { screen: "connectorDashboard", icon: Heart, label: "주선 대시보드" },
          { screen: "myPage", icon: User, label: "나", matchScreens: ["myPage", "myProfile"] },
        ]
      : [
          { screen: "mainFeed", icon: Home, label: "홈" },
          { screen: "introductionHistory", icon: Clock, label: "소개" },
          { screen: "connectorDashboard", icon: Heart, label: "주선" },
          { screen: "myPage", icon: User, label: "나", matchScreens: ["myPage", "myProfile"] },
        ];

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-30 safe-area-inset-bottom"
      style={{
        background: "hsl(var(--surface) / 0.92)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 -1px 0 hsl(0 0% 0% / 0.06), 0 -4px 16px hsl(0 0% 0% / 0.04)",
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
                className="w-8 h-6 rounded-xl flex items-center justify-center transition-all duration-200"
                style={active ? { background: "hsl(var(--brand) / 0.10)" } : undefined}
              >
                <Icon
                  className="w-[18px] h-[18px] transition-colors duration-200"
                  style={{ color: active ? "hsl(var(--brand))" : "hsl(var(--text-tertiary))" }}
                />
              </div>
              <span
                className="text-[10px] font-medium transition-colors duration-200"
                style={{ color: active ? "hsl(var(--brand))" : "hsl(var(--text-tertiary))" }}
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