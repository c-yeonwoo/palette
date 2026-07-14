/**
 * P2-004 — 공유 인사이트 카드 (개인정보 최소, 강점 3가지)
 */
import { Share2, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface ShareInsightCardProps {
  colorName?: string | null;
  strengths?: string[] | null;
  colorHex?: string | null;
}

export function ShareInsightCard({ colorName, strengths, colorHex }: ShareInsightCardProps) {
  const tags = strengths?.filter(Boolean).slice(0, 3) ?? [];
  if (tags.length === 0) return null;

  const handleShare = async () => {
    const text = [
      "팔레트가 본 나의 매력 ✨",
      colorName ? `나의 색: ${colorName}` : null,
      ...tags.map((t, i) => `${i + 1}. ${t}`),
      "https://www.palette.ai.kr",
    ].filter(Boolean).join("\n");

    try {
      if (navigator.share) {
        await navigator.share({ title: "Palette 인사이트", text });
      } else {
        await navigator.clipboard.writeText(text);
        toast.success("인사이트를 복사했어요 — 스토리에 붙여넣기 해보세요");
      }
    } catch {
      toast.error("공유에 실패했어요");
    }
  };

  return (
    <div
      className="rounded-2xl border border-border/60 bg-card p-4 shadow-card"
      style={colorHex ? { boxShadow: `inset 0 2px 0 ${colorHex}55` } : undefined}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-brand-strong" />
        <p className="text-sm font-bold text-foreground">내가 받은 강점 3가지</p>
      </div>
      <ul className="space-y-1 mb-3">
        {tags.map((t, i) => (
          <li key={i} className="text-xs text-muted-foreground">• {t}</li>
        ))}
      </ul>
      <button
        onClick={handleShare}
        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl bg-brand-soft text-brand-strong text-xs font-bold"
      >
        <Share2 className="w-3.5 h-3.5" />
        스토리로 공유하기
      </button>
    </div>
  );
}
