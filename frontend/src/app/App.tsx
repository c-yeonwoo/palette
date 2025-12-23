import { useState, useEffect } from "react";
import { LoginScreen } from "./components/LoginScreen";
import { OAuth2RedirectHandler } from "./components/OAuth2RedirectHandler";
import { BasicInfoScreen } from "./components/BasicInfoScreen";
import { PhotoUploadScreen } from "./components/PhotoUploadScreen";
import { AboutMeScreen } from "./components/AboutMeScreen";
import { IdealTypeScreen } from "./components/IdealTypeScreen";
import { AIProfileEnhanceScreen } from "./components/AIProfileEnhanceScreen";
import { MyProfileScreen } from "./components/MyProfileScreen";
import { MainFeedScreen } from "./components/MainFeedScreen";
import { ProfileDetailScreen } from "./components/ProfileDetailScreen";
import { ConnectorDashboard } from "./components/ConnectorDashboard";
import { Toaster } from "./components/ui/sonner";
import { Button } from "./components/ui/button";
import { Home, UserCircle, MessageSquare, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import { authService } from "../lib/auth/authService";
import { tokenStorage } from "../lib/auth/tokenStorage";

type Screen =
  | "login"
  | "oauth2Redirect"
  | "basicInfo"
  | "photoUpload"
  | "aboutMe"
  | "idealType"
  | "aiProfileEnhance"
  | "myProfile"
  | "mainFeed"
  | "profileDetail"
  | "connectorDashboard";

interface Profile {
  id: number;
  name: string;
  age: number;
  job: string;
  height: number;
  intro: string;
  photo: string;
  recommender: string;
  isBlurred: boolean;
}

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>("login");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  const handleOAuth2Success = (isNewUser: boolean) => {
    setIsLoggedIn(true);
    // If new user or profile incomplete, start onboarding
    if (isNewUser) {
      setCurrentScreen("basicInfo");
      toast.success("환영합니다! 프로필을 설정해주세요.");
    } else {
      setCurrentScreen("mainFeed");
      toast.success("로그인되었습니다!");
    }
  };

  const handleOAuth2Error = () => {
    toast.error("로그인에 실패했습니다. 다시 시도해주세요.");
    setCurrentScreen("login");
  };

  const handleBasicInfoNext = () => {
    setCurrentScreen("photoUpload");
  };

  const handlePhotoNext = () => {
    setCurrentScreen("aboutMe");
  };

  const handleAboutMeNext = () => {
    setCurrentScreen("idealType");
  };

  const handleIdealTypeNext = () => {
    setCurrentScreen("aiProfileEnhance");
  };

  const handleAIProfileComplete = () => {
    setCurrentScreen("mainFeed");
    toast.success("프로필이 성공적으로 생성되었습니다!");
  };

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile({ ...profile, isBlurred: false });
    setCurrentScreen("profileDetail");
  };

  const handleProfileBack = () => {
    setCurrentScreen("mainFeed");
    setSelectedProfile(null);
  };

  const handlePass = () => {
    toast.info("프로필을 건너뛰었습니다.");
    setCurrentScreen("mainFeed");
    setSelectedProfile(null);
  };

  const handleLike = () => {
    toast.success("주선 요청을 보냈습니다! 주선자의 승인을 기다려주세요.");
    setCurrentScreen("mainFeed");
    setSelectedProfile(null);
  };

  const handleMyProfileBack = () => {
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
      {currentScreen === "login" && <LoginScreen />}

      {currentScreen === "oauth2Redirect" && (
        <OAuth2RedirectHandler
          onSuccess={handleOAuth2Success}
          onError={handleOAuth2Error}
        />
      )}
      
      {currentScreen === "basicInfo" && (
        <BasicInfoScreen onNext={handleBasicInfoNext} />
      )}
      
      {currentScreen === "photoUpload" && (
        <PhotoUploadScreen onNext={handlePhotoNext} />
      )}
      
      {currentScreen === "aboutMe" && (
        <AboutMeScreen onNext={handleAboutMeNext} />
      )}
      
      {currentScreen === "idealType" && (
        <IdealTypeScreen onNext={handleIdealTypeNext} />
      )}
      
      {currentScreen === "aiProfileEnhance" && (
        <AIProfileEnhanceScreen onComplete={handleAIProfileComplete} />
      )}
      
      {currentScreen === "myProfile" && (
        <MyProfileScreen onBack={handleMyProfileBack} />
      )}
      
      {currentScreen === "mainFeed" && (
        <MainFeedScreen onProfileClick={handleProfileClick} />
      )}
      
      {currentScreen === "profileDetail" && selectedProfile && (
        <ProfileDetailScreen
          profile={selectedProfile}
          onBack={handleProfileBack}
          onPass={handlePass}
          onLike={handleLike}
        />
      )}
      
      {currentScreen === "connectorDashboard" && <ConnectorDashboard />}

      {/* Bottom Navigation - Only show when logged in and not on login/onboarding */}
      {isLoggedIn && !["login", "oauth2Redirect", "basicInfo", "photoUpload", "aboutMe", "idealType", "aiProfileEnhance"].includes(currentScreen) && (
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