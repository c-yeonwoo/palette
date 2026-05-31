# 0009 — AI 추천 시스템 stateless → stateful 전환

- **상태**: Accepted (PR #7 — 조회까지)
- **결정일**: 2026-05-31
- **결정자**: ys.choi

## 컨텍스트

기존 `AiSignalController` 는 매 호출마다 즉석 계산 (`shuffled(Random(date xor uid))`):
- 같은 viewer + 같은 날짜 → 같은 결과 (결정성 OK)
- 하지만 **DB 저장 안 됨** — 이력 추적 불가
- "한 번 추천된 사용자는 다시 추천 안 되어야 한다" 요구 미반영 (현재는 "본 적 있는 카드" 만 제외)
- 운영자 가시화 / 강제 변경 불가

운영 입장에서 필요한 것:
1. 일자별로 누구에게 어떤 카드가 추천됐는지 영구 기록
2. 추천된 적 있는 사용자는 N일간 재추천 안 함 (사용자 피로 ↓)
3. 다음 날 추천을 미리 계산 + 운영자가 강제 변경 가능

## 검토한 옵션

| 옵션 | 평가 |
|---|---|
| A. 그대로 두기 (stateless) | 운영 가시성 0, 요구 미반영 |
| B. **즉석 계산 결과를 DB 저장 (write-through cache)** | ✅ 단순. 첫 호출 시 저장, 이후 같은 결과 반환 |
| C. 사전 계산 scheduler (preCompute) | 운영자가 내일 미리 볼 수 있음. 다만 active user 모두에 대해 매일 작업 — 비용 큼 |
| D. B + C 혼합 | 권장 — 단계적 도입 |

## 결정

**B 부터 단계적 도입** — 3개 PR 로 분리.

### PR #7 (이번) — Write-through 영속화 + 60일 이력 제외 + 운영자 조회
- `DailyRecommendationEntity` 신설
  - 컬럼: `viewer_user_id`, `target_user_id`, `recommended_date`, `position`, `source`, `created_at`
  - unique: `(viewer, date, position)`
  - 인덱스: viewer+date, viewer+target, date
- `source` enum: `AUTO` / `ADMIN_PIN` / `ADMIN_REPLACE` (후자 둘은 PR #9)
- `AiSignalController`:
  - 호출 시 (viewer, today) 저장된 row 있으면 그대로 반환
  - 없으면 즉석 계산 → 저장 후 반환 (write-through)
  - 후보 필터에 "60일 이내 추천 이력 제외" 추가
- `AdminRecommendationsController`:
  - GET `/?date=` — 일자별 viewer 그룹
  - GET `/viewer/{userId}?days=N` — viewer 의 N일 이력
  - GET `/target/{userId}?days=N` — target 노출 이력 (역방향)
- 프론트: `AdminRecommendationsScreen` — 일자 선택 + 필터 + viewer 그룹 테이블 (조회만)

### PR #8 (예정) — 매일 자정 pre-compute scheduler
- `@Scheduled(cron = "0 0 0 * * *", zone = "Asia/Seoul")` 모든 활성 viewer 의 다음 날 추천 미리 계산
- 운영자가 내일 미리 볼 수 있음

### PR #9 (예정) — 운영자 override
- `AdminRecommendationOverride` entity (또는 source 만으로)
- 액션: 강제 추가(PIN) / 카드 교체(REPLACE) / 후보 제외(BLOCK)
- 프론트: 내일 미리보기 + 카드 변경 UI

## 결정 사항 디테일

### 추천 제외 기간 = 60일
- 베타 단계 사용자 풀 작아 (~25명) 영구 제외하면 빠르게 고갈
- 60일 후 재진입 — "잊을 만 한 시점" + 사용자 풀 회전
- 후속 ADR 에서 데이터 보고 조정 가능

### `position` 저장
- 1 = 무료 자리, 2 = paid unlock
- 통계/디버깅 가치 — 어떤 자리에 어떤 source 가 들어갔는지 정확히 추적
- (PR #9 에서 ADMIN_PIN 자리 결정 시 활용)

### 시드 격리는 그대로 — 조회만 격리, 기록은 전부
- 비시드 viewer 에게 시드 target 추천은 격리됨 (SeedUserPolicy)
- 시드끼리는 격리 안 됨 — 시드 추천 이력도 그대로 기록
- 기록 layer 와 노출 layer 분리 (정책 변경 시 영향 격리)

### 백필 없음
- 기존 사용자 과거 이력은 즉석 계산이라 정확한 재현 불가
- PR #7 머지 시점부터 기록 시작
- 마이그레이션 시점 명시 (`docs/RUNBOOK.md` 갱신 예정)

### KST 기준 날짜
- 모든 `recommendedDate` 는 Asia/Seoul 기준 LocalDate
- 자정에 새 추천 — Asia/Seoul 0시
- 서버 시간 (UTC) 과 분리

## 영향

- 기존 사용자 화면 동작 동일 — 사용자 입장에서는 변경 없음 (저장된 결과 반환 + 60일 이력 제외만)
- DB write 증가 — 매 viewer 첫 호출 시 N row insert (N=2). 사용자 25명 × 2 = 50 row/day. 1년 = 18k row. 작음.
- 운영자 메뉴 추가 — Dashboard 의 "매칭 관리" 카드 활성
- ADR 0005 (소개받기 토글 미적용) follow-up: 추천 이력 기록은 모든 viewer 에 대해 됨. SUSPENDED viewer 차단은 별도 fix.

## 룰 (이후)

- `daily_recommendations` 테이블에 직접 INSERT / UPDATE 금지 — `AiSignalController` 또는 admin endpoint 만
- `source = AUTO` 인 row 는 자동 계산 결과 — 운영자가 직접 수정하지 말 것 (PR #9 의 override 는 새 row insert 또는 source 변경)
- 추천 이력 60일 제외 기간 변경 시 본 ADR 갱신

## Follow-up

- **PR #8**: pre-compute scheduler (다음 날 새벽 0시)
- **PR #9**: 운영자 override (PIN/REPLACE/BLOCK)
- **별도 PR**: SUSPENDED viewer 차단 (ADR 0005 follow-up — viewer 가 SUSPENDED 면 추천 결과 빈)
- **장기**: 벡터 유사도 (`pgvector` / `Pinecone`) — 현재 random shuffle 을 의미 기반으로 교체 (Phase 3)
