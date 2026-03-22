import { useState, useEffect } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { EmailLoginScreen } from "./components/EmailLoginScreen";
import { EmailSignupScreen } from "./components/EmailSignupScreen";
import { MatchmakerSignupScreen } from "./components/MatchmakerSignupScreen";
import { MatchmakerInfoScreen } from "./components/MatchmakerInfoScreen";
import { OAuth2RedirectHandler } from "./components/OAuth2RedirectHandler";
import { RequiredInfoScreen } from "./components/RequiredInfoScreen";
import { AccountTypeSelectionScreen } from "./components/AccountTypeSelectionScreen";
import { BasicInfoScreen } from "./components/BasicInfoScreen";
import { PhotoUploadScreen } from "./components/PhotoUploadScreen";
import { AboutMeScreen } from "./components/AboutMeScreen";
import { IdealTypeScreen } from "./components/IdealTypeScreen";
import { AIProfileEnhanceScreen } from "./components/AIProfileEnhanceScreen";
import { AIInterviewScreen } from "./components/AIInterviewScreen";
import { ColorTypeResultScreen } from "./components/ColorTypeResultScreen";
import { MyProfileScreen } from "./components/MyProfileScreen";
import { ProfileEditScreen } from "./components/ProfileEditScreen";
import { ProfileDetailScreen } from "./components/ProfileDetailScreen";
import { MainFeedScreen } from "./components/MainFeedScreen";
import { IntroductionHistoryScreen } from "./components/IntroductionHistoryScreen";
import { ConnectorDashboard } from "./components/ConnectorDashboard";
import { MyPageScreen } from "./components/MyPageScreen";
import { PublicProfileScreen } from "./components/PublicProfileScreen";
import { PromptManagementScreen } from "./components/PromptManagementScreen";
import { FriendConnectScreen } from "./components/FriendConnectScreen";
import { MatchmakerRewardScreen } from "./components/MatchmakerRewardScreen";
import { NotificationScreen } from "./components/NotificationScreen";
import { LeagueScreen } from "./components/LeagueScreen";
import { AiHubScreen } from "./components/AiHubScreen";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Home, User, Clock, Bell, Trophy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../lib/auth/authService";
import { tokenStorage } from "../lib/auth/tokenStorage";
import { api } from "../lib/api/apiClient";

type Screen =
  | "login"
  | "emailLogin"
  | "emailSignup"
  | "matchmakerSignup"
  | "matchmakerInfo"
  | "oauth2Redirect"
  | "requiredInfo"
  | "accountTypeSelection"
  | "basicInfo"
  | "photoUpload"
  | "aboutMe"
  | "idealType"
  | "aiProfileEnhance"
  | "aiInterview"
  | "colorTypeResult"
  | "myProfile"
  | "profileEdit"
  | "profileDetail"
  | "mainFeed"
  | "introductionHistory"
  | "connectorDashboard"
  | "myPage"
  | "publicProfile"
  | "promptManagement"
  | "friendConnect"
  | "matchmakerReward"
  | "notifications"
  | "league"
  | "aiHub";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [missingRequiredFields, setMissingRequiredFields] = useState<string[]>([]);
  const [isConvertingToRegular, setIsConvertingToRegular] = useState(false);
  const [userGender, setUserGender] = useState<string | undefined>(undefined);
  const [profileRefreshKey, setProfileRefreshKey] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [selectedMutualFriends, setSelectedMutualFriends] = useState<string[]>([]);
  const [selectedDegree, setSelectedDegree] = useState<number>(2);
  const [selectedViewCost, setSelectedViewCost] = useState<number>(3000);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [colorTypeResult, setColorTypeResult] = useState<{
    colorType: string;
    colorName: string;
    colorHex: string;
    colorDescription: string;
    generatedIntroduction: string;
  } | null>(null);

  // Profile data collected during registration
  const [profileData, setProfileData] = useState({
    basicInfo: {
      name: "",
      birthYear: "",
      birthMonth: "",
      birthDay: "",
      gender: "",
      height: 170,
      bodyType: "",
    },
    careerInfo: {
      category: "",
      company: "",
      position: "",
    },
    educationInfo: {
      level: "",
      school: "",
      major: "",
    },
    locationInfo: {
      region: "",
      district: "",
    },
    photos: [] as string[],
    mainPhotoIndex: 0,
    video: null as string | null,
    introduction: {
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
    lifestyleInfo: {
      smoking: "",
      drinking: "",
      religion: "",
    },
    idealType: {
      ageMin: null as number | null,
      ageMax: null as number | null,
      heightMin: null as number | null,
      heightMax: null as number | null,
      bodyTypes: [] as string[],
      personalities: [] as string[],
      dateStyle: "",
      purpose: "",
      dealBreakers: "",
    },
  });

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
            // If profile is completed, go to main feed, otherwise start onboarding
            if (user.isProfileCompleted) {
              setCurrentScreen("mainFeed");
            } else {
              setCurrentScreen("basicInfo");
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

  // Apply user's color type as app primary color
  useEffect(() => {
    if (!isLoggedIn) return;
    api.get<any>('/api/v1/profile').then(p => {
      const hex = p?.colorType?.hex;
      if (!hex || !/^#[0-9A-Fa-f]{6}$/.test(hex)) return;
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
      const fg = luminance > 0.62 ? '#1A1916' : '#FFFFFF';
      const root = document.documentElement;
      root.style.setProperty('--primary', hex);
      root.style.setProperty('--primary-foreground', fg);
      root.style.setProperty('--ring', hex);
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

    // If new user, go to account type selection
    if (isNewUser) {
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
      // 주선자 전용: 정보 입력 화면으로 이동
      setCurrentScreen("matchmakerInfo");
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
    setCurrentScreen("aiInterview");
  };

  const handleAIInterviewComplete = (result: any, answers: Record<string, string>) => {
    setColorTypeResult(result);
    // 인터뷰 답변을 introduction에 매핑
    setProfileData(prev => ({
      ...prev,
      introduction: {
        ...prev.introduction,
        text: result.generatedIntroduction,
        interviewAnswers: {
          hobby: answers.weekend || "",
          charm: answers.personality || "",
          passion: answers.passion || "",
          happiness: answers.happiness || "",
          motto: answers.motto || "",
        },
      },
    }));
    setCurrentScreen("colorTypeResult");
  };

  const handlePhotoBack = () => {
    setCurrentScreen("basicInfo");
  };

  const handleAboutMeNext = (data: any) => {
    setProfileData(prev => ({
      ...prev,
      introduction: data.introduction,
      lifestyleInfo: data.lifestyleInfo || prev.lifestyleInfo,
    }));
    setCurrentScreen("idealType");
  };

  const handleColorTypeResultContinue = async () => {
    // 컬러 타입을 백엔드에 저장
    if (colorTypeResult) {
      try {
        await api.post("/api/v1/ai-interview/complete", {
          colorType: colorTypeResult.colorType,
          answers: {},
        });
      } catch (e) {
        console.warn("컬러 타입 저장 실패 (무시하고 계속)", e);
      }
    }
    setCurrentScreen("idealType");
  };

  const handleIdealTypeNext = (data: any) => {
    setProfileData(prev => ({
      ...prev,
      idealType: data.idealType,
    }));
    setCurrentScreen("aiProfileEnhance");
  };

  const handleAIProfileComplete = async () => {
    try {
      // 프로필 생성 또는 업데이트
      console.log('Creating/updating profile with data:', profileData);

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
          text: profileData.introduction.text || null,
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
      console.log('Profile saved successfully');

      // 전환 중이었다면 실제로 전환 API 호출
      if (isConvertingToRegular) {
        console.log('Converting to regular user...');
        await api.patch('/api/v1/auth/convert-to-regular');
        console.log('Conversion successful');
        setIsConvertingToRegular(false);
        toast.success("일반 회원으로 전환되었습니다!");
      }

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
    setCurrentScreen("myPage");
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
    // 즉시 전환하지 않고, 프로필 작성 시작만 표시
    setIsConvertingToRegular(true);
    toast.info("프로필을 작성하면 일반 회원으로 전환됩니다");
    setCurrentScreen("basicInfo");
  };

  const handleEmailLogin = () => {
    setCurrentScreen("emailLogin");
  };

  const handleEmailSignup = () => {
    setCurrentScreen("emailSignup");
  };

  const handleEmailAuthSuccess = async () => {
    console.log('handleEmailAuthSuccess called');
    setIsLoggedIn(true);

    try {
      const user = await authService.getCurrentUser();
      console.log('User fetched:', user);

      if (user) {
        setUserGender(user.gender); // Store user gender
        if (user.isProfileCompleted) {
          console.log('Profile completed, going to mainFeed');
          setCurrentScreen("mainFeed");
          toast.success("로그인되었습니다!");
        } else {
          console.log('Profile not completed, going to accountTypeSelection');
          setCurrentScreen("accountTypeSelection");
          toast.success("환영합니다! 계정 유형을 선택해주세요");
        }
      } else {
        console.log('No user found, going to accountTypeSelection');
        setCurrentScreen("accountTypeSelection");
        toast.info("계정 설정을 완료해주세요");
      }
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
    console.log('handleMatchmakerSignupSuccess called');
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

  const handleMatchmakerInfoComplete = async () => {
    console.log('handleMatchmakerInfoComplete called');

    try {
      // 주선자 정보 입력 완료 후 주선자 대시보드로 이동
      setCurrentScreen("connectorDashboard");
      toast.success("주선자 등록이 완료되었습니다!");
    } catch (error) {
      console.error('Error after matchmaker info complete:', error);
      setCurrentScreen("connectorDashboard");
    }
  };

  const handleProfileClick = (item: any) => {
    setSelectedUserId(item.profile.userId);
    setSelectedMutualFriends(item.mutualFriends || []);
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

  return (
    <div className="min-h-screen bg-background">
      {currentScreen === "login" && (
        <LoginScreen
          onEmailLogin={handleEmailLogin}
          onMatchmakerSignup={() => setCurrentScreen("matchmakerSignup")}
        />
      )}

      {currentScreen === "emailLogin" && (
        <EmailLoginScreen
          onSuccess={handleEmailAuthSuccess}
          onBackToLogin={handleBackToLogin}
          onGoToSignup={handleEmailSignup}
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

      {currentScreen === "matchmakerInfo" && (
        <MatchmakerInfoScreen
          onBack={() => setCurrentScreen("accountTypeSelection")}
          onComplete={handleMatchmakerInfoComplete}
        />
      )}

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
        <AccountTypeSelectionScreen onComplete={handleAccountTypeSelection} />
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
          onBack={() => setCurrentScreen("photoUpload")}
        />
      )}

      {currentScreen === "colorTypeResult" && colorTypeResult && (
        <ColorTypeResultScreen
          colorType={colorTypeResult.colorType}
          colorName={colorTypeResult.colorName}
          colorHex={colorTypeResult.colorHex}
          colorDescription={colorTypeResult.colorDescription}
          generatedIntroduction={colorTypeResult.generatedIntroduction}
          onContinue={handleColorTypeResultContinue}
        />
      )}

      {currentScreen === "aboutMe" && (
        <AboutMeScreen
          onNext={handleAboutMeNext}
          initialData={{
            introduction: profileData.introduction,
          }}
        />
      )}
      
      {currentScreen === "idealType" && (
        <IdealTypeScreen
          onNext={handleIdealTypeNext}
          initialData={{
            idealType: profileData.idealType,
          }}
          userGender={profileData.basicInfo.gender}
        />
      )}
      
      {currentScreen === "aiProfileEnhance" && (
        <AIProfileEnhanceScreen
          onComplete={handleAIProfileComplete}
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
          onNotificationClick={() => setCurrentScreen("notifications")}
          unreadNotifications={unreadNotificationCount}
        />
      )}

      {currentScreen === "introductionHistory" && <IntroductionHistoryScreen />}

      {currentScreen === "profileDetail" && selectedUserId && (
        <ProfileDetailScreen
          userId={selectedUserId}
          onBack={handleProfileDetailBack}
          mutualFriends={selectedMutualFriends}
          degree={selectedDegree}
          viewCost={selectedViewCost}
        />
      )}

      {currentScreen === "connectorDashboard" && (
        <ConnectorDashboard
          onBack={handleConnectorDashboardBack}
          onNavigateToReward={() => setCurrentScreen("matchmakerReward")}
        />
      )}

      {currentScreen === "myPage" && (
        <MyPageScreen
          onNavigateToProfile={() => setCurrentScreen("myProfile")}
          onNavigateToConnector={() => setCurrentScreen("connectorDashboard")}
          onConvertToRegular={handleConvertToRegular}
          onNavigateToPromptManagement={() => setCurrentScreen("promptManagement")}
          onNavigateToFriends={() => setCurrentScreen("friendConnect")}
          onLogout={() => {
            setIsLoggedIn(false);
            setCurrentScreen("login");
          }}
        />
      )}

      {currentScreen === "publicProfile" && <PublicProfileScreen />}

      {currentScreen === "promptManagement" && <PromptManagementScreen />}

      {currentScreen === "friendConnect" && (
        <FriendConnectScreen onBack={() => setCurrentScreen("myPage")} />
      )}

      {currentScreen === "matchmakerReward" && (
        <MatchmakerRewardScreen onBack={() => setCurrentScreen("connectorDashboard")} />
      )}

      {currentScreen === "notifications" && (
        <NotificationScreen
          onBack={() => setCurrentScreen("mainFeed")}
        />
      )}

      {currentScreen === "league" && <LeagueScreen />}

      {currentScreen === "aiHub" && (
        <AiHubScreen onProfileClick={(userId) => {
          setSelectedUserId(userId);
          setCurrentScreen("profileDetail");
        }} />
      )}

      {/* Bottom Navigation - Only show when logged in and not on login/onboarding/detail screens */}
      {isLoggedIn && !["login", "emailLogin", "emailSignup", "matchmakerSignup", "matchmakerInfo", "oauth2Redirect", "requiredInfo", "accountTypeSelection", "basicInfo", "photoUpload", "aboutMe", "aiInterview", "colorTypeResult", "idealType", "aiProfileEnhance", "profileEdit", "profileDetail", "publicProfile", "friendConnect", "matchmakerReward", "notifications"].includes(currentScreen) && (
        <BottomNavigation
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
          unreadNotifications={unreadNotificationCount}
        />
      )}

      <Toaster position="top-center" />
    </div>
  );
}

function BottomNavigation({
  currentScreen,
  onNavigate,
  unreadNotifications = 0,
}: {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  unreadNotifications?: number;
}) {
  const tabs: { screen: Screen; icon: React.ElementType; label: string; badge?: number; matchScreens?: Screen[] }[] = [
    { screen: "mainFeed", icon: Home, label: "홈" },
    { screen: "aiHub", icon: Sparkles, label: "AI" },
    { screen: "introductionHistory", icon: Clock, label: "소개" },
    { screen: "league", icon: Trophy, label: "리그" },
    { screen: "myPage", icon: User, label: "나", matchScreens: ["myPage", "myProfile", "connectorDashboard"] },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-xl border-t border-border/60 z-30 safe-area-inset-bottom">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-[60px] px-2">
        {tabs.map(({ screen, icon: Icon, label, badge, matchScreens }) => {
          const active = (matchScreens ?? [screen]).includes(currentScreen as Screen);
          return (
            <button
              key={screen}
              onClick={() => onNavigate(screen)}
              className="flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 min-w-[52px] transition-all"
            >
              <div className={`relative w-9 h-9 rounded-2xl flex items-center justify-center transition-all duration-200 ${active ? "bg-primary/10" : ""}`}>
                <Icon className={`w-[18px] h-[18px] transition-colors duration-200 ${active ? "text-primary" : "text-muted-foreground"}`} />
                {badge !== undefined && badge > 0 && (
                  <span className="absolute top-0.5 right-0.5 bg-primary text-primary-foreground text-[9px] font-bold min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center">
                    {badge > 9 ? "9+" : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${active ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}