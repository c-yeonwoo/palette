import { useState } from "react";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import { Upload, Share2, Camera, Plus, Video, Star, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface PhotoUploadScreenProps {
  onNext: () => void;
}

export function PhotoUploadScreen({ onNext }: PhotoUploadScreenProps) {
  const [photos, setPhotos] = useState<(string | null)[]>(Array(10).fill(null));
  const [mainPhotoIndex, setMainPhotoIndex] = useState(0);
  const [video, setVideo] = useState<string | null>(null);
  
  // Mock trust score calculation
  const photoCount = photos.filter(p => p !== null).length;
  const hasVideo = video !== null;
  const trustScore = Math.min(100, photoCount * 10 + (hasVideo ? 50 : 0));
  
  const getTrustLevel = (score: number) => {
    if (score >= 71) return { level: "Gold", circles: 3, color: "text-amber-500" };
    if (score >= 41) return { level: "Silver", circles: 2, color: "text-slate-400" };
    return { level: "Bronze", circles: 1, color: "text-orange-600" };
  };

  const trustLevel = getTrustLevel(trustScore);
  const uploadedCount = photos.filter(p => p !== null).length;
  const isValid = uploadedCount >= 3;

  const handleShareRequest = () => {
    toast.success("친구에게 사진 요청 링크가 복사되었습니다!");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with Progress */}
      <div className="bg-card border-b border-border px-6 py-4 space-y-3">
        <h2 className="text-center">프로필 사진 등록</h2>
        <div className="space-y-2">
          <Progress value={40} className="h-2" />
          <p className="text-sm text-muted-foreground text-center">2/5 단계 - 약 5분 소요</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Trust Score Display */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-amber-900 mb-1">신뢰도 점수</h3>
              <p className="text-sm text-amber-700">
                사진이 많을수록 신뢰도가 올라가요
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${trustLevel.color}`}>
                {trustScore}점
              </div>
              <div className="flex gap-1 mt-1 justify-end">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-full ${
                      i < trustLevel.circles ? trustLevel.color.replace('text', 'bg') : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>
              <p className="text-xs text-slate-600 mt-1">{trustLevel.level}</p>
            </div>
          </div>

          {/* Trust Score Tips */}
          <div className="bg-white rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-slate-900 mb-2">신뢰도 높이는 방법:</p>
            <div className="space-y-1.5 text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>타인 촬영 사진: +20점</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>전신 사진: +15점</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span>다양한 상황 사진: +10점</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                <span className="font-medium">동영상 업로드: +50점</span>
              </div>
            </div>
          </div>
        </div>

        {/* Guide Text */}
        <div className="bg-pink-50 border border-pink-200 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Camera className="w-5 h-5 text-pink-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-pink-900 mb-1">셀카는 등록할 수 없어요</h3>
              <p className="text-sm text-pink-700">
                남이 찍어준 자연스러운 사진만 올려주세요. 최소 3장, 최대 10장까지 등록할 수 있습니다.
              </p>
            </div>
          </div>
        </div>

        {/* Photo Upload Areas */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label>프로필 사진 * (최소 3장, 최대 10장)</Label>
            <p className="text-sm text-slate-600">{uploadedCount}/10장</p>
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            <Star className="w-4 h-4 inline text-amber-500" /> 표시된 사진이 메인 프로필로 사용됩니다
          </p>
          <div className="grid grid-cols-5 gap-3">
            {photos.map((photo, index) => (
              <div
                key={index}
                className={`relative aspect-square bg-slate-50 rounded-xl border-2 border-dashed overflow-hidden hover:border-pink-300 transition-colors cursor-pointer ${
                  index === mainPhotoIndex 
                    ? 'border-pink-400 border-solid ring-2 ring-pink-200' 
                    : 'border-slate-200'
                }`}
                onClick={() => photo && setMainPhotoIndex(index)}
              >
                {photo ? (
                  <>
                    <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    {index === mainPhotoIndex && (
                      <div className="absolute top-1 right-1 bg-pink-500 text-white rounded-full p-1">
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-slate-300" />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            💡 권장: 3:4 세로 또는 1:1 정사각형, JPG/PNG/HEIC, 최대 10MB
          </p>
        </div>

        {/* Video Upload */}
        <div>
          <Label className="mb-3 block">프로필 동영상 (선택) - 신뢰도 +50점!</Label>
          <div className="grid grid-cols-5 gap-3">
            <div className={`relative aspect-square rounded-xl border-2 border-dashed overflow-hidden transition-colors cursor-pointer ${
              video ? 'border-amber-400 bg-amber-50' : 'border-orange-200 bg-gradient-to-br from-pink-50 to-orange-50 hover:border-orange-300'
            }`}>
              {video ? (
                <video src={video} className="w-full h-full object-cover" />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                  <Video className="w-6 h-6 text-orange-400" />
                  <p className="text-xs text-orange-600">동영상</p>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            💡 5-30초 권장, MP4/MOV, 최대 50MB
          </p>
        </div>

        {/* Request Photo Button */}
        <Button
          onClick={handleShareRequest}
          variant="outline"
          className="w-full h-14 border-2 border-rose-300 text-rose-700 hover:bg-rose-50"
        >
          <Share2 className="w-5 h-5 mr-2" />
          친구에게 인생샷 요청하기
        </Button>

        {/* Next Button */}
        <Button
          onClick={onNext}
          disabled={!isValid}
          className="w-full h-14 bg-gradient-to-r from-pink-400 to-rose-400 text-white disabled:opacity-50"
        >
          다음 - 자기소개 작성
        </Button>

        {!isValid && (
          <p className="text-sm text-center text-rose-600">
            최소 3장의 사진을 등록해주세요
          </p>
        )}
      </div>
    </div>
  );
}
