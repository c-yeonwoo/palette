# 0010 — 운영자 회원 상세 보강 (친구·통계·프로필 미리보기)

- **상태**: Accepted
- **결정일**: 2026-05-31
- **결정자**: ys.choi

## 컨텍스트

PR #7 (Admin Users 회원 관리) 의 회원 상세 화면은 기본 정보 + 상태 변경만 가능. 베타 운영 시:
- 이 사람의 친구 그래프가 어떻게 생겼나
- 색깔 / 프로필 완성도 / 매칭 활동 / AI 추천 노출 통계
- 사용자에게 어떻게 보이는지 (프로필 화면 미리보기)

이런 컨텍스트가 한 화면에서 보여야 운영 의사결정 가능 (차단/매칭 개입/CS 응대 등).

## 결정

`AdminUserDetailScreen` 확장 — 한 화면에서 4 섹션:

1. **기본 정보** (기존) + **프로필 미리보기** 버튼 추가
2. **활동 통계 카드** (신규)
   - 색깔 타입 (8 컬러 시각 표시)
   - 프로필 완성도 / 신뢰 점수 / 조회수
   - 매칭: 보낸 / 받은 / 주선 활동 각각 성공/전체
   - 친구 수 / AI 추천 노출 (최근 30일)
3. **친구 목록** (신규) — 1촌 친구 테이블 (닉네임, 성별/나이, 색깔, 완성도, 상태)
4. **상태 관리** (기존) — ACTIVE/SUSPENDED/DORMANT 토글

### 백엔드 — `AdminUsersController` 확장
- `GET /api/v1/admin/users/{userId}/friends` — 1촌 친구 + 각자 색깔/완성도 (depth 1)
- `GET /api/v1/admin/users/{userId}/stats` — 통계 집계
  - Profile.colorType / completionRate / trustScore / viewCount
  - MatchmakingRequest: 보낸 / 받은 / 주선 — status 별 카운트
  - Friendship 수
  - DailyRecommendation: target 으로 노출된 최근 30일 카운트
- `GET /api/v1/admin/users/{userId}/profile` — 일반 ProfileResponse (운영자만 통과)

별도 endpoint 3개로 분리 — 단일 호출에 묶지 않음. RESTful + 캐시 / 부분 실패 격리.

### 프론트 — `AdminUserDetailScreen`
- 진입 시 4 endpoint 병렬 호출 (`Promise.all`)
- 각 섹션 독립적 — 통계 실패해도 친구/상태는 표시
- 친구 / 통계 실패 시 silent fallback (조회 실패는 사용자 경험에 critical 아님)
- 프로필 미리보기는 modal — 운영자 클릭 시 호출

### 컬러 타입 시각 표시
- `COLOR_TYPE_META` 매핑 (theme.css 의 8 컬러 hex)
- 색깔 칩 + 라벨 표시 — 운영자가 빠르게 인식

## 룰 (이후)

- 새 admin endpoint 는 모두 `/api/v1/admin/users/{userId}/{sub-resource}` 형태
- 운영자 화면에서 사용자 PII (전화번호 등) 마스킹 안 함 — 운영자 한정 접근, audit log 는 추후
- 친구의 친구 (depth 2) 는 일반화면 (피드) 에서만 — 운영자 화면은 depth 1 만
- 프로필 미리보기 — 현재는 raw JSON modal. 사용자 노출 화면 그대로 렌더링은 후속 PR

## 영향

- `AdminUsersController` 의존성 4개 추가 (ProfileRepository, FriendshipRepository, MatchmakingRequestRepository, DailyRecommendationJpaRepository, FileStorageService)
- 회원 상세 진입 시 4 호출 → 베타 사용자 25명에서 latency 충분히 작음
- 1000명+ 시 통계 집계 비용 증가 — 별도 cache 또는 마이그레이션 (BACKLOG)

## Follow-up

- 프로필 미리보기 — 사용자 화면 그대로 (테마/사진 포함) 렌더링
- 친구 클릭 시 그 친구의 상세로 이동 (drill-down)
- AI 추천 노출 카운트 클릭 → AdminRecommendationsScreen target 필터로 이동 (deep link)
- 통계 audit log (누가 언제 누구 상세를 봤나) — 민감 PII 접근 추적
- 매칭 관리 화면에서 이 유저의 매칭 흐름 시각화 (PR #9)
