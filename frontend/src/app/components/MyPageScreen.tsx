import { useState, useEffect, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";
import { ChevronRight, UserCircle, HeartHandshake, LogOut, Users, Camera, Edit2, Loader2, UserPlus, Shield, Trash2, FileText, Ticket } from "lucide-react";
import { SectionHeader } from "./ui/section-header";
import { ListRow } from "./ui/list-row";
import { Switch } from "./ui/switch";
import { api } from "../../lib/api/apiClient";
import { tokenStorage } from "../../lib/auth/tokenStorage";
import { toast } from "sonner";
import { PaletteInsightPanel } from "./insights/PaletteInsightPanel";
import { WeeklyColorInsightCard } from "./insights/WeeklyColorInsightCard";

interface MyPageScreenProps {
  onNavigateToProfile: () => void;
  onLogout: () => void;
  onConvertToRegular: () => void;
  onNavigateToFriends?: () => void;
  onNavigateToColor?: () => void;
  onReanalyze?: () => void;
  onNavigatePrivacy?: () => void;
  onNavigateTerms?: () => void;
  onNavigateDeleteAccount?: () => void;
  onNavigateBilling?: () => void;
}

interface MatchmakerData {
  profilePhotoUrl: string | null;
  level?: number;
  totalPoints?: number;
  successCount?: number;
}

interface ProfileData {
  primaryPhotoUrl: string | null;
  basicInfo?: { height?: number | null; mbti?: string | null };
  careerInfo?: { category?: string | null };
  metrics?: { trustScore: number; completionRate: number };
  colorType?: {
    type?: string | null;
    key?: string | null;
    name: string | null;
    hex: string | null;
    description: string | null;
    reasoning?: string | null;
    personalitySummary?: string | null;
    idealTypeInsight?: string | null;
    strengths?: string[] | null;
  } | null;
  attachmentProfile?: unknown;
  settings?: { isAcceptingMatches: boolean; hiddenAt: string | null; detailsVisibleToFriends?: boolean };
}

export function MyPageScreen({
  onNavigateToProfile,
  onLogout,
  onConvertToRegular,
  onNavigateToFriends,
  onNavigateToColor,
  onReanalyze,
  onNavigatePrivacy,
  onNavigateTerms,
  onNavigateDeleteAccount,
  onNavigateBilling,
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

  // 공개 설정 토글 — 프로필 공개(visibility) + 소개 받기(isAcceptingMatches) (MyProfile 에서 이동)
  const handleToggleVisibility = async (visible: boolean) => {
    try {
      const result = await api.patch<{ isAcceptingMatches: boolean; hiddenAt: string | null }>(
        "/api/v1/profile/settings/visibility", { visible }
      );
      setProfile(prev => prev ? { ...prev, settings: { isAcceptingMatches: prev.settings?.isAcceptingMatches ?? true, hiddenAt: result.hiddenAt } } : prev);
      toast.success(visible ? "프로필을 공개했어요" : "프로필을 숨겼어요");
    } catch {
      toast.error("설정 변경에 실패했습니다");
    }
  };

  // 지인(1촌)에게 상세(소개글·성향·이상형)까지 공개할지 — 기본 off(핵심정보만)
  const handleToggleDetailsToFriends = async (val: boolean) => {
    try {
      await api.patch("/api/v1/profile/settings", { detailsVisibleToFriends: val });
      setProfile(prev => prev ? { ...prev, settings: { ...(prev.settings ?? { isAcceptingMatches: true, hiddenAt: null }), detailsVisibleToFriends: val } } : prev);
      toast.success(val ? "지인에게도 상세 프로필을 공개해요" : "지인에겐 핵심 정보만 보여줘요");
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
  const profileSubtitle = completionRate !== null
    ? `완성도 ${completionRate}% · 높을수록 정밀 추천`
    : "프로필 보기 및 수정";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 통일 헤더 (ADR 0014) */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border pt-safe-top">
        <div className="max-w-2xl mx-auto px-5 h-16 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">마이페이지</h1>
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
                    프로필 완성도 {completionRate}%
                  </span>
                )}
              </div>
              {user?.email && (
                <p className="text-xs text-muted-foreground mt-1 truncate">{user.email}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 팔레트의 분석 — 마이페이지 최상위 (ADR 0037) */}
      {!isMatchmakerOnly && profile && (
        <div className="max-w-2xl mx-auto px-5 mt-5">
          <PaletteInsightPanel
            profile={profile as any}
            onNavigateToEdit={onNavigateToProfile}
            onNavigateToColor={onNavigateToColor}
            onReanalyze={onReanalyze}
          />
        </div>
      )}

      {/* L-001 — 색별 위클리 인사이트 카드 (분석 완료된 일반 회원만) */}
      {!isMatchmakerOnly && profile?.colorType?.type && (
        <WeeklyColorInsightCard
          colorType={profile.colorType.type as any}
          accentHex={profile.colorType.hex}
        />
      )}

      {/* 핸드폰 인증 배너 */}
      {!user?.phoneNumber && isMatchmaker && (
        <div className="max-w-2xl mx-auto px-5 mt-3">
          <div className="bg-brand-soft border border-primary/20 rounded-2xl px-4 py-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary flex-shrink-0" />
            <p className="text-xs text-primary">핸드폰 인증 후 주선 서비스를 이용할 수 있어요</p>
          </div>
        </div>
      )}

      {/* 메뉴 */}
      <div className="max-w-2xl mx-auto px-5 mt-4 space-y-4">
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
                title="지인 관리"
                subtitle="초대 코드 & 지인 검색"
                onClick={onNavigateToFriends}
              />
            )}
          </div>
        </section>

        {/* 공개 범위 — 프로필 공개 (소개 요청 받기는 항상 ON, 토글 제거) */}
        {!isMatchmakerOnly && profile && (
          <section className="!mt-[26px]">
            <SectionHeader title="공개 범위" className="px-1 mb-3" />
            <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden divide-y divide-border">
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-medium text-foreground">프로필 공개</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile.settings?.hiddenAt ? "숨김 — 지인의 지인에게 보이지 않아요" : "지인의 지인이 내 프로필을 볼 수 있어요"}
                  </p>
                </div>
                <Switch checked={!profile.settings?.hiddenAt} onCheckedChange={handleToggleVisibility} />
              </div>
              <div className="flex items-center justify-between px-4 py-3.5">
                <div className="min-w-0 pr-3">
                  <p className="text-sm font-medium text-foreground">지인에게 상세 프로필 공개</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {profile.settings?.detailsVisibleToFriends
                      ? "내 지인도 소개글·성향·이상형을 볼 수 있어요"
                      : "지인에겐 핵심 정보(키·나이·직업·지역)만 보여요"}
                  </p>
                </div>
                <Switch checked={!!profile.settings?.detailsVisibleToFriends} onCheckedChange={handleToggleDetailsToFriends} />
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
        <section className="!mt-[26px]">
          <SectionHeader title="설정" className="px-1 mb-3" />
          <div className="bg-card rounded-2xl border border-border/60 shadow-card overflow-hidden divide-y divide-border">
            {onNavigateBilling && (
              <button
                onClick={onNavigateBilling}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-brand-soft flex items-center justify-center flex-shrink-0">
                  <Ticket className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">잔액 · 충전</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
              </button>
            )}
            {onNavigateTerms && (
              <button
                onClick={onNavigateTerms}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">이용약관</span>
              </button>
            )}
            {onNavigatePrivacy && (
              <button
                onClick={onNavigatePrivacy}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors"
              >
                <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-sm font-medium">개인정보 처리방침</span>
              </button>
            )}
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
              onClick={() => onNavigateDeleteAccount ? onNavigateDeleteAccount() : setShowWithdrawDialog(true)}
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
              <p>• 소개 요청 내역 삭제</p>
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
