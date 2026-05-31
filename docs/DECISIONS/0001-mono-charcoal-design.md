# 0001 — 모노톤 차콜 디자인 시스템

- **상태**: Accepted
- **결정일**: 2026-05-30
- **결정자**: ys.choi

## 컨텍스트

- 초기 디자인 시스템의 primary 색이 `#B5703A` (갈색-오렌지, 채도 51%) 였음 — 사용자가 "칙칙하다" 평가.
- "Palette" 서비스 컨셉상 **8가지 컬러 타입(Orange/Blue/Red/Pink/Green/Purple/Yellow/Gray)이 주인공**.
- 단일 강한 brand 색을 두면 8 컬러가 도드라지지 않음 → 콘셉트 충돌.
- 사용자 요구: 진중함 + 진정성 + 고급스러움. "둥글둥글 귀여운" 느낌 ↓.

## 검토한 옵션

| 옵션 | 톤 | 평가 |
|---|---|---|
| Deep Sienna (#7B4A2E) | 갈색-오렌지 진하게 | 갈색 톤이 여전히 8 컬러와 경쟁 |
| Deep Plum/Wine (#3A1F36) | 자주 | 데이팅 무드 좋지만 강함 |
| Ink Navy (#1A2236) | 네이비 | 신뢰감 좋으나 따뜻한 컬러와 충돌 |
| **Warm Ink/Charcoal (#2E2A24)** | 따뜻한 거의 검정 | ✅ 무대 역할, 8 컬러 모두 받쳐줌 |

## 결정

**Primary = `#2E2A24`** (Warm Charcoal, HSL ~30°/10%/16%).
- 거의 검정에 가까운 따뜻한 톤 (foreground `#1A1916` 과 차별)
- Background: `#FAF8F4` (warm off-white, 종이 느낌)
- Border/Secondary/Muted/Accent: 채도 매우 낮은 warm sand 계열로 통일
- 8 컬러 토큰(`--ct-{color}-*`) 은 그대로 유지 — 사용자 컬러 타입 / 호환성 칩 / 시그널 배지 등에서 빛남
- Radius 25% 축소 (16px → 12px 등), pill 만 유지

## 영향

- `frontend/src/styles/theme.css` 의 shadcn bridge layer 변경
- 다크 모드는 반전: `--primary: #F0EDE8` (밝은 페이퍼톤)
- 사용자 컬러 타입 결과 화면에서 카드 gradient 가 더 도드라짐
- 디자인 토큰만 사용 룰 강화 — raw hex `#xxx` 사용 시 reviewer 차단

## 대안 / 미래

- 8 컬러 타입의 user accent (`--accent-h/s/l`) 가 화면 부분에 적용되는 패턴은 유지 (P3 의도)
- 추가 디자인 토큰 변경은 새 ADR 로
