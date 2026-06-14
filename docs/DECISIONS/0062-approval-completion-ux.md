# 0062 — 승인 완료 UX (푸시 알림 + 축하 다이얼로그)

- **상태**: Accepted
- **결정일**: 2026-06-14
- **결정자**: ys.choi
- **선행**: ADR 0054(운영자 승인 게이팅), 0041(retention 푸시 트리거)

## 컨텍스트

운영자가 프로필을 승인(ACTIVE)해도, 사용자는 그 사실을 능동적으로 알 길이 없었다(심사대기 화면에서 직접 새로고침해야 함). 또 새로고침으로 승인을 확인하면 토스트만 뜨고 곧장 피드로 넘어가, "승인됐다"는 순간이 약하게 처리됐다.

## 결정

1. **승인 시 푸시 + 인앱 알림** (`AdminUsersController.changeStatus`):
   - `newStatus == ACTIVE && 이전 != ACTIVE` 일 때만(중복 방지) 본인에게 발송.
   - `PushNotificationService.sendToUser`(prod FCM / dev Stub) + `NotificationService.create(PROFILE_APPROVED)` 인앱 영속화.
   - 외부 푸시 실패가 상태 변경 트랜잭션을 깨지 않도록 각각 `runCatching` + 경고 로그.
   - `NotificationType.PROFILE_APPROVED` 신규.
2. **승인 축하 다이얼로그** (`App.tsx`):
   - 심사대기 화면에서 새로고침 → ACTIVE 확인 시, 바로 넘기지 않고 **확인 다이얼로그**("승인 축하드려요! 🎉 … 이제부터 팔레트의 모든 기능을 사용할 수 있어요") 노출.
   - "팔레트 시작하기" 클릭 시 비로소 mainFeed/connectorDashboard 로 진입. 기존 토스트 대체.

## 범위 밖
- 디바이스 토큰 미등록(웹/미설치) 유저는 푸시가 no-op — 인앱 알림 + 새로고침 다이얼로그로 커버.
- 푸시 클릭 딥링크는 후속.

## 검증
- `SPRING_PROFILES_ACTIVE=test ./gradlew test` ✅ (Stub 푸시 빈으로 컨텍스트 로드)
- `npm run build` + `vitest run` 39 passed ✅
