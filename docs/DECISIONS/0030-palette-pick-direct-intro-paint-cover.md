# 0030 — 팔레트 Pick 직접 소개(AI 주선) + 물감 커버 복원 + 홈 디테일

- **상태**: Accepted (ADR 0029의 무지개 커버 대체)
- **결정일**: 2026-06-07
- **결정자**: ys.choi

## 컨텍스트

홈/대시보드/상세 피드백:
- 팔레트 Pick(AI 추천)으로 본 프로필은 공통 친구가 없어 "소개 요청을 하려면 공통 친구가 필요해요" 스낵바만 떠 막다른 길.
- 카드 커버를 무지개 그라디언트로 했더니 "원하던 물감 이미지가 아님" — 예전 `paint-overlay.png`를 원함.
- 주선 대시보드 상단이 정보·황금색 과다로 피로.
- 페이지 좌우가 너무 꽉 참. 내 프로필 상세에 내 색 배경 미적용. 인연 탭 타이틀이 "소개".

## 결정

### 1. 팔레트 Pick = AI 직접 소개 (도메인 변경)
- 팔레트 Pick으로 진입한 상세(`degree === 0`)는 공통 친구 게이트를 건너뛰고 **"소개 요청하기"** 버튼을 바로 노출.
- 누르면 `POST /api/v1/matchmaking/direct` → **주선자 단계 자동 승인**, 대상자 응답 대기(`MATCHMAKER_APPROVED`) 상태로 생성 → 대상자에게 즉시 전달(알림 `MatchmakingApproved`, 주선자명 "팔레트 Pick").
- 도메인: `MatchmakingRequest.createDirect()` 추가. `matchmakerId`는 비-null 제약 충족용 요청자 본인 placeholder(주선자 통계 미반영). rate limit·차단·소개받기 OFF 가드는 일반 요청과 동일.
- 사람 주선자 경로(`/request`, 2단계 승인)는 그대로.

### 2. 카드 커버 = 물감 이미지 복원 (무지개 폐기)
- `frontend/public/paint-overlay.png`를 git 이력(blob a38d9c1)에서 복원(896f84b에서 삭제됐던 자산).
- `PALETTE_COVER_STYLE`을 무지개 그라디언트 → `url('/paint-overlay.png')` cover 로 교체. 텍스트는 프로스트 화이트 칩 유지.

### 3. 주선 대시보드 상단 정리 + 골드 감축
- 등급 strip padding ↑(py-3→py-4), Lv 배지 골드→중립(`bg-secondary`, 아이콘만 골드), 탭 배지 골드→`bg-primary/10`, 남/여 토글 활성 골드→중립 카드. 골드는 진행바 등 포인트에만.

### 4. 기타
- 페이지 좌우 inset 16→20px(`max-w-2xl mx-auto px-5`, 전 화면).
- 내 프로필 상세 배경에 내 색 워시 적용(ProfileDetail과 동일 패턴).
- 인연 탭 헤더 타이틀 "소개"→"인연".

## 결과

- 팔레트 Pick에서 공통 친구 없이도 바로 소개 요청 가능(AI가 주선).
- 카드 커버가 물감 이미지로 복귀.
- compileKotlin / vite build / vitest(40) 통과.

## 후속 / 메모

- `/direct` 런타임 e2e는 백엔드 재기동 필요 — 컴파일 검증까지 완료, 라이브 호출 검증 예정.
- `paint-overlay.png`가 8MB(1792×2400)로 큼 → 피드 성능 위해 리사이즈/webp 최적화 백로그.
- ADR 0029의 무지개 커버 결정은 본 ADR로 대체.
