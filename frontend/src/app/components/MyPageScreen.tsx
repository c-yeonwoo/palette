import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ChevronRight, UserCircle, HeartHandshake, LogOut, Users, Camera, Edit2, Loader2, UserPlus, Shield, Star, Trash2 } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { tokenStorage } from "../../lib/auth/tokenStorage";
import { toast } from "sonner";

interface MyPageScreenProps {
  onNavigateToProfile: () => void;
  onNavigateToConnector: () => void;
  onLogout: () => void;
  onConvertToRegular: () => void;
  onNavigateToFriends?: () => void;
}

interface MatchmakerData {
  profilePhotoUrl: string | null;
  level?: number;
  totalPoints?: number;
  successCount?: number;
}

interface ProfileData {
  primaryPhotoUrl: string | null;
  metrics?: { trustScore: number; completionRate: number };
}

export function MyPageScreen({
  onNavigateToProfile,
  onNavigateToConnector,
  onLogout,
  onConvertToRegular,
  onNavigateToFriends
}: MyPageScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [matchmaker, setMatchmaker] = useState<MatchmakerData | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editNickname, setEditNickname] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showWithdrawDialog, setShowWithdrawDialog] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<any>("/api/v1/auth/me");
      setUser(response);

      if (response.accountType === "MATCHMAKER_ONLY" || response.canAccessMatchmakerService) {
        api.get<MatchmakerData>("/api/v1/matchmakers/me").then(setMatchmaker).catch(() => {});
      }
      if (response.accountType === "REGULAR" && response.isProfileCompleted) {
        api.get<ProfileData>("/api/v1/profile").then(setProfile).catch(() => {});
      }
    } catch {
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

  const handleWithdraw = async () => {
    try {
      setIsWithdrawing(true);
      await api.delete("/api/v1/auth/me");
      tokenStorage.clearTokens();
      setShowWithdrawDialog(false);
      onLogout();
      toast.success("회원탈퇴가 완료되었습니다");
    } catch {
      toast.error("회원탈퇴에 실패했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleConvertToRegular = () => {
    if (!window.confirm("일반 회원으로 전환하시겠습니까? 프로필을 작성해야 합니다.")) return;
    toast.info("프로필을 작성하면 일반 회원으로 전환됩니다");
    onConvertToRegular();
  };

  const handleOpenEditDialog = () => {
    setEditNickname(user?.nickname || "");
    setProfilePhoto(matchmaker?.profilePhotoUrl || null);
    setPhotoFile(null);
    setShowEditDialog(true);
  };

  const handlePhotoSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("이미지 파일만 업로드 가능합니다"); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error("파일 크기는 10MB 이하여야 합니다"); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setProfilePhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!editNickname.trim()) { toast.error("닉네임을 입력해주세요"); return; }
    try {
      setIsSaving(true);
      if (editNickname !== user?.nickname) {
        await api.patch("/api/v1/auth/basic-info", { nickname: editNickname });
      }
      if (photoFile) {
        const formData = new FormData();
        formData.append("file", photoFile);
        const token = tokenStorage.getAccessToken();
        const response = await fetch("http://localhost:8080/api/v1/matchmakers/me/photo", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });
        if (!response.ok) {
          if (response.status === 413) { alert("파일 크기가 너무 큽니다."); throw new Error("파일 크기 초과"); }
          throw new Error("사진 업로드 실패");
        }
      }
      toast.success("프로필이 업데이트되었습니다!");
      setShowEditDialog(false);
      await fetchUserInfo();
    } catch (error: any) {
      if (!error.message?.includes("파일 크기")) toast.error("프로필 업데이트에 실패했습니다");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
      </div>
    );
  }

  const avatarUrl = matchmaker?.profilePhotoUrl || profile?.primaryPhotoUrl;
  const displayName = user?.nickname || user?.realName || "사용자";
  const isMatchmakerOnly = user?.accountType === "MATCHMAKER_ONLY";
  const isMatchmaker = user?.canAccessMatchmakerService;
  const trustScore = profile?.metrics?.trustScore ?? null;
  const completionRate = profile?.metrics?.completionRate ?? null;
  const profileSubtitle = completionRate !== null
    ? `프로필 완성도 ${completionRate}%`
    : "프로필 보기 및 수정";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-b from-primary/15 via-primary/5 to-background pt-safe-top">
        <div className="max-w-2xl mx-auto px-4 pt-6 pb-8">
          <div className="flex items-start justify-between mb-5">
            <h1 className="text-lg font-bold">마이페이지</h1>
            {(isMatchmakerOnly) && (
              <button onClick={handleOpenEditDialog} className="p-2 rounded-full hover:bg-white/20 transition-colors">
                <Edit2 className="w-4.5 h-4.5 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Avatar + Name */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-20 h-20 rounded-2xl object-cover shadow-md" />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/60 to-pink-400 flex items-center justify-center shadow-md">
                  <span className="text-white text-3xl font-bold">{displayName[0]}</span>
                </div>
              )}
              {isMatchmaker && (
                <div className="absolute -bottom-1.5 -right-1.5 bg-rose-500 rounded-full p-1 shadow">
                  <HeartHandshake className="w-3 h-3 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xl font-bold truncate">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  isMatchmakerOnly
                    ? "bg-rose-500/15 text-rose-600 dark:text-rose-400"
                    : "bg-primary/15 text-primary"
                }`}>
                  {isMatchmakerOnly ? "주선자 전용" : "일반 회원"}
                </span>
                {!user?.phoneNumber && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 font-medium">
                    인증 필요
                  </span>
                )}
              </div>
              {user?.email && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
              )}
            </div>
          </div>

          {/* Stats Row */}
          {(trustScore !== null || matchmaker?.level) && (
            <div className="mt-5 grid grid-cols-3 gap-2">
              {trustScore !== null && (
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <p className="text-lg font-bold text-primary">{trustScore}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">신뢰 점수</p>
                </div>
              )}
              {matchmaker?.level && (
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <p className="text-lg font-bold text-rose-500">Lv.{matchmaker.level}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">주선자 레벨</p>
                </div>
              )}
              {matchmaker?.successCount !== undefined && (
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <p className="text-lg font-bold text-rose-500">{matchmaker.successCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">성사 커플</p>
                </div>
              )}
              {matchmaker?.totalPoints !== undefined && (
                <div className="bg-white/60 dark:bg-white/5 backdrop-blur-sm rounded-2xl p-3 text-center">
                  <p className="text-lg font-bold">{(matchmaker.totalPoints ?? 0).toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">포인트</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Phone verification banner */}
      {!user?.phoneNumber && isMatchmaker && (
        <div className="max-w-2xl mx-auto mx-4 mb-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-center gap-2">
          <Shield className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-400">핸드폰 인증 후 주선 서비스를 이용할 수 있어요</p>
        </div>
      )}

      {/* Menu Sections */}
      <div className="max-w-2xl mx-auto px-4 space-y-4">
        {/* 내 활동 */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-2">내 활동</p>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/40">
            {!isMatchmakerOnly && (
              <MenuItem
                icon={<UserCircle className="w-4.5 h-4.5 text-primary" />}
                iconBg="bg-primary/10"
                title="내 프로필"
                subtitle={profileSubtitle}
                onClick={onNavigateToProfile}
              />
            )}
            {onNavigateToFriends && (
              <MenuItem
                icon={<UserPlus className="w-4.5 h-4.5 text-green-500" />}
                iconBg="bg-green-500/10"
                title="친구 연결"
                subtitle="초대 코드 & 친구 검색"
                onClick={onNavigateToFriends}
              />
            )}
            {isMatchmaker && (
              <MenuItem
                icon={<HeartHandshake className="w-4.5 h-4.5 text-rose-500" />}
                iconBg="bg-rose-500/10"
                title="주선자 대시보드"
                subtitle="주선 요청 관리 및 수익 확인"
                onClick={onNavigateToConnector}
              />
            )}
          </div>
        </section>

        {/* 계정 */}
        {isMatchmakerOnly && (
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-2">계정</p>
            <div className="bg-card rounded-2xl border border-border/60 overflow-hidden">
              <MenuItem
                icon={<Users className="w-4.5 h-4.5 text-blue-500" />}
                iconBg="bg-blue-500/10"
                title="일반 회원으로 전환"
                subtitle="매칭 서비스도 함께 이용하기"
                onClick={handleConvertToRegular}
              />
            </div>
          </section>
        )}

        {/* 설정 */}
        <section>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-2">설정</p>
          <div className="bg-card rounded-2xl border border-border/60 overflow-hidden divide-y divide-border/40">
            <button
              onClick={() => setShowWithdrawDialog(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors active:bg-muted/70"
            >
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-sm font-medium text-destructive">회원탈퇴</span>
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors active:bg-muted/70"
            >
              <div className="w-8 h-8 rounded-xl bg-gray-500/10 flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4 h-4 text-gray-500" />
              </div>
              <span className="text-sm font-medium">로그아웃</span>
            </button>
          </div>
        </section>

        {/* App version */}
        <div className="flex items-center justify-center gap-1.5 py-2">
          <Star className="w-3 h-3 text-primary/40" />
          <p className="text-xs text-muted-foreground/50">Palette v0.1.0</p>
        </div>
      </div>

      {/* Withdraw Dialog */}
      <Dialog open={showWithdrawDialog} onOpenChange={setShowWithdrawDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-destructive">회원탈퇴</DialogTitle>
            <DialogDescription>
              탈퇴하면 프로필, 매칭 내역, 친구 관계 등 모든 데이터가 즉시 삭제되며 복구할 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-3 space-y-3">
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-3 text-xs text-destructive space-y-1">
              <p>• 프로필 및 사진 삭제</p>
              <p>• 주선 요청 내역 삭제</p>
              <p>• 친구 관계 삭제</p>
              <p>• 모든 알림 및 기록 삭제</p>
            </div>
            <div className="flex gap-2 pt-1">
              <Button variant="outline" className="flex-1" onClick={() => setShowWithdrawDialog(false)} disabled={isWithdrawing}>
                취소
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleWithdraw} disabled={isWithdrawing}>
                {isWithdrawing ? <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" />처리 중...</> : "탈퇴하기"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>프로필 수정</DialogTitle>
            <DialogDescription>프로필 사진과 닉네임을 변경할 수 있습니다</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center gap-3">
              <div className="relative">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground rounded-full p-2">
                  <Camera className="w-4 h-4" />
                </div>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoSelect} className="hidden" />
              <p className="text-xs text-muted-foreground">사진을 클릭하여 변경</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임</Label>
              <Input
                id="nickname"
                placeholder="닉네임 (최대 20자)"
                maxLength={20}
                value={editNickname}
                onChange={(e) => setEditNickname(e.target.value)}
                disabled={isSaving}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowEditDialog(false)} disabled={isSaving}>
                취소
              </Button>
              <Button className="flex-1" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />저장 중...</> : "저장"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MenuItem({
  icon,
  iconBg,
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition-colors active:bg-muted/70"
    >
      <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 text-left min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground/60 flex-shrink-0" />
    </button>
  );
}
