# 0012 — 주선자 매칭 풀 운영자 관리

- **상태**: Accepted
- **결정일**: 2026-05-31
- **결정자**: ys.choi

## 컨텍스트

ADR 0011 에서 AI 매칭 운영자 override 도입. 매칭 관리 메뉴의 두 번째 갈래인 **주선자 매칭 풀**:
- 사람이 주선하는 흐름(`MatchmakingRequest`) 의 전체 조회 + 분쟁 대응 + 강제 변경 필요
- 베타 단계 분쟁 시 운영자 개입 (양쪽 양해 하 취소, 정책 위반 응대 등)

## 검토한 옵션

| 옵션 | 평가 |
|---|---|
| **A. 강제 status 변경 + 운영자 메모 (간단)** | ✅ 베타 단계 충분. CANCELLED_BY_ADMIN status 추가 + adminNote 컬럼 |
| B. 별도 `AdminInterventionLog` entity (audit log) | over-engineer 이번 PR. 추후 필요시 분리 |
| C. 운영자가 직접 매칭 생성 (운영자 주선) | 사용자 결정 — 위험 큼, 후속 PR 검토 |

## 결정

**옵션 A** — 기존 `MatchmakingRequest` 에 `adminNote` + `adminLastUpdatedAt` + `adminLastUpdatedBy` 컬럼 + `CANCELLED_BY_ADMIN` status 추가.

### 백엔드 변경

**1) Status enum 확장**:
- `CANCELLED_BY_ADMIN` — 운영자 강제 취소 (분쟁/정책 위반)
- `isTerminal()` 에 추가

**2) MatchmakingRequest 도메인 메서드**:
- `adminOverride(newStatus, note, operatorId)` — 강제 변경, note 필수
- `adminAttachNote(note, operatorId)` — 메모만 갱신

**3) Entity + 마이그레이션 (V14)**:
- `admin_note TEXT`
- `admin_last_updated_at DATETIME(6)`
- `admin_last_updated_by BINARY(16)`

**4) `AdminMatchmakingController` (`/api/v1/admin/matchmaking`)**:
- `GET /requests` — 페이징 + status 필터 + 검색(요청자/주선자/대상자 닉네임/이메일/실명)
- `GET /requests/{id}` — 상세 (3명 + decision + admin 메모)
- `PATCH /requests/{id}/status` — 강제 변경, note 필수
- `PATCH /requests/{id}/note` — 메모만 갱신

### 프론트 변경

**1) `AdminMatchingPoolScreen`**:
- 테이블: 요청자 → 대상자 / 주선자 / 상태 / 메모 / 업데이트 시각
- status select (전체 + 6 상태) + 검색
- row 클릭 → 상세 modal

**2) `MatchmakingDetailModal`**:
- 흐름 표시 (3명 + 현재 상태)
- 메시지 (요청자/주선자/대상자) + decision 시각
- 운영자 메모 (있으면 amber 박스)
- 액션: 메모만 갱신 / 강제 상태 변경
- note 필수 (audit)

**3) `AdminMatchingScreen` 의 "주선자 매칭 풀" 탭 활성화** (이전 placeholder 대체)

## 룰 (이후)

- 강제 status 변경은 항상 note 필수 — 백엔드 + 프론트 모두 강제
- ADMIN 계정 자신이 끼어든 매칭 요청 변경 시 별도 경고 (현재 미적용 — 추후)
- 베타 단계 매칭 요청 수 적음 → findAll() + 메모리 페이징. 1000+ 시 JPA Specification
- CANCELLED_BY_ADMIN 상태의 매칭은 주선자 포인트 환수 정책 — 추후 결정 (현재는 포인트 흐름 미연동)

## 영향

- 기존 `MatchmakingController` (사용자) 흐름 영향 없음 — 도메인 필드 nullable 추가
- prod 배포 시 V14 자동 적용 (기존 row 영향 없음, default null)
- 매칭 관리 메뉴 2개 탭 모두 동작 — Dashboard "매칭 관리" 완전체

## Follow-up

- 운영자 주선 (운영자가 직접 매칭 생성) — 사용자 결정 후 별도 PR
- `AdminInterventionLog` audit entity — 변경 이력 영구 보존 (현재는 마지막 1건만 저장)
- 주선자 포인트 환수 정책 — CANCELLED_BY_ADMIN 시 자동 차감 또는 운영자 수동
- BLOCK 된 사용자 (ADR 0011) 가 매칭 요청 보낼 때 자동 차단 — 별도 fix
- 매칭 통계 대시보드 (status 별 분포, 시간대별 추이)
