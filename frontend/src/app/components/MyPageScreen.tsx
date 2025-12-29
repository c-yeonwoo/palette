import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ChevronRight, UserCircle, HeartHandshake, LogOut, Settings, Users, Camera, Edit2, Loader2 } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { tokenStorage } from "../../lib/auth/tokenStorage";
import { toast } from "sonner";

interface MyPageScreenProps {
  onNavigateToProfile: () => void;
  onNavigateToConnector: () => void;
  onLogout: () => void;
  onConvertToRegular: () => void;
}

interface MatchmakerData {
  profilePhotoUrl: string | null;
}

interface ProfileData {
  primaryPhotoUrl: string | null;
}

export function MyPageScreen({
  onNavigateToProfile,
  onNavigateToConnector,
  onLogout,
  onConvertToRegular
}: MyPageScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [matchmaker, setMatchmaker] = useState<MatchmakerData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Edit profile dialog state
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<any>("/api/v1/auth/me");
      setUser(response);

      // If user is matchmaker, fetch matchmaker data for profile photo
      if (response.accountType === "MATCHMAKER_ONLY" || response.canAccessMatchmakerService) {
        try {
          const matchmakerData = await api.get<MatchmakerData>("/api/v1/matchmakers/me");
          setMatchmaker(matchmakerData);
        } catch (error) {
          console.error("Failed to fetch matchmaker data:", error);
          // Continue even if matchmaker data fetch fails
        }
      }

      // If user is regular and has completed profile, fetch profile data for profile photo
      if (response.accountType === "REGULAR" && response.isProfileCompleted) {
        try {
          const profileData = await api.get<ProfileData>("/api/v1/profile");
          setProfile(profileData);
        } catch (error) {
          console.error("Failed to fetch profile data:", error);
          // Continue even if profile data fetch fails
        }
      }
    } catch (error: any) {
      console.error("Failed to fetch user info:", error);
      toast.error("사용자 정보를 불러오는데 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    tokenStorage.clearTokens();
    onLogout();
    toast.success("로그아웃되었습니다");
  };

  const handleConvertToRegular = () => {
    if (!window.confirm("일반 회원으로 전환하시겠습니까? 프로필을 작성해야 합니다.")) {
      return;
    }

    toast.info("프로필을 작성하면 일반 회원으로 전환됩니다");
    onConvertToRegular();
  };

  const handleOpenEditDialog = () => {
    setEditNickname(user?.nickname || "");
    setProfilePhoto(matchmaker?.profilePhotoUrl || null);
    setPhotoFile(null);
    setShowEditDialog(true);
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("이미지 파일만 업로드 가능합니다");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("파일 크기는 10MB 이하여야 합니다");
      return;
    }

    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editNickname.trim()) {
      toast.error("닉네임을 입력해주세요");
      return;
    }

    try {
      setIsSaving(true);

      // Update nickname if changed
      if (editNickname !== user?.nickname) {
        // For now, we'll use the basic info endpoint
        await api.patch("/api/v1/auth/basic-info", {
          nickname: editNickname
        });
      }

      // Upload photo if changed
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);

        const token = tokenStorage.getAccessToken();
        const response = await fetch("http://localhost:8080/api/v1/matchmakers/me/photo", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          if (response.status === 413) {
            alert("파일 크기가 너무 큽니다. 더 작은 사이즈의 사진을 업로드해주세요.");
            throw new Error("파일 크기 초과");
          }
          throw new Error("사진 업로드에 실패했습니다");
        }
      }

      toast.success("프로필이 업데이트되었습니다!");
      setShowEditDialog(false);

      // Refresh user info
      await fetchUserInfo();
    } catch (error: any) {
      console.error("Failed to update profile:", error);
      if (!error.message.includes("파일 크기")) {
        toast.error("프로필 업데이트에 실패했습니다");
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-muted-foreground">불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-card border-b border-border px-6 py-4">
        <h2 className="text-center text-xl font-semibold">마이페이지</h2>
      </div>

      {/* User Info */}
      {user && (
        <div className="bg-card border-b border-border px-6 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
              {/* Show profile photo if available */}
              {(matchmaker?.profilePhotoUrl || profile?.primaryPhotoUrl) ? (
                <img
                  src={matchmaker?.profilePhotoUrl || profile?.primaryPhotoUrl || ""}
                  alt="Profile"
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-2xl font-bold">
                  {user.nickname?.[0] || user.realName?.[0] || "?"}
                </div>
              )}
              <div className="flex-1">
                <p className="text-lg font-semibold">
                  {user.nickname || user.realName || "사용자"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.accountType === "REGULAR" ? "일반 회원" : "주선자 회원"}
                </p>
              </div>
              {/* Edit Button - Only for MATCHMAKER_ONLY accounts */}
              {user.accountType === "MATCHMAKER_ONLY" && (
                <button
                  onClick={handleOpenEditDialog}
                  className="p-2 hover:bg-accent/50 rounded-full transition-colors"
                >
                  <Edit2 className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* My Profile - Hide for matchmaker-only accounts */}
          {user?.accountType !== "MATCHMAKER_ONLY" && (
            <button
              onClick={onNavigateToProfile}
              className="w-full bg-card hover:bg-accent/50 border border-border rounded-xl p-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserCircle className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="font-medium">내 프로필</p>
                  <p className="text-sm text-muted-foreground">프로필 보기 및 수정</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          )}

          {/* Connector Dashboard */}
          {user?.canAccessMatchmakerService && (
            <>
              <button
                onClick={onNavigateToConnector}
                className="w-full bg-card hover:bg-accent/50 border border-border rounded-xl p-4 flex items-center justify-between transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/10 flex items-center justify-center">
                    <HeartHandshake className="w-5 h-5 text-rose-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium">주선자 대시보드</p>
                    <p className="text-sm text-muted-foreground">주선 요청 관리</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              </button>
              {/* Phone verification warning */}
              {!user?.phoneNumber && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                  <p className="text-sm text-amber-700 dark:text-amber-400">
                    ⚠️ 핸드폰 인증이 필요합니다. 인증을 완료해야 주선 서비스를 이용할 수 있습니다.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Convert to Regular Account - Show for matchmaker-only accounts */}
          {user?.accountType === "MATCHMAKER_ONLY" && (
            <button
              onClick={handleConvertToRegular}
              className="w-full bg-card hover:bg-accent/50 border border-border rounded-xl p-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">일반 회원으로 전환</p>
                  <p className="text-sm text-muted-foreground">매칭 서비스 이용하기</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>

      {/* Settings Section */}
      <div className="px-6 py-4">
        <div className="max-w-2xl mx-auto">
          <p className="text-sm font-medium text-muted-foreground mb-3 px-1">설정</p>
          <div className="space-y-2">
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full bg-card hover:bg-accent/50 border border-border rounded-xl p-4 flex items-center justify-between transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-500/10 flex items-center justify-center">
                  <LogOut className="w-5 h-5 text-gray-500" />
                </div>
                <div className="text-left">
                  <p className="font-medium">로그아웃</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>프로필 수정</DialogTitle>
            <DialogDescription>
              프로필 사진과 닉네임을 변경할 수 있습니다
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Profile Photo */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  onClick={handlePhotoClick}
                  className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {profilePhoto ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-2">
                  <Camera className="w-4 h-4" />
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground text-center">
                사진을 클릭하여 변경
              </p>
            </div>

            {/* Nickname */}
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="닉네임 (최대 20자)"
                maxLength={20}
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                disabled={isSaving}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowEditDialog(false)}
                disabled={isSaving}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={handleSaveProfile}
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    저장 중...
                  </>
                ) : (
                  "저장"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
