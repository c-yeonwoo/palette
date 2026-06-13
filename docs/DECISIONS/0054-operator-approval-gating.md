# 0054 — 운영자 승인 게이팅 (프로필 심사)

- **상태**: Accepted
- **결정일**: 2026-06-13
- **결정자**: ys.choi
- **선행**: ADR 0008 (user status & admin actions), 0003 (seed 격리)

## 컨텍스트

신뢰 기반 데이팅을 표방하는데 누구나 프로필만 채우면 즉시 서비스(피드·매칭)에 노출됐다. 사진·신원의 진위를 사람이 검토하는 게이트가 없어 베타 품질·안전에 위험.

## 결정

**프로필 완성 → 운영자 승인 대기(PENDING_APPROVAL) → 승인(ACTIVE) 후에만 정식 이용.**

게이팅 동선(사용자 결정): **전체 차단 + 심사중 화면만.** 승인 전엔 피드·소개·매칭 전부 막고 '심사 대기' 화면만 노출. 반려 시 사유 + 보완 후 재제출.

적용 범위(사용자 결정): **신규만 PENDING, 기존·시드는 자동 APPROVED.** `users.status` 컬럼 기본값 ACTIVE 라 기존 row·시드는 영향 없음. 이제부터 프로필을 완성하는 신규 REGULAR 사용자만 PENDING_APPROVAL 로 전환.

### 상태 모델 — UserStatus 확장

기존 `ACTIVE/SUSPENDED/DORMANT` 에 추가:
- `PENDING_APPROVAL` — 프로필 완성 후 승인 대기 (로그인은 가능, 서비스 차단)
- `REJECTED` — 운영자 반려 (사유 필수, 재제출 가능)

`User.completeProfile()` 이 ACTIVE 였다면 PENDING_APPROVAL 로 전환. `canUseMatchingService()` 는 `status == ACTIVE` 를 요구(백엔드 방어).

### 동작

| 시점 | 처리 |
|---|---|
| 프로필 완성(`ProfileController` → `completeProfile`) | status = PENDING_APPROVAL |
| 로그인/앱 재진입(`/me`) | `approvalStatus != ACTIVE` 면 프론트가 `pendingApproval` 화면으로 라우팅 |
| 운영자 승인 | `PATCH /admin/users/{id}/status {status:ACTIVE}` → 정식 이용 |
| 운영자 반려 | `{status:REJECTED, reason}` → 사용자에게 사유 + 재제출 안내 |

어드민은 기존 `/admin/users` 엔드포인트를 재사용 — 필터에 `PENDING_APPROVAL`(승인 큐) 추가, 상세에서 승인/반려 버튼.

### 데이터

- `users.status` MySQL enum 에 값 2개 추가 (migration: idempotent `ALTER ... MODIFY`). H2 는 VARCHAR(24).
- `/me` 응답에 `approvalStatus`, `approvalReason` 추가.

## 구현 범위 (이 PR)

- ✅ 백엔드: UserStatus 확장, completeProfile→PENDING, canUseMatchingService 가드, /me 필드, schema + migration, entity
- ✅ 프론트: `PendingApprovalScreen`(심사중/반려) + App 라우팅 게이트(로그인·재진입·프로필완성 3지점)
- ✅ 어드민: 회원 목록 승인대기 필터 + 상세 승인/반려 버튼 + 배지

## 보류 / 후속

- 승인·반려 시 푸시/이메일 알림 (현재 사용자가 새로고침으로 확인)
- 사진·인증서류 전용 검토 큐 화면 (현재는 회원 상세에서 프로필 확인)
- MATCHMAKER_ONLY 승인 정책 (현재 게이팅은 REGULAR 한정 — completeProfile 이 REGULAR 전용)
- 자동 승인 규칙(사진 AI 검증 통과 시) — Vision API 연동 후 별도 ADR

## 결과

- 모든 신규 프로필이 사람 검토를 거쳐 노출 → 베타 신뢰·안전 확보
- 기존·시드는 무영향(자동 APPROVED)으로 마이그레이션 매끄러움
