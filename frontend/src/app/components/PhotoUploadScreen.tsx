import { useState, useRef } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Share2, Camera, Plus, Video, ArrowLeft, X, Play } from "lucide-react";
import { toast } from "sonner";
import { api } from "../../lib/api/apiClient";

interface PhotoUploadScreenProps {
  onNext: (data: any) => void;
  onBack: () => void;
  initialData?: {
    photos?: string[];
    mainPhotoIndex?: number;
    video?: string | null;
  };
}

export function PhotoUploadScreen({ onNext, onBack, initialData }: PhotoUploadScreenProps) {
  const MAX_PHOTOS = 6;
  const [photos, setPhotos] = useState<string[]>(() =>
    (initialData?.photos ?? []).filter((p): p is string => !!p).slice(0, MAX_PHOTOS)
  );
  const [video, setVideo] = useState<string | null>(initialData?.video || null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const uploadedCount = photos.length;

  const openPhotoPicker = () => {
    if (photos.length >= MAX_PHOTOS) return;
    photoInputRef.current?.click();
  };

  const handlePhotoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("10MB 이하의 사진만 업로드 가능해요");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      // 항상 끝에 추가 — 순서대로 채워 첫 사진이 대표가 되도록
      setPhotos(prev => (prev.length >= MAX_PHOTOS ? prev : [...prev, dataUrl]));
      uploadPhotoToServer(file);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const uploadPhotoToServer = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);
      await api.postForm("/api/v1/profile/photo", formData);
    } catch {
      toast.error("사진 업로드에 실패했습니다. 다시 시도해주세요.");
    }
  };

  const handleRemovePhoto = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    // 삭제 시 뒤 사진이 앞으로 당겨져 첫 사진(대표)이 항상 유지됨
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error("50MB 이하의 동영상만 업로드 가능해요");
      return;
    }

    // Validate duration
    const videoEl = document.createElement("video");
    videoEl.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);
    videoEl.src = objectUrl;
    videoEl.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const duration = videoEl.duration;
      if (duration < 5 || duration > 30) {
        toast.error(`5~30초 동영상만 업로드 가능해요 (현재: ${Math.round(duration)}초)`);
        return;
      }
      setVideoFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setVideo(ev.target?.result as string);
      reader.readAsDataURL(file);
      toast.success("동영상이 추가됐어요");
    };
    e.target.value = "";
  };

  const handleShareRequest = async () => {
    const requestText = "내 Palette 프로필에 올릴 인생샷을 찍어줘! 사진은 여기로 보내줘: https://palette.app/photo-request";
    if (navigator.share) {
      try {
        await navigator.share({ text: requestText, title: "인생샷 부탁해!" });
        return;
      } catch {
        // user cancelled or share failed, fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(requestText);
      toast.success("친구에게 보낼 메시지가 복사됐어요!");
    } catch {
      toast.error("복사에 실패했어요");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <div className="bg-card border-b border-border px-6 py-4 space-y-3">
        <div className="flex items-center justify-center relative">
          <button
            onClick={onBack}
            className="absolute left-0 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors"
            aria-label="뒤로 가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-center">프로필 사진 등록</h2>
        </div>
        <div className="space-y-2">
          <Progress value={100} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">5/5 단계 · 마지막이에요</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* 좋은 사진 가이드 (등급·점수 없음 — 색깔만 유효) */}
        <div className="bg-secondary border border-border rounded-xl p-5">
          <h3 className="text-foreground mb-3 font-medium">좋은 사진 고르는 법</h3>
          <div className="space-y-2 text-sm text-foreground/80">
            <p>· 남이 찍어준 자연스러운 사진</p>
            <p>· 얼굴이 선명하게 보이는 사진</p>
            <p>· 전신과 다양한 상황이 담긴 사진</p>
            <p className="text-muted-foreground">사진이 많을수록 매칭 확률이 올라가요</p>
          </div>
        </div>

        {/* Guide Text */}
        <div className="bg-secondary border border-border rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-foreground mb-1">셀카는 승인 거절될 수 있어요</h3>
              <p className="text-sm text-muted-foreground">
                남이 찍어준 자연스러운 사진만 올려주세요. 최대 6장까지 등록할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Photo Upload Areas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>프로필 사진 (최대 6장)</Label>
            <p className="text-sm text-muted-foreground">{uploadedCount}/6장</p>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            첫 번째 사진이 <span className="font-medium text-foreground">대표 사진</span>으로 사용돼요
          </p>
          {/* Hidden file input for photos */}
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/heic,image/webp"
            className="hidden"
            onChange={handlePhotoFileChange}
          />
          <div className="grid grid-cols-3 gap-4">
            {photos.map((photo, index) => (
              <div
                key={index}
                className={`relative aspect-square bg-muted rounded-xl border-2 border-solid overflow-hidden ${
                  index === 0 ? 'border-primary ring-2 ring-primary/20' : 'border-border'
                }`}
              >
                <img src={photo} alt={`사진 ${index + 1}`} className="w-full h-full object-cover" />
                {index === 0 && (
                  <div className="absolute top-1.5 left-1.5 bg-brand-soft text-gold-strong rounded-full px-2 py-0.5 text-xs font-semibold">
                    대표
                  </div>
                )}
                <button
                  onClick={(e) => handleRemovePhoto(index, e)}
                  className="absolute top-0 right-0 w-8 h-8 bg-black/60 text-white rounded-bl-xl flex items-center justify-center"
                  aria-label="사진 삭제"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={openPhotoPicker}
                className="relative aspect-square bg-muted rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-colors flex flex-col items-center justify-center gap-1"
                aria-label="사진 추가"
              >
                <Plus className="w-6 h-6 text-border" />
                <span className="text-xs text-muted-foreground/50">사진 추가</span>
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            권장: 3:4 세로 또는 1:1 정사각형, JPG/PNG/HEIC, 최대 10MB
          </p>
        </div>

        {/* Video Upload */}
        <div>
          <Label className="mb-3 block">프로필 동영상 (선택)</Label>
          <input
            ref={videoInputRef}
            type="file"
            accept="video/mp4,video/quicktime,video/mov"
            className="hidden"
            onChange={handleVideoFileChange}
          />
          <div className="grid grid-cols-3 gap-4">
            <div
              className={`relative aspect-square rounded-xl border-2 border-dashed overflow-hidden transition-colors cursor-pointer ${
                video
                  ? 'border-primary bg-secondary'
                  : 'border-border bg-muted hover:border-primary/40'
              }`}
              onClick={() => !video && videoInputRef.current?.click()}
            >
              {video ? (
                <>
                  <video src={video} className="w-full h-full object-cover" muted />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    <Play className="w-8 h-8 text-white fill-white" />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setVideo(null); setVideoFile(null); }}
                    className="absolute top-0 right-0 w-8 h-8 bg-black/60 text-white rounded-bl-xl flex items-center justify-center"
                    aria-label="동영상 삭제"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Video className="w-8 h-8 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground text-center px-1">동영상 추가</p>
                </div>
              )}
            </div>
            {!video && (
              <div className="col-span-2 flex flex-col justify-center space-y-1 text-sm text-foreground/80">
                <p className="font-medium">동영상을 추가하면 더 잘 전달돼요</p>
                <p className="text-xs text-muted-foreground">• 5~30초 분량</p>
                <p className="text-xs text-muted-foreground">• MP4/MOV 형식</p>
                <p className="text-xs text-muted-foreground">• 최대 50MB</p>
                <p className="mt-2 text-xs text-muted-foreground/80">왼쪽 칸을 눌러 동영상을 선택하세요</p>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            얼굴이 잘 보이는 자연스러운 동영상을 올려주세요
          </p>
        </div>

        {/* Request Photo Button */}
        <Button
          onClick={handleShareRequest}
          variant="outline"
          className="w-full h-14 border-2 border-border text-foreground hover:bg-muted"
        >
          <Share2 className="w-5 h-5 mr-2" />
          친구에게 인생샷 요청하기
        </Button>

        {/* Next Button */}
        <Button
          onClick={() => {
            if (uploadedCount === 0) {
              toast.warning("사진이 없으면 매칭 확률이 낮아져요. 정말 진행하시겠어요?", {
                action: { label: "계속하기", onClick: () => onNext({ photos, mainPhotoIndex, video }) },
                duration: 6000,
              });
              return;
            }
            onNext({ photos, mainPhotoIndex, video });
          }}
          disabled={isUploading}
          className="w-full h-14 bg-brand-soft text-gold-strong"
        >
          {isUploading ? "업로드 중..." : "다음 — AI 프로필 만들기"}
        </Button>

        {uploadedCount === 0 && (
          <p className="text-sm text-center text-muted-foreground">
            사진을 등록하면 매칭 가능성이 높아집니다
          </p>
        )}
      </div>
    </div>
  );
}
