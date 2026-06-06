import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ArrowLeft, Copy, Users, Search, UserPlus, Check, Clock, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";

type Tab = "invite" | "search" | "friends";

interface FriendRequest {
  id: string;
  userId: string;
  nickname: string;
  status: string;
  createdAt: string;
}

interface Friend {
  id: string;
  userId: string;
  nickname: string;
  acceptedAt: string | null;
}

interface SearchResult {
  userId: string;
  nickname: string;
  isFriend: boolean;
  hasPendingRequest: boolean;
}

interface InviteCode {
  code: string;
  expiresAt: string;
}

interface FriendConnectScreenProps {
  onBack: () => void;
}

export function FriendConnectScreen({ onBack }: FriendConnectScreenProps) {
  const [tab, setTab] = useState<Tab>("invite");

  // Invite tab state
  const [myInviteCode, setMyInviteCode] = useState<InviteCode | null>(null);
  const [joinCode, setJoinCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Search tab state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sendingRequestTo, setSendingRequestTo] = useState<string | null>(null);

  // Friends tab state
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
  const [isLoadingFriends, setIsLoadingFriends] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    if (tab === "friends") {
      loadFriendsData();
    }
  }, [tab]);

  const generateInviteCode = async () => {
    setIsGenerating(true);
    try {
      const data = await api.post<InviteCode>("/api/v1/friends/invite-code", {});
      setMyInviteCode(data);
    } catch {
      toast.error("초대 코드 생성에 실패했습니다");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyInviteCode = () => {
    if (!myInviteCode) return;
    navigator.clipboard.writeText(myInviteCode.code);
    toast.success("초대 코드가 복사되었습니다");
  };

  const handleJoinByCode = async () => {
    if (!joinCode.trim()) {
      toast.error("초대 코드를 입력해주세요");
      return;
    }
    setIsJoining(true);
    try {
      const data = await api.post<{ success: boolean; message: string }>("/api/v1/friends/join", {
        code: joinCode.trim().toUpperCase(),
      });
      toast.success(data.message || "친구가 되었습니다!");
      setJoinCode("");
    } catch (e: any) {
      toast.error(e?.message || "코드 사용에 실패했습니다");
    } finally {
      setIsJoining(false);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim().length < 2) {
      toast.error("2글자 이상 입력해주세요");
      return;
    }
    setIsSearching(true);
    try {
      const results = await api.get<SearchResult[]>(
        `/api/v1/friends/search?query=${encodeURIComponent(searchQuery.trim())}`
      );
      setSearchResults(results);
      if (results.length === 0) {
        toast.info("검색 결과가 없습니다");
      }
    } catch {
      toast.error("검색에 실패했습니다");
    } finally {
      setIsSearching(false);
    }
  };

  const sendFriendRequest = async (targetUserId: string) => {
    setSendingRequestTo(targetUserId);
    try {
      await api.post(`/api/v1/friends/request/${targetUserId}`, {});
      toast.success("친구 요청을 보냈습니다");
      setSearchResults(prev =>
        prev.map(r => r.userId === targetUserId ? { ...r, hasPendingRequest: true } : r)
      );
    } catch (e: any) {
      toast.error(e?.message || "친구 요청에 실패했습니다");
    } finally {
      setSendingRequestTo(null);
    }
  };

  const loadFriendsData = async () => {
    setIsLoadingFriends(true);
    try {
      const [friendsData, requestsData] = await Promise.all([
        api.get<Friend[]>("/api/v1/friends"),
        api.get<FriendRequest[]>("/api/v1/friends/requests/pending"),
      ]);
      setFriends(friendsData);
      setPendingRequests(requestsData);
    } catch {
      toast.error("친구 목록을 불러오지 못했습니다");
    } finally {
      setIsLoadingFriends(false);
    }
  };

  const acceptRequest = async (requestId: string) => {
    setAcceptingId(requestId);
    try {
      await api.put(`/api/v1/friends/request/${requestId}/accept`, {});
      toast.success("친구 요청을 수락했습니다");
      loadFriendsData();
    } catch {
      toast.error("수락에 실패했습니다");
    } finally {
      setAcceptingId(null);
    }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* 통일 헤더 (ADR 0014) */}
      <header className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-5 h-14 flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 rounded-full hover:bg-muted/50 transition-colors -ml-1.5" aria-label="뒤로">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-bold text-foreground">지인 관리</h1>
          {pendingRequests.length > 0 && (
            <span className="ml-auto text-xs font-semibold text-primary bg-brand-soft rounded-full px-2.5 py-1">
              받은 요청 {pendingRequests.length}건
            </span>
          )}
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-5 flex gap-1 pb-0">
          {(["invite", "search", "friends"] as Tab[]).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === t
                  ? "border-brand/50 text-gold-strong"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "invite" && "초대 코드"}
              {t === "search" && "검색"}
              {t === "friends" && `지인 목록${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}`}
            </button>
          ))}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
        {/* ─────── Invite Code Tab ─────── */}
        {tab === "invite" && (
          <>
            {/* My code section */}
            <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-brand-soft rounded-full flex items-center justify-center">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">내 초대 코드</p>
                  <p className="text-xs text-muted-foreground">친구에게 코드를 공유하세요</p>
                </div>
              </div>

              {myInviteCode ? (
                <>
                  <div className="bg-primary/5 rounded-xl py-6 text-center">
                    <p className="text-3xl font-bold tracking-[0.3em] text-primary">
                      {myInviteCode.code}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      만료: {formatDate(myInviteCode.expiresAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1 gap-2" onClick={copyInviteCode}>
                      <Copy className="w-4 h-4" />
                      복사
                    </Button>
                    <Button variant="outline" className="flex-1 gap-2" onClick={generateInviteCode} disabled={isGenerating}>
                      <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
                      재발급
                    </Button>
                  </div>
                </>
              ) : (
                <Button className="w-full gap-2" onClick={generateInviteCode} disabled={isGenerating}>
                  {isGenerating ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  초대 코드 생성
                </Button>
              )}
            </div>

            {/* Join by code section */}
            <div className="bg-card rounded-2xl p-5 border border-border space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium text-sm">코드로 친구 추가</p>
                  <p className="text-xs text-muted-foreground">친구에게 받은 코드를 입력하세요</p>
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="초대 코드 입력"
                  value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  maxLength={6}
                  className="text-center text-lg tracking-widest font-mono uppercase"
                  onKeyDown={e => e.key === "Enter" && handleJoinByCode()}
                />
                <Button onClick={handleJoinByCode} disabled={isJoining || !joinCode.trim()}>
                  {isJoining ? <RefreshCw className="w-4 h-4 animate-spin" /> : "추가"}
                </Button>
              </div>
            </div>
          </>
        )}

        {/* ─────── Search Tab ─────── */}
        {tab === "search" && (
          <>
            <div className="flex gap-2">
              <Input
                placeholder="닉네임으로 검색"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSearch()}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
              </Button>
            </div>

            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map(user => (
                  <div
                    key={user.userId}
                    className="bg-card rounded-xl p-4 border border-border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-soft rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.nickname.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{user.nickname}</p>
                        {user.isFriend && (
                          <p className="text-xs text-green-500 flex items-center gap-1">
                            <Check className="w-3 h-3" /> 이미 친구
                          </p>
                        )}
                        {!user.isFriend && user.hasPendingRequest && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 요청 대기 중
                          </p>
                        )}
                      </div>
                    </div>

                    {!user.isFriend && !user.hasPendingRequest && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        disabled={sendingRequestTo === user.userId}
                        onClick={() => sendFriendRequest(user.userId)}
                      >
                        {sendingRequestTo === user.userId ? (
                          <RefreshCw className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        친구 요청
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {searchResults.length === 0 && searchQuery && !isSearching && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>검색 결과가 없습니다</p>
                <p className="text-sm mt-1">다른 닉네임으로 검색해보세요</p>
              </div>
            )}

            {searchResults.length === 0 && !searchQuery && (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>닉네임으로 친구를 찾아보세요</p>
              </div>
            )}
          </>
        )}

        {/* ─────── Friends Tab ─────── */}
        {tab === "friends" && (
          <>
            {isLoadingFriends ? (
              <div className="text-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* Pending requests */}
                {pendingRequests.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      받은 친구 요청 ({pendingRequests.length})
                    </h3>
                    {pendingRequests.map(req => (
                      <div
                        key={req.id}
                        className="bg-card rounded-xl p-4 border border-primary/30 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-soft rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {req.nickname.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{req.nickname}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(req.createdAt)}</p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="gap-1"
                          disabled={acceptingId === req.id}
                          onClick={() => acceptRequest(req.id)}
                        >
                          {acceptingId === req.id ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <Check className="w-3 h-3" />
                          )}
                          수락
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Friends list */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      친구 ({friends.length})
                    </h3>
                    <button
                      onClick={loadFriendsData}
                      className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      새로고침
                    </button>
                  </div>

                  {friends.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>아직 친구가 없습니다</p>
                      <p className="text-sm mt-1">초대 코드나 검색으로 친구를 추가해보세요</p>
                    </div>
                  ) : (
                    friends.map(friend => (
                      <div
                        key={friend.id}
                        className="bg-card rounded-xl p-4 border border-border flex items-center gap-3"
                      >
                        <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-green-600">
                            {friend.nickname.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm">{friend.nickname}</p>
                          {friend.acceptedAt && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Check className="w-3 h-3 text-green-500" />
                              {formatDate(friend.acceptedAt)} 친구됨
                            </p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
