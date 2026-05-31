# 0008 — UserStatus + 운영자 회원 관리

- **상태**: Accepted
- **결정일**: 2026-05-31
- **결정자**: ys.choi

## 컨텍스트

운영자 페이지의 첫 관리 영역인 "회원 관리" 도입 (PR #5). 베타 운영 중 사용자 차단/휴면 처리가 필요.
기존 모델은 탈퇴(`metadata.deletedAt`) 만 표현 가능 → 차단/휴면 별도 상태 필요.

## 검토한 옵션

| 옵션 | 평가 |
|---|---|
| **A. `UserStatus` enum + 컬럼** | ✅ 단순한 상태 머신, 사유/시각/operator 별도 컬럼 |
| B. `suspendedAt`, `dormantAt` 별도 nullable 필드 | 상태 머신 흐려짐. 차단 사유 별도 모델 추가 부담 |
| C. 별도 `UserStatusHistory` entity (audit log) | over-engineer 이번 PR. 추후 별도 PR (audit log) 에서 추가 |

## 결정

**옵션 A** 채택. enum 3개:
- `ACTIVE` (기본)
- `SUSPENDED` (운영자 차단 — 사유 필수)
- `DORMANT` (장기 미접속 휴면 — 사유 선택)

탈퇴는 별개로 `UserMetadata.deletedAt` 으로 표현 — soft delete.

### 백엔드 변경
1. `domain/user/UserStatus.kt` — enum
2. `User.status`, `User.statusReason`, `User.statusUpdatedAt`, `User.statusUpdatedBy` 필드
3. `User.changeStatus(newStatus, reason, operatorId)` — SUSPENDED 시 reason 필수, 메타데이터 갱신
4. `UserEntity.status` + `UserStatusEntity` enum + reason/updatedAt/updatedBy 컬럼
5. `UserMapper`: toDomain/toEntity/updateEntity 갱신
6. `schema-mysql.sql` + `V11__add_user_status.sql` (default ACTIVE backfill, `idx_users_status`)
7. `AdminUsersController` (`/api/v1/admin/users`):
   - `GET /` — 페이징 + 검색(q) + status 필터 + 정렬 (createdAt:desc 기본)
   - `GET /{userId}` — 상세
   - `PATCH /{userId}/status` — 상태 변경 (운영자 ID 자동 기록)
8. 운영자 계정 (`role=ADMIN`) 은 상태 변경 불가 — 오작동 방지

### 프론트 변경
1. `AdminApp.tsx` — pathname 기반 라우팅 확장 (`/admin/users`, `/admin/users/:id`)
   - `popstate` 이벤트 핸들링 — 브라우저 뒤로/앞으로 동작
   - `history.pushState` 로 SPA 전환
2. `AdminUsersScreen.tsx` — 테이블 + 검색 + 페이징 + status 필터
3. `AdminUserDetailScreen.tsx` — 상세 + 상태 변경 dialog (SUSPENDED 시 사유 필수)
4. `AdminDashboardScreen.tsx` — 회원 관리 버튼 활성화

## 룰 (이후)

- 신규 admin endpoint 추가 시 `presentation/admin/` 디렉토리에 모음
- 상태 변경은 항상 운영자 ID 기록 (audit 단서)
- 베타 단계 사용자 수 적어 `findAll()` + 메모리 필터 OK — 1000명 넘으면 JPA Specification + Pageable 전환 (BACKLOG)
- 차단된 사용자의 매칭/피드 차단 효과는 ADR 0005 (소개받기/주선받기 토글 미적용) 와 같이 별도 fix 필요

## 영향

- 기존 `User` 생성 코드 변경 없음 (status default ACTIVE)
- `@AuthenticationPrincipal AuthUser` 사용자 화면에는 영향 없음 (status 는 admin 만 다룸)
- 로그인 시 status=SUSPENDED 도 현재는 통과 — 별도 fix (BACKLOG):
  - `EmailAuthController.login` 에서 status SUSPENDED 차단 + 안내 메시지
  - 또는 JwtAuthenticationFilter 에서 status 체크 (token 활성 사용자만)

## Follow-up

- **별도 PR**: 로그인 시 SUSPENDED 차단 + 사용자 안내
- **별도 PR**: 차단 사용자의 피드/매칭 노출 차단 (ADR 0005 와 함께)
- **별도 PR**: UserStatusHistory entity — audit log (누가 언제 누구를 어떤 상태로 바꿨나)
- **별도 PR**: DORMANT 자동 처리 (180일 미접속 등) — `ProfileAutoHideScheduler` 와 비슷한 패턴
- **PR #6 예정**: 매칭 관리 + CS 관리 (admin 페이지 확장)
