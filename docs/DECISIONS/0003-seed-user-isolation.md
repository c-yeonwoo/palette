# 0003 — 시드 유저 격리 정책

- **상태**: Accepted (local), prod 미적용
- **결정일**: 2026-05-30
- **결정자**: ys.choi

## 컨텍스트

- 로컬/베타에서 `DevDataSeeder` 가 25명의 시드 유저 생성 (`dev@palette.kr`, `user{1..12}@dev.palette.kr`, `mm{1..2}@dev.palette.kr`)
- 시드끼리는 풍부한 데모 환경 제공 (피드/매칭 요청/주선자 마켓플레이스 등)
- 그러나 **신규 가입자에게도 시드 데이터가 노출** — "내가 가입했는데 mock 데이터가 보임"
- 사용자 의도: **테스트 계정에는 시드 보이게, 신규 가입은 깨끗한 데이터로 시작**

### 노출 surface 분석
| API | 노출 원인 |
|---|---|
| `/api/v1/feed/ai-signal` | `profileRepository.findAll()` — 친구 그래프 무관 |
| `/api/v1/matchmakers/marketplace` | 모든 공개 주선자 노출 |
| `/api/v1/league` | 시즌 랭킹 (시드 주선자 매칭 포함) |
| `/api/v1/feed` | 안전 — 2촌 친구 기반, 신규는 친구 0 |

## 검토한 옵션

| 옵션 | 평가 |
|---|---|
| UserEntity 에 `isSeed` flag 컬럼 추가 | 마이그레이션 부담, 의미적 변경 |
| In-memory `SeedUserRegistry` (DevDataSeeder 가 등록) | 재시작 시 손실, 부정확 |
| **email 패턴 기반 식별** (`dev@palette.kr` + `@dev.palette.kr` 도메인) | ✅ stateless, 정확, DevDataSeeder 의 hardcoded 패턴과 일치 |

## 결정

`infrastructure/seed/SeedUserPolicy.kt` 빈 도입:

```kotlin
fun isSeed(user: User): Boolean =
    user.privateInfo.email == "dev@palette.kr" ||
    user.privateInfo.email?.endsWith("@dev.palette.kr") == true

fun shouldExposeSeedTo(viewer: User): Boolean = isSeed(viewer)
```

### 적용 controller (현재)
- `AiSignalController` — candidates 필터에서 시드 제외 (비시드 viewer일 때)
- `MatchmakerController.getMarketplace` — 시드 주선자 제외
- `LeagueController` — 랭킹 집계 전 시드 주선자 제외

### 추가 가드: 친구 0 + 비시드 = 빈 추천
- AI Signal 은 친구가 0명인 비시드 사용자에게 무의미 → 빈 결과
- 깨끗한 onboarding 경험

## 룰 (이후)

- **신규 추천/리스트 API 추가 시 시드 격리 적용 필수** — reviewer 가 체크
- 시드 계정 email 패턴 변경 시 `SeedUserPolicy` 와 `DevDataSeeder` 동시 갱신
- prod 에서는 시드 비활성 옵션 (`app.seed-enabled=false`) 검토 — 베타 동안은 활성

## 영향

검증된 동작:
- `dev@palette.kr` 로그인 → ai-signal 2건, marketplace 5건, league 1건 (시드끼리 풍부)
- 신규 가입 `clean@example.com` → ai-signal 0건, marketplace 2건 (이전 가입 비시드 잔존), league 0건
- → marketplace 의 비시드 잔존은 정상 (시드 격리 의도 — 다른 비시드는 보여도 OK)

## 미적용 follow-up

- 친구 0 게이트를 marketplace 에도 적용할지 (현재는 적용 안 함)
- prod 베타에 동일 fix 배포 (현재 PR 머지 후 prod 자동 배포 구조)
