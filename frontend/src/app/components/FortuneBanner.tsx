import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { api } from "../../lib/api/apiClient";
import { COLOR_META, getComplementaryType, type ColorType } from "../../lib/colorCompatibility";

interface Fortune {
  date: string;
  title: string;
  message: string;
  luckyColor: string;
  luckyColorHex: string;
  luckyNumber: number;
  compatibilityHint: string;
  loveScore: number;
}

interface MyColorInfo {
  type: ColorType | null;
  name: string | null;
  hex: string | null;
}

export function FortuneBanner() {
  const [fortune, setFortune] = useState<Fortune | null>(null);
  const [myColor, setMyColor] = useState<MyColorInfo | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Fortune>("/api/v1/fortune/today").catch(() => null),
      api.get<{ colorType: MyColorInfo }>("/api/v1/profile").catch(() => null),
    ]).then(([fortuneData, profileData]) => {
      setFortune(fortuneData);
      setMyColor(profileData?.colorType ?? null);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="mx-4 mb-4 h-14 rounded-2xl bg-muted animate-pulse" />;
  }

  const myType = myColor?.type as ColorType | null;
  const compatibleType = getComplementaryType(myType);
  const compatibleMeta = compatibleType ? COLOR_META[compatibleType] : null;
  const myMeta = myType ? COLOR_META[myType] : null;

  // 운세 점수를 love score 기반으로 표시
  const score = fortune?.loveScore ?? 3;

  return (
    <div className="px-4 mb-4">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left rounded-2xl bg-card border border-border shadow-sm overflow-hidden"
      >
        {/* 접힌 상태 */}
        <div className="flex items-center gap-3 px-4 py-3.5">
          {/* 색깔 도트 두 개 */}
          <div className="flex items-center flex-shrink-0">
            <span
              className="w-7 h-7 rounded-full border-2 border-white shadow-sm"
              style={{ backgroundColor: myMeta?.hex ?? "#e5e7eb" }}
            />
            {compatibleMeta && (
              <span
                className="w-7 h-7 rounded-full border-2 border-white shadow-sm -ml-2"
                style={{ backgroundColor: compatibleMeta.hex }}
              />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground font-medium mb-0.5 uppercase tracking-wider">오늘의 색깔 매칭</p>
            <p className="text-sm font-semibold text-foreground truncate">
              {myMeta && compatibleMeta
                ? `${myMeta.name}과 ${compatibleMeta.name}의 인연`
                : fortune?.title ?? "오늘의 인연을 확인해보세요"}
            </p>
          </div>

          {/* 점수 바 */}
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className="text-sm"
                style={{ opacity: i < score ? 1 : 0.15 }}
              >
                ♥
              </span>
            ))}
          </div>

          {expanded
            ? <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-1" />
            : <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0 ml-1" />
          }
        </div>

        {/* 펼친 상태 */}
        {expanded && (
          <div className="border-t border-border px-4 pb-4 pt-3 space-y-3">
            {/* 색깔 궁합 설명 */}
            {myMeta && compatibleMeta ? (
              <div className="flex items-start gap-3">
                {/* 두 색깔 시각화 */}
                <div className="flex flex-col items-center gap-1 flex-shrink-0 pt-0.5">
                  <span
                    className="w-8 h-8 rounded-full shadow-sm border border-white"
                    style={{ backgroundColor: myMeta.hex }}
                  />
                  <span className="text-xs text-muted-foreground">나</span>
                  <div className="w-px h-3 bg-border" />
                  <span
                    className="w-8 h-8 rounded-full shadow-sm border border-white"
                    style={{ backgroundColor: compatibleMeta.hex }}
                  />
                  <span className="text-xs text-muted-foreground">인연</span>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-foreground mb-1">
                    {myMeta.name} × {compatibleMeta.name}
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {fortune?.compatibilityHint
                      ?? `오늘 주변의 ${compatibleMeta.personality} 사람에게 주목해보세요. 피드에서 확인할 수 있어요.`}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {fortune?.message ?? "프로필에서 색깔 타입을 설정하면 오늘의 궁합을 볼 수 있어요."}
              </p>
            )}

            {/* 오늘의 운세 메시지 (fortune 있을 때만) */}
            {fortune?.message && (
              <div className="bg-muted rounded-xl px-3.5 py-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">오늘의 한마디</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{fortune.message}</p>
              </div>
            )}

            {/* 피드 유도 */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                {compatibleMeta
                  ? `피드에서 ${compatibleMeta.name} 타입을 찾아보세요`
                  : "지인 피드에서 오늘의 인연을 만나보세요"}
              </p>
              <span className="text-xs font-semibold text-foreground">피드 보기 →</span>
            </div>
          </div>
        )}
      </button>
    </div>
  );
}
