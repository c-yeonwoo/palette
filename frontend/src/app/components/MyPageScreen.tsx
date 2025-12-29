import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { ChevronRight, UserCircle, HeartHandshake, LogOut, Settings } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { tokenStorage } from "../../lib/auth/tokenStorage";
import { toast } from "sonner";

interface MyPageScreenProps {
  onNavigateToProfile: () => void;
  onNavigateToConnector: () => void;
  onLogout: () => void;
}

export function MyPageScreen({
  onNavigateToProfile,
  onNavigateToConnector,
  onLogout
}: MyPageScreenProps) {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<any>("/api/v1/auth/me");
      setUser(response);
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
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-400 to-rose-400 flex items-center justify-center text-white text-2xl font-bold">
                {user.nickname?.[0] || user.realName?.[0] || "?"}
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {user.nickname || user.realName || "사용자"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {user.accountType === "REGULAR" ? "일반 회원" : "주선자 회원"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="px-6 py-4">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* My Profile */}
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

          {/* Connector Dashboard */}
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
    </div>
  );
}
