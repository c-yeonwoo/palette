# 0016 — Application UI 제거 + 친구 요청 흐름을 `Friendship` 로 일원화

- **상태**: Accepted (ADR 0015 entity 매핑 정정)
- **결정일**: 2026-05-31
- **결정자**: ys.choi

## 컨텍스트

ADR 0015 에서 `MatchmakerApplication` 을 "지인 등록 요청" 의 백엔드 entity 로 정의했으나, 실제 코드베이스를 확인한 결과:

- **`MatchmakerApplication` entity 는 백엔드에 존재하지 않음** — 도메인/persistence/controller 어디에도 없음
- `ConnectorDashboard.tsx` 가 호출하는 `GET /api/v1/matchmakers/me/applications` 는 항상 404 → dev 모드에서 `MOCK_APPLICATIONS` 로 폴백
- `POST /api/v1/matchmakers/me/applications/{id}/accept|reject` 도 동일 (백엔드 미구현)
- 실제 양방향 친구 관계는 `Friendship` entity 에서 관리:
  - `POST /api/v1/friends/request/{targetUserId}` — 친구 요청
  - `PUT /api/v1/friends/request/{requestId}/accept` — 수락
  - `GET /api/v1/friends/requests/pending` — 받은 요청 목록
  - `GET /api/v1/friends/search?query=...` — 사용자 검색
  - `POST /api/v1/friends/invite-code` / `POST /api/v1/friends/join` — 초대 코드
- `FriendConnectScreen.tsx` 가 위 endpoint 들을 이미 모두 사용하며 정상 동작

즉, ConnectorDashboard 의 "지인 등록 요청 N건 검토 대기" 영역은 dead UI (mock 폴백만 동작). 사용자가 친구 코드로 친구 요청을 보내도 주선 대시보드에는 나타나지 않음 — `FriendConnectScreen` 의 "받은 친구 요청" 에서만 보임.

추가 UX 관점:
- 친구 추가 = 양방향 사회적 관계 형성 (가끔 일어남)
- 주선 활동 = 매칭 주선 처리 (매일 들어가는 메인 활동)
- 두 영역이 의미 레이어가 다른데 한 화면에 섞여 있어 인지 부하

## 결정

### 1. `ConnectorDashboard.tsx` 에서 application UI 완전 제거
- `ClientApplication` 타입, `MOCK_APPLICATIONS`, `applications` state, `showApplicationSheet` state 삭제
- 알림 벨 (Heart 아이콘 + 카운트 뱃지) 삭제
- "지인 등록 요청 N건 검토 대기" 배너 삭제
- 바텀시트 + `ApplicationCard` 컴포넌트 삭제
- `handleAcceptApplication`, `handleRejectApplication` 핸들러 삭제
- 빈 상태 메시지 정정 ("알림 벨을 눌러…" → "친구 코드로 지인을 초대하거나 받은 친구 요청을 수락해보세요")

### 2. 진입점 변경: ConnectorDashboard → `FriendConnectScreen`
- 헤더 우측 알림 벨 자리에 `Users` 아이콘 → `onNavigateToFriends` 라우팅
- 빈 상태에서 "지인 관리하기" 텍스트 링크
- 지인 그리드 하단에 "지인 초대 / 받은 친구 요청 관리" 배너

### 3. `FriendConnectScreen` 헤더 통일 (ADR 0014) + 라벨 정정
- "친구 연결" → "지인 관리"
- 통일 헤더 패턴 적용 (sticky h-14 + h1 text-base)
- 헤더 우측에 `pendingRequests.length > 0` 일 때 "받은 요청 N건" 칩
- 친구 목록 탭 라벨: "친구 목록" → "지인 목록"

### 4. 라우팅 출처 보존
- App.tsx 에 `friendConnectFrom: Screen` state 추가
- 진입 시 출처 저장 → onBack 시 그 화면으로 복귀
- 이전: 항상 `myPage` 로 복귀 (ConnectorDashboard 에서 진입해도 myPage 로 가는 어색함 제거)

### 5. SoT 정정
- `docs/GLOSSARY.md` 의 entity 매핑 갱신: `MatchmakerApplication` → `Friendship`
- "친구 요청 / 지인 등록 요청" 흐름을 `/api/v1/friends/*` endpoint 로 기술
- 화면 ↔ 도메인 매핑 표에 `FriendConnectScreen` 추가

## 영향

- 주선 대시보드는 순수하게 **주선 활동 (매칭 요청 + 지인 + 이력 + 리워드 진입)** 만 담당 → 인지 부하 감소
- 친구 추가 흐름은 단일 화면 `FriendConnectScreen` 에서 완결 — 백엔드 API 도 이미 한 컨트롤러
- mock 폴백으로만 동작하던 dead UI 제거 → 향후 사용자 혼동 방지 ("수락했는데 왜 지인 목록에 안 뜨지?")
- 진입 동선 한 단계 추가 (대시보드 → 헤더 우측 아이콘 → 친구 관리) — 친구 추가는 빈도 낮으므로 허용 가능

## Follow-up

- 알림 (`NotificationScreen`) 에서 `FRIEND_REQUEST` 타입 클릭 시 `FriendConnectScreen` 의 "지인 목록" 탭으로 deep link
- `MyPageScreen` 에도 "지인 관리" 진입점 추가 검토 (현재는 ConnectorDashboard 진입만)
- ConnectorDashboard 의 `MOCK_MEMBERS`, `MOCK_NUDGES` 도 백엔드 endpoint 가 실제 구현되었는지 별도 확인 필요 (현재 동일 mock 폴백 구조)
- 향후 X → Y 가 "주선자로서 등록" 이라는 별도 의미 행위가 필요해지면 그때 새 entity (`MatchmakerSubscription` 등) 도입 + 별도 ADR
