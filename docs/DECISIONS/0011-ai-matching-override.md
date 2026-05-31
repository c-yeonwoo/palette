# 0011 — AI 매칭 운영자 override (REPLACE / BLOCK)

- **상태**: Accepted
- **결정일**: 2026-05-31
- **결정자**: ys.choi

## 컨텍스트

PR #7 (ADR 0009) 에서 AI 시그널 추천이 stateful 로 전환됨. 운영자는 일자별 추천을 조회 가능 (read-only).
사용자 요구:
- 운영자가 추천 결과를 보고 **재매칭** 가능해야 함 (실제 프로필 보고 결정)
- 매칭 관리 메뉴는 **AI 매칭 / 주선자 풀** 두 갈래로 분리

PR #9 (계획) 의 운영자 override 를 앞당겨 PR #8 에 통합.

## 검토한 옵션

| 옵션 | 평가 |
|---|---|
| **A. REPLACE + BLOCK 2개 액션** | ✅ 사용자 의도와 1:1 매핑. PIN(강제 추가) 은 자리 부족(unique key (viewer,date,position)) 으로 REPLACE 와 사실상 동일 |
| B. PIN/REPLACE/BLOCK 3개 분리 | over-engineer. PIN 의 효과 = REPLACE 와 같음 (자리 차지) |
| C. 별도 entity (`AdminRecommendationOverride`) | layer 분리 깔끔하지만 베타 단계 over-engineer. 정책 변경 시 별도 PR 가능 |

## 결정

**옵션 A**. REPLACE 는 daily_recommendations row 의 target/source 직접 변경, BLOCK 은 별도 entity.

### 액션 의미
- **REPLACE**: 운영자가 viewer 의 특정 position 카드를 다른 사용자로 교체. `source = ADMIN_REPLACE`, 사유/변경자 기록.
- **BLOCK**: viewer x target 페어를 영구/한시 차단. AiSignalController 후보 필터에 적용. 별도 entity `admin_blocked_targets`.

### 백엔드 변경

**1) daily_recommendations 컬럼 추가** (V13):
- `override_reason VARCHAR(500)` — REPLACE 시 사유
- `overridden_by BINARY(16)` — 운영자 ID
- `overridden_at DATETIME(6)` — 변경 시각

**2) admin_blocked_targets entity 신설** (V13):
- `viewer_user_id`, `target_user_id` (unique pair)
- `reason` (필수), `created_by` (운영자), `created_at`, `expires_at` (null=영구)

**3) AdminRecommendationsController endpoint 3개 추가**:
- `PATCH /api/v1/admin/recommendations/{id}/replace` — body: `newTargetUserId`, `reason`
  - 자기 자신 / 같은 target 거부, 사유 필수
- `GET /api/v1/admin/recommendations/blocks/viewer/{viewerId}` — viewer 의 차단 목록
- `POST /api/v1/admin/recommendations/blocks` — 차단 추가 (viewer, target, reason, expiresAt?)
- `DELETE /api/v1/admin/recommendations/blocks/{id}` — 차단 해제

**4) AiSignalController 후보 필터 보강**:
- 기존 60일 추천 이력 제외 + 시드 격리 + 친구/매칭 제외
- 추가: `adminBlockedTargetRepo.findActiveBlockedTargetIds(viewer, today)` 조회 후 제외

### 프론트 변경

**1) AdminMatchingScreen 신설** (`/admin/matching`):
- 2-tab: AI 매칭 / 주선자 매칭 풀
- 주선자 풀 탭은 placeholder (다음 PR)

**2) AdminRecommendationsScreen 확장**:
- `embedded` prop — AdminMatchingScreen 안에서 호출 시 자체 header 생략
- 각 추천 row 에 "관리 →" 버튼
- 클릭 시 `RecommendationActionModal` 열림

**3) RecommendationActionModal**:
- 모드 선택: 교체 / 차단
- 교체: 사용자 검색 (`/api/v1/admin/users?q=` 재사용) + 사유 입력
- 차단: 사유 입력만
- SUSPENDED viewer 의 추천은 그대로 표시 (별도 fix)

**4) Dashboard 매칭 카드** path: `/admin/recommendations` → `/admin/matching` (이전 path 도 호환)

## 룰 (이후)

- REPLACE 시 자기 자신 / 같은 target / 빈 사유 거부 — 컨트롤러에서 강제
- BLOCK 의 expiresAt 은 LocalDate (Asia/Seoul) — 시간 단위 차단 불필요
- REPLACE 한 row 의 source 는 `ADMIN_REPLACE` — 다음 날 추천 계산에 그대로 영향 (60일 제외 룰 동일)
- BLOCK 은 미래 추천만 차단 — 이미 저장된 daily_recommendations row 는 그대로 (필요 시 별도 cleanup)

## 영향

- **사용자 화면 동작 동일** — viewer 가 AI 시그널 조회 시 BLOCK 된 target 자동 제외, REPLACE 된 결과는 그대로 노출
- DB 변경:
  - daily_recommendations 3 컬럼 추가 (nullable, 기존 row 영향 없음)
  - admin_blocked_targets 신규
- 운영자 화면 — Dashboard 매칭 카드 path 변경

## Follow-up

- 다음 PR: 주선자 매칭 풀 화면 (`MatchmakingRequest` 강제 관리)
- 차단 목록 별도 화면 (현재는 endpoint 만, 화면 미구현)
- REPLACE 시 audit log 별도 entity (`AdminAction`) — 누가 언제 어떻게 변경했는지 영구 기록
- 사용자 본인이 BLOCK 된 사실 모름 — UX 의도된 동작 (운영자 결정)
- 차단 만료된 row 자동 정리 (cleanup job) — 베타 단계 불필요
