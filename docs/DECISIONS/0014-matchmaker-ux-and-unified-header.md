# 0014 — 주선자 전용 UX 단순화 + 공통 헤더 통일

- **상태**: Accepted
- **결정일**: 2026-05-31
- **결정자**: ys.choi

## 컨텍스트

베타 운영 중 주선자 전용 계정(`MATCHMAKER_ONLY`) 으로 가입해본 결과:

1. **홈 화면에 필터 노출** — 주선자는 일반 매칭 흐름 안 쓰는데 필터 UI 가 보임 (혼란)
2. **하단 4탭 (홈/소개/주선/나)** — 홈/소개는 주선자에게 의미 없음
3. **화면별 헤더 UI 일관성 부족** — MainFeed 는 26px hero, IntroductionHistory 는 sticky h-14, ConnectorDashboard 는 inline 18px h2, MyPage 는 큰 hero — 4가지가 다 다름

## 결정

### 1. 주선자 전용 UX (`MATCHMAKER_ONLY`)
- **BottomNavigation 2탭** — "주선 대시보드" + "나" (홈/소개 제거)
- **로그인 직후 진입 화면** — `mainFeed` 가 아닌 `connectorDashboard`
- **MainFeedScreen** fallback — 주선자가 어떤 경로로 진입해도 필터 버튼 + 활성 필터 칩 숨김
- **REGULAR 사용자는 기존 4탭 그대로** — REGULAR 도 주선자 활동 가능하므로 "주선" 탭 유지

### 2. 공통 헤더 패턴 (모든 화면 통일)

```tsx
<header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
  <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
    <div className="flex items-center gap-2">
      {onBack && (
        <button onClick={onBack} className="p-1.5 rounded-full hover:bg-muted/50 -ml-1.5">
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      <h1 className="text-base font-bold text-foreground">{title}</h1>
    </div>
    <div className="flex items-center gap-2">{actions}</div>
  </div>
</header>
```

규칙:
- **sticky top-0 z-10** — 스크롤 시 헤더 고정 (모바일 표준)
- **bg-background/95 + backdrop-blur** — 반투명 (스크롤 콘텐츠가 살짝 비침)
- **border-b border-border** — 헤더-콘텐츠 구분
- **max-w-2xl + px-4 + h-14** — 모바일/태블릿 공통 너비/높이
- **h1 text-base font-bold** — 16px (브랜드 hero 는 콘텐츠 영역에서)
- **우측 액션 버튼** — `w-9 h-9 rounded-full + hover:bg-muted/50` 패턴

적용 화면:
- ✅ `MainFeedScreen` (eyebrow "팔레트" 제거, h1 → 16px)
- ✅ `IntroductionHistoryScreen` (이미 유사, border 토큰 통일)
- ✅ `ConnectorDashboard` (h2 18px → h1 16px, sticky + backdrop)
- ✅ `MyPageScreen` (큰 hero → sticky 헤더 + 아바타 영역 분리)

## 룰 (이후)

- 새 화면 추가 시 위 헤더 패턴 그대로 사용
- 16px 보다 큰 h1 (hero) 은 헤더 안이 아니라 콘텐츠 영역 첫 카드에 — brand identity 살릴 자리
- 하단 nav 추가 시 `accountType` 별 분기 검토
- `MATCHMAKER_ONLY` 가 진입하면 안 되는 화면 (`mainFeed`, `introductionHistory`, AI signal 등) — 진입 시 자동 redirect 또는 화면 안에서 fallback

## 영향

- 주선자 가입 직후 ConnectorDashboard 직진 (mainFeed 우회)
- 4 화면 헤더 톤 동일 — 시각 일관성 ↑, 모바일 표준 sticky pattern
- REGULAR 사용자 UX 변경 거의 없음 (MainFeed 의 hero "팔레트 / 주변 지인" 축소된 부분 정도)

## Follow-up

- 다른 화면 헤더 (NotificationScreen, AiHubScreen, ProfileEditScreen 등) 도 같은 패턴으로 — 발견 시 점진 적용
- 공통 `<AppHeader>` 컴포넌트 추출 검토 (현재는 동일 코드 4곳 — DRY 위반이긴 함)
- MATCHMAKER_ONLY 가 url 로 강제 진입 시 (`/mainFeed` 직접) 처리 — 현재는 화면 내부 fallback 만
- `authService.AuthUser.accountType` 타입 정정 (`'MATCHMAKER'` → `'MATCHMAKER_ONLY'`)
