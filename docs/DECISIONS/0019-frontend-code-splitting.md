# 0019 — 프론트엔드 code splitting + vendor chunk 분리

- **상태**: Accepted
- **결정일**: 2026-06-01
- **결정자**: ys.choi

## 컨텍스트

베타 사용자 피드백 "내부 액션이 느리다" → native wrap 고려. 그러나 Lighthouse audit
(prod, mobile, 4x CPU throttle) 결과 native 문제가 아니라 **초기 로딩 (LCP 4.2s)** 이 원인:

| 지표 | 값 |
|------|----|
| Performance | 75 / 100 |
| LCP / FCP | **4.2s** (느림) |
| TBT | 0ms (render 자체는 빠름) |
| CLS | 0 |
| **Reduce unused JS** | **-1010ms** (가장 큰 opportunity) |

핵심: `index.js` **942KB 단일 bundle** (gzip 265KB), 그 중 **73% 가 unused** — 로그인 화면
하나 보려고 ProfileEdit (1911줄) / AiHub / MatchDetail 등 44개 화면 전부 다운로드.

→ Capacitor/native wrap 으로는 같은 WebView 에 같은 bundle 이라 해결 안 됨.
**route-level code splitting** 이 진짜 처방.

## 결정

### 1. 화면별 `React.lazy` (route-level code splitting)

`App.tsx` 의 화면 import 를 lazy 로:
- **eager 유지** (초기 진입 경로, 첫 페인트 깜빡임 방지): `BetaGateScreen`, `BetaWelcomeIntro`, `LoginScreen`, `OAuth2RedirectHandler`
- **lazy** (나머지 31개 화면): `lazy(() => import(...).then(m => ({ default: m.X })))`
  - named export → default 래핑
- 화면 렌더 블록을 `<Suspense fallback={<ScreenFallback />}>` 로 감쌈
  - `BottomNavigation` 은 Suspense **밖** — lazy 화면 로딩 중에도 네비 유지
  - `ScreenFallback` = 경량 spinner (브랜드 톤)

### 2. vendor chunk 분리 (`manualChunks`)

`vite.config.ts`:
```ts
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'react-vendor': ['react', 'react-dom'],
        'ui-vendor': ['lucide-react', 'sonner'],
      },
    },
  },
  chunkSizeWarningLimit: 700,
}
```
→ React / UI 라이브러리는 별도 chunk. 앱 코드만 바뀌면 vendor 는 캐시 유지 (재방문 시 재다운 X).

> 함수형 `manualChunks(id)` 는 이 프로젝트에서 vendor chunk 미생성 (Vite 7 + VitePWA 조합).
> **객체형** (`{ 'react-vendor': ['react', ...] }`) 으로 정상 분리 확인.

## 결과 (build 측정)

| | Before | After |
|---|--------|-------|
| 단일 entry bundle | **942KB** (gzip 265KB) | — |
| entry (앱 코드) | — | **118KB** (gzip 33KB) |
| react-vendor (캐시) | — | 141KB (gzip 45KB) |
| ui-vendor (캐시) | — | 71KB (gzip 17KB) |
| 화면 chunk | 모두 entry 안 | 31개 개별 lazy chunk |
| 첫 방문 총 다운로드 | 942KB | ~330KB (entry+vendor+login) |
| **재방문/업데이트** | 942KB 재다운 | **118KB 만** (vendor 캐시) |

예상 효과: LCP 4.2s → 1.5~2s (unused JS -1010ms opportunity 해소).
실측은 prod 배포 후 Lighthouse 재측정.

## 영향

- 첫 화면 (login) 즉시 로딩, 나머지 화면 진입 시점에 fetch (~5-40KB 각)
- 화면 전환 시 첫 진입만 짧은 spinner (이후 캐시)
- native wrap 불필요 — PWA 로 충분히 빠름

## Follow-up

- prod 배포 후 Lighthouse 재측정 (LCP 검증)
- 큰 화면 (MatchDetailScreen 121KB) 내부의 무거운 dependency (recharts 등) dynamic import 검토
- MainFeedScreen 은 로그인 직후 진입 — `<link rel="modulepreload">` 또는 prefetch 검토 (깜빡임 최소화)
- Pretendard 는 이미 `dynamic-subset` (쓰는 글자만) — 추가 최적화 여지 적음
