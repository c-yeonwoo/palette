import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ChevronRight, UserCircle, HeartHandshake, LogOut, Users, Camera, Edit2, Loader2, UserPlus, Shield, Trash2, Sparkles } from "lucide-react";
import { SectionHeader } from "./ui/section-header";
import { ListRow } from "./ui/list-row";
import { Switch } from "./ui/switch";
import { api } from "../../lib/api/apiClient";
import { tokenStorage } from "../../lib/auth/tokenStorage";
import { toast } from "sonner";

interface MyPageScreenProps {
  onNavigateToProfile: () => void;
  onNavigateToColor?: () => void;
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
  colorType?: { name: string | null; hex: string | null; description: string | null } | null;
  settings?: { isAcceptingMatches: boolean; hiddenAt: string | null };
}

export function MyPageScreen({
  onNavigateToProfile,
  onNavigateToColor,
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
  const [showAcceptConfirm, setShowAcceptConfirm] = useState(false);
  const [pendingAccept, setPendingAccept] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 공개 설정 토글 — 소개받기(노출/visibility) + 주선받기(isAcceptingMatches) (MyProfile 에서 이동)
  const handleToggleVisibility = async (visible: boolean) => {
    try {
      const result = await api.patch<{ isAcceptingMatches: boolean; hiddenAt: string | null }>(
        "/api/v1/profile/settings/visibility", { visible }
      );
      setProfile(prev => prev ? { ...prev, settings: { isAcceptingMatches: prev.settings?.isAcceptingMatches ?? true, hiddenAt: result.hiddenAt } } : prev);
      toast.success(visible ? "소개받기가 시작됐어요" : "소개받기를 잠시 멈췄어요");
    } catch {
      toast.error("설정 변경에 실패했습니다");
    }
  };

  const handleToggleAccepting = (checked: boolean) => {
    setPendingAccept(checked);
    setShowAcceptConfirm(true);
  };

  const confirmToggleAccepting = async () => {
    try {
      await api.patch("/api/v1/profile/settings", { isAcceptingMatches: pendingAccept });
      setProfile(prev => prev ? { ...prev, settings: { hiddenAt: prev.settings?.hiddenAt ?? null, isAcceptingMatches: pendingAccept } } : prev);
      toast.success(pendingAccept ? "주선받기가 활성화되었습니다" : "주선받기가 비활성화되었습니다");
      setShowAcceptConfirm(false);
    } catch {
      toast.error("설정 변경에 실패했습니다");
    }
  };

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
  const completionRate = profile?.metrics?.completionRate ?? null;
  const colorType = profile?.colorType ?? null;
  const profileSubtitle = completionRate !== null
    ? `프로필 완성도 ${completionRate}%`
    : "프로필 보기 및 수정";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 통일 헤더 (ADR 0014) */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border pt-safe-top">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-base font-bold text-foreground">마이페이지</h1>
          {isMatchmakerOnly && (
            <button
              onClick={handleOpenEditDialog}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors"
              aria-label="프로필 수정"
            >
              <Edit2 className="w-[18px] h-[18px] text-foreground" />
            </button>
          )}
        </div>
      </header>

      {/* 아바타 + 이름 영역 */}
      <div className="border-b border-border px-4">
        <div className="max-w-2xl mx-auto py-5">
          {/* 아바타 + 이름 */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-16 h-16 rounded-2xl object-cover" />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  <span className="text-2xl font-bold text-muted-foreground">{displayName[0]}</span>
                </div>
              )}
              {isMatchmaker && (
                <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1">
                  <HeartHandshake className="w-3 h-3 text-primary-foreground" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-lg font-bold truncate">{displayName}</p>
              <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-brand-soft text-primary">
                  {isMatchmakerOnly ? "주선자 전용" : "일반 회원"}
                </span>
                {!user?.phoneNumber && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-soft text-primary font-medium">
                    인증 필요
                  </span>
                )}
                {completionRate !== null && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
                    완성도 {completionRate}%
                  </span>
                )}
              </div>
              {user?.email && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
              )}
            </div>
          </div>

          {/* 나의 색 — Palette 시그니처 정체성 (탭 → 색 설명 페이지) */}
          {profile && colorType?.hex && (
            <button
              onClick={() => (onNavigateToColor ?? onNavigateToProfile)()}
              className="mt-4 w-full flex items-center gap-3.5 bg-surface-sunken rounded-2xl px-4 py-3.5 text-left transition-colors hover:bg-accent"
            >
              <span
                className="w-11 h-11 rounded-full flex-shrink-0 ring-2 ring-white shadow-sm"
                style={{ backgroundColor: colorType.hex }}
              />
              <span className="min-w-0 flex-1">
                <span className="block text-[11px] font-medium text-muted-foreground">나의 색</span>
                <span className="block text-sm font-bold text-foreground truncate">{colorType.name ?? "내 색깔"}</span>
                {colorType.description && (
                  <span className="block text-xs text-muted-foreground truncate mt-0.5">{colorType.description}</span>
                )}
              </span>
              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            </button>
          )}

          {/* 아직 색이 없으면 — AI 프로필로 찾기 유도 */}
          {profile && !colorType?.hex && (
            <button
              onClick={onNavigateToProfile}
              className="mt-4 w-full flex items-center gap-3 bg-brand-soft rounded-2xl px-4 py-3.5 text-left transition-colors hover:brightness-[0.98]"
            >
              <span className="w-9 h-9 rounded-full bg-card flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-primary" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-gold-strong">나의 색 찾기</span>
                <span className="block text-xs text-gold-strong/70 truncate">AI 프로필로 당신만의 색을 발견하세요</span>
              </span>
              <ChevronRight className="w-4 h-4 text-gold-strong flex-shrink-0" />
            </button>
          )}

        </div>
      </div>

      {/* 핸드폰 인증 배너 */}
      {!user?.phoneNumber && isMatchmaker && (
        <div className="max-w-2xl mx-auto px-4 mt-3">
          <div className="bg-brand-soft border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs text-primary">핸드폰 인증 후 주선 서비스를 이용할 수 있어요</p>
          </div>
        </div>
      )}

      {/* 메뉴 */}
      <div className="max-w-2xl mx-auto px-4 mt-4 space-y-4">
        {/* 내 활동 */}
        <section>
          <SectionHeader title="내 활동" className="px-1 mb-3" />
          <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden divide-y divide-border">
            {!isMatchmakerOnly && (
              <MenuItem
                icon={<UserCircle className="w-4 h-4" />}
                title="내 프로필"
                subtitle={profileSubtitle}
                onClick={onNavigateToProfile}
              />
            )}
            {onNavigateToFriends && (
              <MenuItem
                icon={<UserPlus className="w-4 h-4" />}
                title="친구 연결"
                subtitle="초대 코드 & 친구 검색"
                onClick={onNavigateToFriends}
              />
            )}
            {isMatchmaker && (
              <MenuItem
                icon={<HeartHandshake className="w-4 h-4" />}
                title="주선자 대시보드"
                subtitle={
                  matchmaker?.level
                    ? `Lv.${matchmaker.level} · ${(matchmaker.totalPoints ?? 0).toLocaleString()}P`
                    : "주선 요청 관리 및 수익 확인"
                }
                onClick={onNavigateToConnector}
              />
            )}
          </div>
        </section>

        {/* 공개 설정 — 소개받기(노출) + 주선받기 (MyProfile 에서 이동) */}
        {!isMatchmakerOnly && profile && (
          <section>
            <SectionHeader title="공개 설정" className="px-1 mb-3" />
            <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-medium text-foreground">소개받기</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile.settings?.hiddenAt ? "잠시 멈춤 — 지인 피드에 안 보여요" : "지인 피드에 내 프로필이 노출돼요"}
                  </p>
                </div>
                <Switch checked={!profile.settings?.hiddenAt} onCheckedChange={handleToggleVisibility} />
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-medium text-foreground">주선받기</p>
                  <p className="text-xs text-muted-foreground mt-0.5">지인이 보내는 주선 요청을 받아요</p>
                </div>
                <Switch checked={!!profile.settings?.isAcceptingMatches} onCheckedChange={handleToggleAccepting} />
              </div>
            </div>
          </section>
        )}

        {/* 계정 전환 */}
        {isMatchmakerOnly && (
          <section>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1 mb-2">계정</p>
            <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden">
              <MenuItem
                icon={<Users className="w-4 h-4" />}
                title="일반 회원으로 전환"
                subtitle="매칭 서비스도 함께 이용하기"
                onClick={handleConvertToRegular}
              />
            </div>
          </section>
        )}

        {/* 설정 */}
        <section>
          <SectionHeader title="설정" className="px-1 mb-3" />
          <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden divide-y divide-border">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="text-sm font-medium">로그아웃</span>
            </button>
            <button
              onClick={() => setShowWithdrawDialog(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-4 h-4 text-destructive" />
              </div>
              <span className="text-sm font-medium text-destructive">회원탈퇴</span>
            </button>
          </div>
        </section>

        <p className="text-center text-xs text-muted-foreground py-2">팔레트 v0.1.0</p>
      </div>

      {/* 회원탈퇴 다이얼로그 */}
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

      {/* 주선받기 토글 확인 다이얼로그 */}
      <Dialog open={showAcceptConfirm} onOpenChange={setShowAcceptConfirm}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{pendingAccept ? "주선받기 활성화" : "주선받기 비활성화"}</DialogTitle>
            <DialogDescription>
              {pendingAccept
                ? "지인이 보내는 주선 요청을 받게 됩니다."
                : "더 이상 주선 요청을 받지 않습니다."}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-1">
            <Button variant="outline" className="flex-1" onClick={() => setShowAcceptConfirm(false)}>취소</Button>
            <Button className="flex-1" onClick={confirmToggleAccepting}>확인</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 프로필 수정 다이얼로그 */}
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
                  className="w-24 h-24 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
                >
                  {profilePhoto ? (
                    <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 bg-brand-soft text-gold-strong rounded-full p-2">
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
  title,
  subtitle,
  onClick,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors text-left"
    >
      <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0 text-muted-foreground">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
    </button>
  );
}
