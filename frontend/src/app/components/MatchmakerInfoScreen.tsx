import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { ArrowLeft, Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";
import { tokenStorage } from "../../lib/auth/tokenStorage";

interface MatchmakerInfoScreenProps {
  onBack: () => void;
  onComplete: () => void;
}

export function MatchmakerInfoScreen({ onBack, onComplete }: MatchmakerInfoScreenProps) {
  const [formData, setFormData] = useState({
    nickname: "",
    phoneNumber: "",
    verificationCode: "",
  });

  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [verificationSent, setVerificationSent] = useState(false);
  const [isVerificationLoading, setIsVerificationLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneNumberChange = (value: string) => {
    const formatted = formatPhoneNumber(value);
    handleInputChange("phoneNumber", formatted);
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

  const handleRemovePhoto = () => {
    setProfilePhoto(null);
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSendVerification = async () => {
    if (!formData.phoneNumber) {
      toast.error("핸드폰 번호를 입력해주세요");
      return;
    }

    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      toast.error("올바른 핸드폰 번호 형식이 아닙니다 (010-1234-5678)");
      return;
    }

    setIsVerificationLoading(true);

    try {
      // TODO: 실제 인증번호 발송 API 연동
      setTimeout(() => {
        setVerificationSent(true);
        toast.success("인증번호가 발송되었습니다");
        setIsVerificationLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to send verification:", error);
      toast.error("인증번호 발송에 실패했습니다");
      setIsVerificationLoading(false);
    }
  };

  const validateForm = () => {
    if (!formData.nickname) {
      toast.error("닉네임을 입력해주세요");
      return false;
    }

    if (!formData.phoneNumber) {
      toast.error("핸드폰 번호를 입력해주세요");
      return false;
    }

    if (!verificationSent) {
      toast.error("인증번호를 발송해주세요");
      return false;
    }

    if (!formData.verificationCode) {
      toast.error("인증번호를 입력해주세요");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // 1. 사용자 정보 업데이트 (닉네임, 핸드폰 번호, 인증 상태)
      await api.put("/api/v1/auth/matchmaker/complete-info", {
        nickname: formData.nickname,
        phoneNumber: formData.phoneNumber,
        verificationCode: formData.verificationCode,
      });

      // 2. 프로필 사진이 있으면 업로드
      if (photoFile) {
        try {
          const uploadFormData = new FormData();
          uploadFormData.append("file", photoFile);

          const token = tokenStorage.getAccessToken();
          const response = await fetch("http://localhost:8080/api/v1/matchmakers/me/photo", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            body: uploadFormData,
          });

          if (!response.ok) {
            if (response.status === 413) {
              alert("파일 크기가 너무 큽니다. 더 작은 사이즈의 사진을 업로드해주세요.");
              throw new Error("파일 크기 초과");
            }
            const errorText = await response.text();
            console.error("Photo upload failed:", errorText);
            throw new Error("사진 업로드에 실패했습니다");
          }

          console.log("Photo uploaded successfully");
        } catch (photoError) {
          console.error("Photo upload error:", photoError);
          // 사진 업로드 실패해도 계속 진행 (선택사항이므로)
          toast.warning("사진 업로드에 실패했습니다. 나중에 다시 시도해주세요.");
        }
      }

      toast.success("주선자 정보가 등록되었습니다!");
      onComplete();
    } catch (error: any) {
      console.error("Failed to complete matchmaker info:", error);
      toast.error(error.response?.data?.message || "정보 등록에 실패했습니다");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 bg-background border-b z-10">
        <div className="flex items-center justify-between p-4">
          <button onClick={onBack} className="p-2 hover:bg-muted rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">주선자 정보 입력</h1>
          <div className="w-9" />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto p-6 space-y-6">
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-bold">환영합니다!</h2>
            <p className="text-sm text-muted-foreground">
              주선자로 활동하기 위한 기본 정보를 입력해주세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 프로필 사진 */}
            <div className="space-y-2">
              <Label>프로필 사진 (선택)</Label>
              <div className="flex justify-center">
                <div className="relative">
                  <div
                    onClick={handlePhotoClick}
                    className="w-32 h-32 rounded-full bg-muted border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors overflow-hidden"
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
                  {profilePhoto && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto();
                      }}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 hover:bg-destructive/90"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
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
                나중에 추가할 수도 있습니다
              </p>
            </div>

            {/* 닉네임 */}
            <div className="space-y-2">
              <Label htmlFor="nickname">닉네임 *</Label>
              <Input
                id="nickname"
                type="text"
                placeholder="닉네임 (최대 20자)"
                maxLength={20}
                value={formData.nickname}
                onChange={(e) => handleInputChange("nickname", e.target.value)}
                disabled={isLoading}
              />
            </div>

            {/* 핸드폰 번호 */}
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">핸드폰 번호 * (본인인증 필수)</Label>
              <div className="flex gap-2">
                <Input
                  id="phoneNumber"
                  type="text"
                  placeholder="010-1234-5678"
                  value={formData.phoneNumber}
                  onChange={(e) => handlePhoneNumberChange(e.target.value)}
                  disabled={isLoading || verificationSent}
                  maxLength={13}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendVerification}
                  disabled={isLoading || verificationSent || isVerificationLoading}
                  className="whitespace-nowrap"
                >
                  {isVerificationLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : verificationSent ? (
                    "발송완료"
                  ) : (
                    "인증번호"
                  )}
                </Button>
              </div>
            </div>

            {/* 인증번호 입력 */}
            {verificationSent && (
              <div className="space-y-2">
                <Label htmlFor="verificationCode">인증번호 *</Label>
                <Input
                  id="verificationCode"
                  type="text"
                  placeholder="6자리 인증번호"
                  value={formData.verificationCode}
                  onChange={(e) =>
                    handleInputChange(
                      "verificationCode",
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  disabled={isLoading}
                  maxLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  인증번호가 오지 않으면 다시 발송해주세요
                </p>
              </div>
            )}

            {/* 안내 메시지 */}
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <h3 className="font-semibold">주선자 안내</h3>
              <ul className="space-y-1 text-muted-foreground">
                <li>• 핸드폰 본인인증은 필수입니다</li>
                <li>• 주선 성공 시 포인트를 획득합니다</li>
                <li>• 신뢰할 수 있는 주선 서비스를 제공해주세요</li>
              </ul>
            </div>

            {/* 완료 버튼 */}
            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  처리 중...
                </>
              ) : (
                "완료"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
