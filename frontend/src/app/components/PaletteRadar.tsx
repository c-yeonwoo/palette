/**
 * PaletteRadar — 팔레트 매력 육각형 (ADR 0070)
 * 6축(온기·활력·깊이·감성·진정성·균형) 0~100 분포를 손으로 그린 SVG 레이더.
 * 외부 차트 라이브러리 의존 없음. '완벽한 정육각형이 정답이 아니다'를 시각적으로 보여주는 비대칭 모양.
 */

interface PaletteRadarProps {
  /** 축 -> 0~100 점수. 누락 축은 0 으로. */
  scores: Record<string, number>;
  /** 폴리곤/포인트 색 (색깔 hex) */
  color: string;
  size?: number;
}

const AXES = ["온기", "활력", "깊이", "감성", "진정성", "균형"];

export function PaletteRadar({ scores, color, size = 260 }: PaletteRadarProps) {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.3;            // 최대 반경
  const labelR = R + size * 0.085; // 라벨 위치

  // i번째 축의 각도(라디안) — 맨 위(-90°)에서 시계방향 60°씩
  const angleOf = (i: number) => ((-90 + i * 60) * Math.PI) / 180;
  const pt = (i: number, radius: number) => ({
    x: cx + radius * Math.cos(angleOf(i)),
    y: cy + radius * Math.sin(angleOf(i)),
  });

  const polygon = (radius: number) =>
    AXES.map((_, i) => {
      const p = pt(i, radius);
      return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    }).join(" ");

  const valuePolygon = AXES.map((axis, i) => {
    const v = Math.max(0, Math.min(100, scores[axis] ?? 0));
    const p = pt(i, (R * v) / 100);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");

  const rings = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width="100%" style={{ maxWidth: size, display: "block", margin: "0 auto" }}>
      {/* 그리드 */}
      {rings.map((r, idx) => (
        <polygon
          key={idx}
          points={polygon(R * r)}
          fill="none"
          stroke="hsl(var(--border))"
          strokeWidth={1}
          opacity={0.7}
        />
      ))}
      {/* 축 스포크 */}
      {AXES.map((_, i) => {
        const p = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="hsl(var(--border))" strokeWidth={1} opacity={0.6} />;
      })}
      {/* 값 폴리곤 */}
      <polygon points={valuePolygon} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      {/* 꼭짓점 점 */}
      {AXES.map((axis, i) => {
        const v = Math.max(0, Math.min(100, scores[axis] ?? 0));
        const p = pt(i, (R * v) / 100);
        return <circle key={i} cx={p.x} cy={p.y} r={3} fill={color} />;
      })}
      {/* 라벨 + 점수 */}
      {AXES.map((axis, i) => {
        const p = pt(i, labelR);
        const v = Math.round(scores[axis] ?? 0);
        const anchor = Math.abs(p.x - cx) < 6 ? "middle" : p.x > cx ? "start" : "end";
        return (
          <text key={i} x={p.x} y={p.y} textAnchor={anchor} dominantBaseline="middle" style={{ fontSize: size * 0.05, fontWeight: 700 }} fill="hsl(var(--foreground))">
            <tspan>{axis}</tspan>
            <tspan x={p.x} dy={size * 0.052} style={{ fontSize: size * 0.042, fontWeight: 600 }} fill={color}>{v}</tspan>
          </text>
        );
      })}
    </svg>
  );
}
