# 0061 — 홈/온보딩 정리 (컬러 궁합 mock 제거·게이팅, 분석 카피, 네비 여백)

- **상태**: Accepted
- **결정일**: 2026-06-14
- **결정자**: ys.choi
- **선행**: ADR 0056(다근거 색 분석), 0020대(신규 가입자 mock 격리)

## 컨텍스트

베타 신규 유저 홈에서 세 가지 거슬리는 점:
1. AI 프로필 분석 로딩 카피가 "답변만" 보는 것처럼 읽혀, 실제로 답변+MBTI+사주를 종합한다는 게 안 드러남.
2. "오늘의 컬러 궁합"(DailyMatchBanner)이 **내 팔레트 컬러가 나오기 전에도** 노출되고, localStorage mock(`palette_color_test`, 없으면 orange fallback) 기반이라 가짜 데이터가 보였다.
3. 홈 피드(MainFeedScreen) 하단 여백(`pb-20`=80px)이 고정 하단 네비(60px) + `env(safe-area-inset-bottom)`(노치 ~34px) 보다 작아, 노치 기기에서 맨 아래 콘텐츠가 네비에 가렸다.

## 결정

1. **분석 로딩 카피**: `AIProfileEnhanceScreen.LOADING_STEPS` 를 답변→성격·MBTI→사주 오행→종합 소개글 순으로 바꿔, 세 신호를 함께 본다는 걸 명시.
2. **컬러 궁합 게이팅 + mock 제거**:
   - `DailyMatchBanner` 가 `myColorType`(백엔드 enum) prop 을 받아 `BACKEND_TO_KEY` 로 매핑해 사용. localStorage `getMyColorType()` 의존 제거.
   - 컬러가 없으면(`null`) 컴포넌트가 `null` 반환 → 미노출. MainFeed 도 `myColor` 있을 때만 렌더.
   - (참고) 일일 포춘 점수/추천색은 실제 매칭이 아니라 컬러+날짜 결정론 연출 — 내 컬러 확정 후에만 가벼운 위젯으로 노출.
3. **네비 여백**: MainFeedScreen 루트 `pb-20` → `pb-28`(112px) 로 상향, 네비+safe-area 를 확실히 비움. (다른 네비 화면 MyPage/Introduction 은 이미 `pb-24`)

### 하단 네비 위치 — 버그 아님 (검증 완료)
프리뷰로 확인: 모바일(<768px)은 프레임 스타일 off → `fixed bottom-0` 가 뷰포트 하단에 정상 고정. 데스크탑(≥768px)은 `.app-frame` 의 `transform`(containing block)으로 프레임 하단에 고정 — 둘 다 정상. 사용자 스크린샷의 "네비가 중간에" 는 풀페이지 캡처 아티팩트. 실제 가림 원인은 위 (3) 여백 부족이라 그 부분만 보정.

## 검증
- `npm run build` + `vitest run` 그린(로딩 카피 테스트 갱신).
- 프리뷰 probe 로 `fixed` 고정 동작 모바일/데스크탑 양쪽 확인.
