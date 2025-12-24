import { useState, useEffect } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { EmailLoginScreen } from "./components/EmailLoginScreen";
import { EmailSignupScreen } from "./components/EmailSignupScreen";
import { OAuth2RedirectHandler } from "./components/OAuth2RedirectHandler";
import { RequiredInfoScreen } from "./components/RequiredInfoScreen";
import { AccountTypeSelectionScreen } from "./components/AccountTypeSelectionScreen";
import { BasicInfoScreen } from "./components/BasicInfoScreen";
import { PhotoUploadScreen } from "./components/PhotoUploadScreen";
import { AboutMeScreen } from "./components/AboutMeScreen";
import { IdealTypeScreen } from "./components/IdealTypeScreen";
import { AIProfileEnhanceScreen } from "./components/AIProfileEnhanceScreen";
import { MyProfileScreen } from "./components/MyProfileScreen";
import { ProfileEditScreen } from "./components/ProfileEditScreen";
import { MainFeedScreen } from "./components/MainFeedScreen";
import { ConnectorDashboard } from "./components/ConnectorDashboard";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Home, UserCircle, MessageSquare, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../lib/auth/authService";
import { tokenStorage } from "../lib/auth/tokenStorage";
import { api } from "../lib/api/apiClient";

type Screen =
  | "login"
  | "emailLogin"
  | "emailSignup"
  | "oauth2Redirect"
  | "requiredInfo"
  | "accountTypeSelection"
  | "basicInfo"
  | "photoUpload"
  | "aboutMe"
  | "idealType"
  | "aiProfileEnhance"
  | "myProfile"
  | "profileEdit"
  | "mainFeed"
  | "connectorDashboard";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [missingRequiredFields, setMissingRequiredFields] = useState<string[]>([]);
  const [isConvertingToRegular, setIsConvertingToRegular] = useState(false);

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
      hometown: "",
      hometownDistrict: "",
    },
    photos: [] as string[],
    mainPhotoIndex: 0,
    video: null as string | null,
    introduction: {
      text: "",
      interests: [] as string[],
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
      // 주선자 전용: 메인 피드로 바로 이동
      setCurrentScreen("mainFeed");
      toast.success("주선자로 가입되었습니다!");
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
    setCurrentScreen("aboutMe");
  };

  const handlePhotoBack = () => {
    setCurrentScreen("basicInfo");
  };

  const handleAboutMeNext = (data: any) => {
    setProfileData(prev => ({
      ...prev,
      introduction: data.introduction,
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
          hometownSido: profileData.locationInfo.hometown || null,
          hometownSigungu: profileData.locationInfo.hometownDistrict || null,
        },
        lifestyleInfo: {
          smoking: null,
          drinking: null,
          religion: null,
        },
        introduction: {
          text: profileData.introduction.text || null,
          interests: profileData.introduction.interests || [],
        },
        idealType: {
          ageRange: profileData.idealType.ageMin && profileData.idealType.ageMax
            ? { min: profileData.idealType.ageMin, max: profileData.idealType.ageMax }
            : null,
          heightRange: profileData.idealType.heightMin && profileData.idealType.heightMax
            ? { min: profileData.idealType.heightMin, max: profileData.idealType.heightMax }
            : null,
          bodyTypes: profileData.idealType.bodyTypes.map(bt => bodyTypeMap[bt] || bt),
          personalities: profileData.idealType.personalities || [],
          dateStyle: profileData.idealType.dateStyle || null,
          purpose: profileData.idealType.purpose || null,
          dealBreakers: profileData.idealType.dealBreakers || null,
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
    setCurrentScreen("mainFeed");
  };

  const handleMyProfileEdit = () => {
    setCurrentScreen("profileEdit");
  };

  const handleProfileEditSave = () => {
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
      {currentScreen === "login" && <LoginScreen onEmailLogin={handleEmailLogin} />}

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
        />
      )}
      
      {currentScreen === "aiProfileEnhance" && (
        <AIProfileEnhanceScreen onComplete={handleAIProfileComplete} />
      )}
      
      {currentScreen === "myProfile" && (
        <MyProfileScreen
          onBack={handleMyProfileBack}
          onEdit={handleMyProfileEdit}
          onConvertToRegular={handleConvertToRegular}
        />
      )}

      {currentScreen === "profileEdit" && (
        <ProfileEditScreen onBack={handleProfileEditBack} onSave={handleProfileEditSave} />
      )}
      
      {currentScreen === "mainFeed" && <MainFeedScreen />}

      {currentScreen === "connectorDashboard" && <ConnectorDashboard />}

      {/* Bottom Navigation - Only show when logged in and not on login/onboarding */}
      {isLoggedIn && !["login", "emailLogin", "emailSignup", "oauth2Redirect", "requiredInfo", "accountTypeSelection", "basicInfo", "photoUpload", "aboutMe", "idealType", "aiProfileEnhance", "profileEdit"].includes(currentScreen) && (
        <BottomNavigation
          currentScreen={currentScreen}
          onNavigate={setCurrentScreen}
        />
      )}

      <Toaster position="top-center" />
    </div>
  );
}

function BottomNavigation({
  currentScreen,
  onNavigate,
}: {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-30">
      <div className="max-w-2xl mx-auto flex items-center justify-around h-16">
        <NavButton
          icon={Home}
          label="홈"
          active={currentScreen === "mainFeed"}
          onClick={() => onNavigate("mainFeed")}
        />
        <NavButton
          icon={MessageSquare}
          label="메시지"
          active={false}
          onClick={() => toast.info("메시지 기능은 준비 중입니다.")}
        />
        <NavButton
          icon={UserCircle}
          label="프로필"
          active={currentScreen === "myProfile"}
          onClick={() => onNavigate("myProfile")}
        />
        <NavButton
          icon={LayoutDashboard}
          label="주선"
          active={currentScreen === "connectorDashboard"}
          onClick={() => onNavigate("connectorDashboard")}
        />
      </div>
    </div>
  );
}

function NavButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center gap-1 px-4 py-2 transition-colors ${
        active ? "text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      <Icon className="w-6 h-6" />
      <span className="text-xs">{label}</span>
    </button>
  );
}