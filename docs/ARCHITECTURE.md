# Palette — Architecture

> 코드베이스의 도메인 지도. 워커가 이 문서를 먼저 읽고 "어디 손대야 하나" 결정한다.
> 변경 시 갱신 필수 — `docs/CONVENTIONS.md` 의 SoT-갱신 룰 참조.

---

## 1. 기술 스택

| 영역 | 스택 |
|---|---|
| 백엔드 언어 | Kotlin 2.2.21 |
| 백엔드 프레임워크 | Spring Boot 4.0.1 |
| Java | 21 |
| 빌드 | Gradle (Kotlin DSL) |
| DB | H2 (dev/test), MySQL (prod) |
| 캐시/세션 | Redis (refresh token) |
| 인증 | Spring Security + OAuth2 + JWT |
| ORM | Spring Data JPA + Kotlin JPA 플러그인 |
| 프론트 | React 18 + TypeScript |
| 프론트 빌드 | Vite |
| 스타일 | Tailwind CSS v4 |
| UI 컴포넌트 | shadcn/ui (Radix 베이스) |
| 외부 연동 | OpenAI (gpt-4o-mini), NCP SENS (SMS), NICE (본인인증), AWS S3, FCM (푸시) |

---

## 2. 패키지 구조 (DDD 4-layer)

```
kr.ai.palette/
├── domain/           # 순수 비즈니스 로직 (프레임워크 무관)
├── persistence/      # JPA Entity, Mapper, Repository 구현
├── application/      # 유스케이스, 트랜잭션 경계
├── presentation/     # REST 컨트롤러, DTO
└── infrastructure/   # 외부 연동, 인증, 시크릿, 설정
```

**Import 방향 (강제)**: `domain ← persistence`, `domain ← application`, `application ← presentation`, `infrastructure ← *`

→ `domain/*` 에서 `persistence/`, `presentation/`, `org.springframework.*` import 금지.

---

## 3. 도메인 지도

### 3.1 핵심 Aggregate

| Aggregate | 위치 | 책임 |
|---|---|---|
| **User** | `domain/user/User.kt` | 사용자 계정 (OAuth/이메일), 권한, 약관 |
| **Profile** | `domain/profile/Profile.kt` | 데이팅 프로필 (basic/career/education/location/lifestyle/intro/idealType/colorType/photos) |
| **Matchmaker** | `domain/matchmaker/Matchmaker.kt` | 주선 활동, 레벨(1~5), 커미션(30~50%), 포인트 |
| **MatchmakingRequest** | `domain/matchmaking/MatchmakingRequest.kt` | 주선 요청 (2단계 승인: 주선자 → 수신자) |
| **Friendship** | `domain/friendship/Friendship.kt` | 1촌 관계 (수락/거절), 2촌 계산은 repository |
| **PhoneVerification** | `domain/verification/PhoneVerification.kt` | 휴대폰 인증 코드, 만료 |
| **Notification** | `domain/notification/Notification.kt` | 사용자 알림 |
| **AuthToken** | `domain/auth/AuthToken.kt` | JWT access + refresh |

### 3.2 도메인 보조 객체 (값/하위)

- `profile/`: `BasicInfo`, `CareerInfo`, `EducationInfo`, `LocationInfo`, `LifestyleInfo`, `Introduction`, `IdealType`, `ColorType` (8 enum), `ProfilePhoto`, `ProfileVideo`, `ProfileSettings`, `ProfileMetrics`
- `matchmaker/`: `MatchmakerStats`, `MatchmakerLevel`, `MatchmakerEarnings`
- `matchmaking/`: `MatchmakingRequestStatus`, `ApprovalRecord`
- `common/`: `UserId` 등 공통 값 객체

### 3.3 Persistence 매핑 (Entity ↔ Domain)

각 도메인은 `persistence/{domain}/{Domain}Mapper.kt` 로 Entity ↔ 도메인 변환:

| Domain | Entity | Mapper | Repository |
|---|---|---|---|
| User | `persistence/user/UserEntity` | `UserMapper` | `UserRepositoryImpl` |
| Profile | `persistence/profile/ProfileEntity` (+Photo, Video) | `ProfileMapper`, `ProfilePhotoMapper`, `ProfileVideoMapper` | `ProfileRepositoryImpl` |
| Matchmaker | `persistence/matchmaker/MatchmakerEntity` | `MatchmakerMapper` | `MatchmakerRepositoryImpl` |
| ... | 위와 동일 패턴 | | |

**Persistence-만 있는 Entity** (도메인 직접 없음 — feed/relationship 등 raw 데이터):
- `persistence/feed/`: `CardOpenEntity`, `FeedHideEntity`
- `persistence/device/`: `DeviceTokenEntity` (FCM)
- `persistence/payment/`: `PaymentTransactionEntity`, `PaidViewEntity`
- `persistence/sharelink/`: `ShareLinkEntity`
- `persistence/vouch/`: `VouchEntity`
- `persistence/relationship/`: `RelationshipStageEntity`, `PhotoFeedbackEntity`
- `persistence/ai/`: `UserAiInsightEntity`

---

## 4. REST API 표면 (presentation/)

| Path prefix | 컨트롤러 | 책임 |
|---|---|---|
| `/api/v1/auth` | `AuthController` | refresh, me, logout, withdraw, account-type, basic-info |
| `/api/v1/auth/email` | `EmailAuthController` (AuthController.kt) | signup, login, matchmaker/signup |
| `/api/v1/auth/beta-code` | `BetaCodeController` | 베타 게이트 status / verify |
| `/api/v1/profile` | `ProfileController` | 본인 프로필 CRUD, 사진 |
| `/api/v1/profile/public/*` | `PublicProfileController` | 비공개 토큰 기반 공개 조회 |
| `/api/v1/share` | `ShareLinkController` | 공유 링크 생성 / 공개 resolve (`/v/{code}`) |
| `/api/v1/feed` | `FeedController` | 2촌 기반 메인 피드 + 필터 |
| `/api/v1/feed/ai-signal` | `AiSignalController` | AI 추천 1+1 |
| `/api/v1/feed/hide` | `FeedHideController` | 피드 숨김 |
| `/api/v1/matchmakers` | `MatchmakerController` | marketplace, /me, 리뷰 |
| `/api/v1/matchmaking` | `MatchmakingController` | request, pending, approve/reject (주선자/수신자) |
| `/api/v1/relationships` | `RelationshipController` | 관계 단계 트래킹, 사진 피드백 |
| `/api/v1/friends` | `FriendshipController` | 친구 요청, 초대코드, 검색 |
| `/api/v1/vouch` | `VouchController` | 보증 |
| `/api/v1/ai-interview` | `AIInterviewController` | AI 인터뷰 질문 (9개) |
| `/api/v1/ai-profile` | `AIProfileController` | AI 소개글 + 색깔 분석 |
| `/api/v1/ai` | `AiInsightController` | 호환성, my-insights |
| `/api/v1/fortune` | `FortuneController` | 오늘의 운세 (랜덤) |
| `/api/v1/league` | `LeagueController` | 시즌 랭킹 |
| `/api/v1/notifications` | `NotificationController` | 알림 목록, 읽음 |
| `/api/v1/devices` | `DeviceTokenController` | FCM 토큰 등록 |
| `/api/v1/payment` | `PaymentController` | 프로필 열람 결제 |
| `/api/v1/verification/phone` | `PhoneVerificationController` | SMS 인증 (베타: bypass) |
| `/api/v1/identity/nice` | `NiceIdentityController` | NICE 본인인증 (DEV bypass) |

---

## 5. 인증 흐름

### 5.1 SecurityConfig 매처 (현재)
`infrastructure/auth/SecurityConfig.kt`

**permitAll** (인증 불필요):
- `/`, `/error`, `/favicon.ico`
- `/api/v1/auth/email/**` (signup, login)
- `/api/v1/auth/refresh`
- `/api/v1/auth/beta-code/**`
- `/oauth2/**`, `/login/**`, `/h2-console/**`
- `/api/v1/profile/public/**`, `/api/v1/users/*/public`
- `/api/v1/ai-interview/questions`, `/api/v1/ai-profile/generate`, `/api/v1/ai/compatibility`
- `/api/v1/share/v/*` (공개 공유 링크만)
- `/api/v1/verification/phone/**`
- `/api/v1/identity/nice/callback`

**그 외 모두** `authenticated()`.

Admin: `/api/v1/admin/**` → `hasRole("ADMIN")`.

### 5.2 JWT
- HMAC-SHA512, `JWT_SECRET` 환경변수 (base64 32+ bytes)
- Access TTL 1h, Refresh TTL 30d
- Refresh token 은 Redis 에 저장 (prod), 메모리 (dev)

### 5.3 OAuth2
- Kakao 활성 (prod 키), Naver/Google/Apple UI 노출되나 graceful error
- 흐름: `/oauth2/authorization/kakao` → 콜백 → `OAuth2AuthenticationSuccessHandler` → JWT 발급 + frontend 리다이렉트

---

## 6. 주요 비즈니스 흐름

### 6.1 회원가입 (이메일)
1. 베타 게이트: `POST /api/v1/auth/beta-code/verify` → 쿠키 발급 (TTL 30d)
2. 휴대폰 인증: `POST /api/v1/verification/phone/send` → `verify` (베타: `000000` bypass)
3. `POST /api/v1/auth/email/signup` → User 생성, JWT 발급
4. 프로필 작성 4단계 (BasicInfo → PhotoUpload → AboutMe → IdealType)
5. `POST /api/v1/ai-profile/generate` → 색깔 + 소개글 (OpenAI, dummy key 시 stub)
6. User.isProfileCompleted = true

### 6.2 피드 (2촌 기반)
`GET /api/v1/feed`:
1. 현재 사용자의 1촌 친구 ID 수집
2. 각 1촌의 친구들 = 2촌 후보
3. 본인/1촌/매칭 이력/숨김 제외
4. 반대 성별 + 필터(나이/키/지역/직업) 통과한 프로필만
5. 공통 1촌(주선자 후보)도 함께 반환

### 6.3 주선 요청 (2단계 승인)
1. `POST /api/v1/matchmaking/request` (요청자 → 대상자, 주선자 지정)
2. 주선자가 `PUT /requests/{id}/matchmaker/approve|reject`
3. 수신자(target)가 `PUT /requests/{id}/target/accept|reject`
4. 둘 다 통과 → `COMPLETED` → 연락처 교환 + 주선자 포인트 (30~50% 커미션, 레벨별)

### 6.4 AI 시그널 (1+1)
`GET /api/v1/feed/ai-signal`:
- 친구 0 + 비시드 사용자 → 빈 결과 (시드 격리)
- 그 외: 모든 프로필 중 반대 성별 + 매칭/숨김 제외 + 시드 격리 → 일자+UID 시드 랜덤 2명
- 1번째 무료, 2번째 1,000원 (`POST /unlock`)

---

## 7. 외부 연동 (infrastructure/)

| 디렉토리 | 역할 | dev/local | prod |
|---|---|---|---|
| `ai/` | OpenAI 호출 + dummy key stub | dummy key → stub | 실제 호출 (gpt-4o-mini) |
| `auth/` | JWT, OAuth, SecurityConfig | 동일 | 동일 |
| `beta/` | 베타 코드 검증/쿠키 | `BETA_CODE` env | `palette-beta-2026` |
| `nice/` | NICE 본인인증 v2 | DEV bypass (수동 입력) | 실키 발급 필요 (TODO) |
| `payment/` | Toss Payments | mock | test 키 (live 미전환) |
| `push/` | FCM | Stub | FCM 키 필요 |
| `seed/` | DevDataSeeder, **SeedUserPolicy** | local: 25명 시드 | beta: 시드 활성 (격리 정책 적용) |
| `sms/` | NCP SENS | mock | bypass (베타) — 추후 NCP 활성 |
| `storage/` | AWS S3 | 로컬 /tmp | S3 prod 버킷 + presigned URL |
| `config/` | DataInitializer, ProfileAutoHideScheduler | dev 데이터 | scheduler 동작 |
| `exception/` | GlobalExceptionHandler | 동일 | 동일 |

---

## 8. 프론트엔드 구조

```
frontend/src/
├── app/
│   ├── App.tsx              # 라우팅 (state 기반, React Router 없음)
│   └── components/
│       ├── ui/              # shadcn/ui 원시 컴포넌트
│       ├── LoginScreen.tsx, EmailLoginScreen.tsx, EmailSignupScreen.tsx
│       ├── BetaGateScreen.tsx, AccountTypeSelectionScreen.tsx
│       ├── BasicInfoScreen.tsx, PhotoUploadScreen.tsx, AboutMeScreen.tsx, IdealTypeScreen.tsx
│       ├── AIInterviewScreen.tsx, AIProfileEnhanceScreen.tsx
│       ├── MainFeedScreen.tsx, ProfileDetailScreen.tsx, MyProfileScreen.tsx, ProfileEditScreen.tsx
│       ├── ConnectorDashboard.tsx, MatchmakerMarketplaceScreen.tsx
│       ├── LeagueScreen.tsx, NotificationScreen.tsx, AiHubScreen.tsx
│       └── (그 외 약 80+ tsx)
├── lib/
│   ├── api/                 # apiClient, phoneVerification, ...
│   ├── auth/                # authService, tokenStorage
│   ├── config/              # api.config.ts (BASE_URL)
│   └── feature-flags.ts
└── styles/
    ├── index.css            # 진입
    ├── theme.css            # 디자인 토큰 (P8 잉크 차콜 모노톤)
    └── fonts.css            # Pretendard
```

라우팅: `App.tsx` 의 `currentScreen` state 기반 (React Router 미사용).
API client: `lib/api/apiClient.ts` — JWT 자동 첨부, 401 시 refresh.

---

## 9. 변경 시 갱신 영역 (워커 가이드)

| 변경 종류 | 갱신할 SoT |
|---|---|
| 새 컨트롤러 추가 | 이 문서 §4 표, `docs/generated/api-spec.md` (자동) |
| Entity 추가 | 이 문서 §3.3, `docs/generated/db-schema.md` (자동) |
| 도메인 Aggregate 추가 | 이 문서 §3.1 |
| SecurityConfig 매처 변경 | 이 문서 §5.1 + ADR 필수 |
| 외부 연동 추가 | 이 문서 §7 |
| 새 흐름 | 이 문서 §6 |
| 디자인 토큰 변경 | `frontend/src/styles/theme.css` + ADR |

→ reviewer 가 PR 에서 위 갱신 누락 시 차단.
