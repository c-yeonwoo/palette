# 0060 — 운영자 사진별 반려 (재촬영 요청)

- **상태**: Accepted
- **결정일**: 2026-06-14
- **결정자**: ys.choi
- **선행**: ADR 0054(운영자 승인 게이팅), 0008(유저 상태·운영자 액션)

## 컨텍스트

운영자는 프로필 반려 시 주로 **사진**을 문제 삼을 가능성이 높다(셀카·흐릿함·신원 불명확). 그동안 반려는 **프로필 전체에 사유 텍스트 한 줄**만 가능했고, 어떤 사진이 문제인지 콕 집어줄 수 없었다. 사용자는 어떤 사진을 다시 올려야 할지 알기 어려웠다.

## 결정

운영자가 반려 시 **특정 사진을 선택**해 "재촬영 요청"으로 표시하고, 사용자에게 해당 사진을 시각적으로 알린다.

### 데이터
- `profile_photos.rejected BIT(1) NOT NULL DEFAULT b'0'` (마이그레이션 §21). 기존 row 는 false.
- `ProfilePhoto` 도메인: `rejected: Boolean = false` + `markRejected()`/`clearRejection()`. 매퍼 양방향 매핑. `ProfilePhotoDto.rejected` 노출(사용자·운영자 공통 ProfileResponse).

### 흐름
- 운영자: `AdminApprovalsScreen` 프로필 미리보기에서 사진을 눌러 선택 → 반려 시 `PATCH /admin/users/{id}/status` 에 `rejectedPhotoIds: [uuid…]` 동봉. `AdminUsersController.applyPhotoRejections` 가 **대상 유저 본인 사진만**(교차 변조 방지) `markRejected()`. 승인 등 다른 상태로 바꾸면 잔여 반려 표시 해제.
- 사용자: `ProfileEditScreen` 에서 반려된 사진에 빨간 테두리 + "재촬영 필요" 뱃지. 전체 반려 사유는 기존대로 `PendingApprovalScreen` 에 노출(ADR 0054).
- 재제출: `ProfileController.updateProfile` 의 재제출 경로(REJECTED→PENDING_APPROVAL, ADR 0054)에서 **모든 사진 반려 표시 초기화** → 운영자가 새로 재검토.

### 범위 밖 (후속)
- 사진별 개별 사유 텍스트(현재는 전체 사유 1개 + 어떤 사진인지 표시). 필요 시 `profile_photos.rejection_reason` 추가.

## 검증
- `SchemaDriftTest`: `profile_photos.rejected` 가 마이그레이션 SQL 에 존재.
- `SPRING_PROFILES_ACTIVE=test ./gradlew test` + `npm run build` + vitest 그린.
