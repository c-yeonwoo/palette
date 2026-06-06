# 0020 — 주선 대시보드 members / 연결 제안(Nudge) 백엔드 구현

- **상태**: Accepted
- **결정일**: 2026-06-06
- **결정자**: ys.choi

## 컨텍스트

`ConnectorDashboard.tsx` 가 대시보드 로드 시 두 엔드포인트를 호출하는데, 백엔드에 매핑 자체가 없어 **500 에러**가 발생하고 있었다.

- `GET /api/v1/matchmakers/me/members` — 내 지인(연결 가능한 1촌) 목록
- `GET /api/v1/matchmakers/me/nudges` — 내가 만든 연결 제안 목록
- `POST /api/v1/matchmakers/me/nudges` — 두 지인을 매칭시켜보자고 제안 (건당 50P)

`MatchmakerController` 의 `@GetMapping("/me")` 는 정확히 `/me` 하나만 매핑하므로 `/me/members`·`/me/nudges` 는 매핑을 못 찾고 깨졌다. 프론트는 `try/catch` 로 감싸 **DEV 에서만 `MOCK_MEMBERS`/`MOCK_NUDGES` 로 폴백**하고 있어 화면은 안 깨졌지만 네트워크 탭에는 500 이 그대로 찍혔다. ADR 0016 의 "applications" 와 동일한 *프론트 완성 / 백엔드 미구현* 반제품 상태.

용어(GLOSSARY):
- **members** = 주선자가 연결해 줄 수 있는 지인 (`Friendship` 의 ACCEPTED 상대)
- **연결 제안 / Nudge** = "주선자가 자신의 두 지인을 매칭시켜보자고 제안하는 행위", 건당 포인트 소모

## 결정

ADR 0016 의 applications(=dead UI 제거) 와 달리, members/nudges 는 **실제 Phase 2 기능**이므로 백엔드를 구현한다.

### 1) `GET /me/members`
- `FriendshipRepository.findAcceptedFriendshipsByUserId(me)` → 각 친구를 `ClientMember` 로 투영
- 투영 필드: `name`(realName→nickname), `age`(birthDate), `gender`, `region`(locationInfo.sido), `colorType/Hex/Name`(ColorTypeDto), `photoUrl`(primary photo presigned), `joinedAt`(friendship.acceptedAt)
- 투영 로직은 `FeedController` 의 검증된 패턴 재사용. 프로필/컬러 없으면 graceful null.

### 2) `GET /me/nudges`
- 신규 경량 영속 엔티티 `NudgeEntity`(`matchmaker_nudges` 테이블, `MatchmakerReviewEntity` 패턴) + `NudgeJpaRepository`
- `findByMatchmakerUserIdOrderByProposedAtDesc(me)` → from/to 를 `ClientMember` 로 투영해 `NudgeProposalResponse` 반환

### 3) `POST /me/nudges` (50P 소모)
- 검증 순서: matchmaker 존재 → fromUserId/toUserId 유효 UUID & 서로 다름 → **둘 다 내 1촌인지** → 가용 포인트 ≥ 50
- `NudgeEntity` 저장(status=PENDING) + `MatchmakerEarnings.spend(50)`
- 잘못된 입력/권한/포인트부족은 모두 4xx (500 아님)

### 포인트 소모 모델 — `MatchmakerEarnings.spend()`
- `withdraw()`(현금 출금, withdrawnPoints↑) 와 구분되는 **플랫폼 내 소진** 메서드 신설
- `totalPoints` 에서 차감 → 가용/총 포인트가 함께 감소 (프론트 낙관적 표시와 일치)
- 등급(level)은 **성사 건수** 기반이라 totalPoints 차감이 레벨에 영향 없음

## 결과

- 대시보드 로드 시 두 GET 모두 **200** (지인 없으면 `[]` — 정상). 500 제거.
- DB: `ddl-auto=update` 로 `matchmaker_nudges` 자동 생성 (선례: `matchmaker_reviews` 도 Flyway 없이 entity 의존). prod 도 동일 정책.
- 신규 가입자 격리(ADR 0007 계열): 지인이 없으면 빈 배열 → 프론트가 mock 미사용(실 빈 데이터). mock 폴백은 API 실패 시(DEV)만.

## 검증

- `compileKotlin` / `./gradlew test` 통과
- 런타임(local, H2): `dev@palette.kr` 로그인 → `GET /me/members`·`/me/nudges` 200. 초대코드로 친구관계 생성 후 members 투영 실데이터 확인(name/age/gender/region/photo, 컬러 없는 유저 graceful null). `POST /me/nudges` 비-주선자/잘못된 입력 모두 4xx.

## 후속 / 한계

- Nudge 의 status 전이(PENDING→BOTH_ACCEPTED→MATCHED) 및 수신자 알림/수락 흐름은 미구현 (현재 생성·조회만). 별도 작업.
- `application-local.*` 파일이 없어 `local` 프로파일도 `JWT_SECRET`/`KAKAO_*`/`OPENAI_API_KEY` env 가 필요 (CLAUDE.md 설명과 불일치 — 추후 정리 필요).
