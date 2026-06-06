# 0025 — "오늘의 추천" 홈 상단 배치 + AI 추천 구독 패스

- **상태**: Accepted
- **결정일**: 2026-06-06
- **결정자**: ys.choi

## 컨텍스트

AI 추천(AI Signal) 카드가 피드 하단의 "준비 중" 가로 스크롤로 묻혀 거의 노출되지 않았다. 추천은 색 궁합 기반의 핵심 가치인데도 발견되지 않았고, 과금 모델은 카드 1장당 1,000원(legacy per-card unlock)으로 결제 마찰이 컸다.

요구: (1) "오늘의 추천"을 홈 최상단에 선제 노출, (2) 무료 1장 미리보기 + 나머지는 강한 과금 또는 구독, (3) 요금 정책과 카드 구좌 조합 정리.

## 결정

### 1. 과금 모델 = AI 추천 구독 패스 (구독제)

per-card 결제 → **월 구독(₩9,900/월)**으로 전환.

| 구분 | 비구독자 | 구독자 |
|------|----------|--------|
| 오늘의 추천 | 매일 1장 무료 미리보기 (궁합 % 티저, 상세 잠금) | 무제한 열람 |
| 궁합 리포트 | ✗ | ✓ |

- 무료 1장은 그대로 유지(유입·습관 형성), 2번째부터 구독 게이팅.
- legacy `/unlock`(per-card 1,000원)은 호환 위해 남기되 프론트는 더 이상 호출 안 함.

### 2. 백엔드 (`AiSignalController` + 신규 엔티티)

- `AiPassSubscriptionEntity`(user_id unique, started_at, expires_at) + `AiPassSubscriptionJpaRepository`. ddl-auto=update로 `ai_pass_subscriptions` 자동 생성.
- `GET /api/v1/feed/ai-signal` 응답 확장: `isSubscriber`, `passPriceMonthly`(9900), `passExpiresAt`, 그리고 추천별 `requiresPass`, `teaserColorType`(잠긴 카드도 색만 노출 → 프론트가 궁합 % 티저 계산, matrix는 프론트 단일 소스 유지).
- `isUnlocked = isFree || isSubscriber || (legacy)당일결제`.
- `POST /api/v1/feed/ai-signal/subscribe`: stub 모드(=Toss secret 미설정/placeholder)에서는 결제 없이 30일 패스 활성화(베타 체험); 실 결제 모드에서는 `paymentKey` 없으면 402. 갱신 시 잔여 기간에 30일 가산.
- 결제 stub 판단은 `OpenAIService.isStubMode` 패턴 그대로(`toss.payments.secret-key` blank/dummy/placeholder).

### 3. 프론트 (`MainFeedScreen`)

- 섹션 타이틀 "색깔로 찾은 인연 (준비 중)" → **"오늘의 추천" + "프로필 궁합도를 기반으로 추천해드려요"**. 피드 최상단 유지.
- 잠긴 카드: 궁합 % 티저 + "구독하고 보기" → 구독 시트(`AiPassPaywall`) 오픈. 혜택 3종 + ₩9,900/월 + 구독 CTA.
- 비구독자에겐 섹션 하단에 "매일 무제한 추천 + 궁합 리포트 · 월 9,900원" 유도 바.
- 구독자: 카드 모두 열림 + 궁합 배지 노출.

## 결과

- 로컬 e2e: 비구독 시 card0 무료/열림·card1 `requiresPass=true`/잠금 → `POST /subscribe`(stub) → 30일 패스 → 재조회 시 `isSubscriber=true`, 두 카드 모두 열림. 확인 완료.
- compileKotlin / vite build / vitest(40) 통과.

## 후속 (Phase 2 백로그)

- Toss Payments **정기결제(빌링)** 연동 — 현재는 stub 활성화. 결제 검증·영수증·해지/환불(POLICY §2 정렬) 필요.
- 추천 알고리즘을 벡터 유사도로 교체(Phase 3) 시 "궁합 리포트" 콘텐츠 고도화.
- 구독 상태 노출 위치(마이페이지 등) 및 갱신/해지 UI.
