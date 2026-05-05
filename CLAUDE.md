# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Palette** is a friend-network dating app where trust meets connection.

> "나의 색을 찾고, 너의 색과 조화를 이루다"
> "Find Your Color, Meet Your Match"

### Service Concept

Palette는 지인 네트워크 기반의 신뢰할 수 있는 주선 데이팅 서비스입니다. 화가가 팔레트에서 자신의 그림에 어울리는 색을 고르듯, 각자의 개성, 취향, 이상형이라는 고유한 색을 찾아 조화로운 관계를 만들어갑니다.

### Core Values

1. **나만의 색깔 표현 (Express Your Color)**
   - AI 인터뷰로 프로필 자동 생성
   - 동영상/사진 신뢰도 검증 시스템
   - 8가지 색깔 메타포로 개성 표현

2. **조화로운 매칭 (Find Your Harmony)**
   - 1-2촌 지인 네트워크 기반 매칭
   - 2단계 검증 (주선자 승인 → 수신자 승인)
   - 건별 과금으로 신중한 선택 유도

3. **의미있는 관계 (Create Masterpiece)**
   - 주선자 인센티브 시스템 (레벨별 30-50% 커미션)
   - 매칭 후 10일 쿨타임으로 집중 유도
   - 사회적 책임감 기반 관계 형성

### Development Phases

- **Phase 1** (0-3개월): AI 프로필 생성 및 신뢰도 시스템
- **Phase 2** (3-6개월): 지인 네트워크 및 주선 시스템
- **Phase 3** (6-12개월): AI 추천 알고리즘 및 그룹 매칭

This is a Kotlin-based Spring Boot 4.0.1 application using Java 21, with a React TypeScript frontend.

## Build and Run Commands

### Prerequisites

Copy `.env.example` to `.env` and fill required values. At minimum for local dev:
- `JWT_SECRET` — generate with `openssl rand -base64 64`
- `KAKAO_CLIENT_ID` / `KAKAO_CLIENT_SECRET` — from Kakao Developers console
- OR use `SPRING_PROFILES_ACTIVE=local` which loads `application-local.yml` with dev-only dummy secrets (no real credentials needed)

### Frontend (React + TypeScript)

```bash
cd frontend

# Install dependencies
npm install

# Development server (connects to backend at localhost:8080)
npm run dev

# Run unit tests (Vitest)
npx vitest run

# Build for production
npm run build
```

### Backend (Spring Boot)

```bash
# Local dev (H2 + dummy secrets — no .env required)
SPRING_PROFILES_ACTIVE=local ./gradlew bootRun

# With real credentials from .env
export $(cat .env | grep -v ^# | xargs) && ./gradlew bootRun

# Run tests (uses in-memory H2, no external services)
SPRING_PROFILES_ACTIVE=test ./gradlew test

# Production build
./gradlew build

# Clean
./gradlew clean
```

### Spring Profiles

| Profile | DB | Secrets |
|---------|----|----|
| `local` | H2 file | dummy (application-local.yml) |
| (default) | H2 file | from env vars (required) |
| `prod` | MySQL | from env vars (required) |
| `test` | H2 in-memory | test values (application.properties in test/) |

## Technology Stack

### Backend
- **Language**: Kotlin 2.2.21 with Java 21
- **Framework**: Spring Boot 4.0.1
- **Build Tool**: Gradle with Kotlin DSL
- **Database**: H2 (dev/test), MySQL (production)
- **Security**: Spring Security with OAuth2 (both client and authorization server)
- **ORM**: Spring Data JPA with Kotlin JPA plugin
- **Testing**: JUnit 5 (Jupiter)

### Frontend
- **Language**: TypeScript
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Icons**: Lucide React
- **Notifications**: Sonner (toast notifications)
- **HTTP Client**: Fetch API with custom wrapper

## Architecture

### Design Principles

This project follows **Domain-Driven Design (DDD)** with clear separation of concerns:

- **Domain Layer**: Pure business logic, framework-agnostic
- **Persistence Layer**: JPA entities, repositories, mappers
- **Application Layer**: Use cases and business services
- **Presentation Layer**: REST API controllers and DTOs

### Package Structure

```
kr.ai.palette/
├── domain/                 # Domain Layer (Pure Business Logic)
│   ├── common/            # Shared Value Objects (UserId)
│   ├── user/              # User Aggregate
│   │   ├── User           # Aggregate Root
│   │   ├── OAuthInfo, PrivateInfo, PublicInfo
│   │   ├── AccountType, TermsAgreement
│   │   └── UserRepository (interface)
│   ├── profile/           # Profile Aggregate
│   │   ├── Profile        # Aggregate Root
│   │   ├── BasicInfo, CareerInfo, EducationInfo
│   │   ├── LocationInfo, Introduction, LifestyleInfo
│   │   ├── IdealType, ColorType
│   │   ├── ProfileMetrics, ProfileSettings
│   │   ├── ProfilePhoto, ProfileVideo
│   │   └── Repositories (interfaces)
│   └── matchmaker/        # Matchmaker Aggregate
│       ├── Matchmaker     # Aggregate Root
│       ├── MatchmakerStats, MatchmakerLevel
│       ├── MatchmakerEarnings
│       └── MatchmakerRepository (interface)
│
├── persistence/           # Persistence Layer (Infrastructure)
│   ├── user/
│   │   ├── UserEntity
│   │   ├── UserMapper
│   │   ├── UserJpaRepository
│   │   └── UserRepositoryImpl
│   ├── profile/
│   │   ├── ProfileEntity, ProfilePhotoEntity, ProfileVideoEntity
│   │   ├── Mappers (Profile, Photo, Video)
│   │   ├── JpaRepositories
│   │   └── RepositoryImpls
│   └── matchmaker/
│       └── (Similar structure)
│
├── application/           # Application Layer (Use Cases)
│   └── (To be implemented)
│
└── presentation/          # Presentation Layer (API)
    └── (To be implemented)
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx              # Main application with routing
│   │   └── components/
│   │       ├── ui/              # shadcn/ui components (button, input, etc.)
│   │       ├── LoginScreen.tsx
│   │       ├── EmailLoginScreen.tsx
│   │       ├── EmailSignupScreen.tsx
│   │       ├── AccountTypeSelectionScreen.tsx
│   │       ├── BasicInfoScreen.tsx
│   │       ├── PhotoUploadScreen.tsx
│   │       ├── AboutMeScreen.tsx
│   │       ├── IdealTypeScreen.tsx
│   │       ├── AIProfileEnhanceScreen.tsx
│   │       ├── MyProfileScreen.tsx      # View own profile (read-only photos)
│   │       ├── ProfileEditScreen.tsx    # Edit profile (includes photo upload)
│   │       ├── ProfileDetailScreen.tsx  # View other user's profile
│   │       ├── MainFeedScreen.tsx       # Main feed
│   │       ├── ConnectorDashboard.tsx   # Matchmaker dashboard
│   │       └── MatchmakerProfileScreen.tsx
│   │
│   ├── lib/
│   │   ├── api/
│   │   │   └── apiClient.ts     # HTTP client wrapper with auth
│   │   ├── auth/
│   │   │   ├── authService.ts   # Authentication service
│   │   │   └── tokenStorage.ts  # Token management
│   │   └── utils.ts
│   │
│   └── index.css                 # Tailwind CSS imports
│
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

### Frontend Features

#### Authentication Flow
1. **OAuth2 Login**: Kakao, Naver, Google, Apple
2. **Email Login/Signup**: Traditional email authentication
3. **Token Management**: Access token in localStorage with refresh handling
4. **Protected Routes**: Automatic redirect to login if unauthenticated

#### Profile Registration Flow
1. **Account Type Selection**: Regular user or Matchmaker-only
2. **Basic Info**: Name, birth date, gender, height, body type, job, education, location
3. **Photo Upload**: Up to 6 photos (3x2 grid), optional video, trust score calculation
4. **About Me**: Self-introduction (50-500 chars), interests (max 10), lifestyle
5. **Ideal Type**: Age/height range, body types, personalities, date style, purpose
6. **AI Profile Enhancement**: Final review and completion

#### Profile Management
- **MyProfileScreen**: View own profile (read-only, photos cannot be uploaded here)
- **ProfileEditScreen**: Edit all profile fields including photos (chip-style selections)
- **Data Persistence**: Data saved only on completion, restored on back navigation

#### UI Patterns
- **Chip Selection**: Interactive badge-style selections (body type, job category, education, lifestyle, ideal type)
- **Photo Grid**: 3 columns for edit screen, trust score visualization
- **Progress Indicators**: 5-step progress bar during registration
- **Toast Notifications**: Success/error feedback with sonner
- **Bottom Navigation**: Home, Profile, Messages (TBD), Matchmaker Dashboard

### Domain Models

#### User Aggregate
- **User**: Represents a user account
  - Account types: REGULAR (can match and matchmake), MATCHMAKER_ONLY (matchmaking only)
  - OAuth authentication (Kakao, Naver, Google, Apple)
  - Profile completion status
  - Terms agreement tracking

#### Profile Aggregate
- **Profile**: User's dating profile
  - Basic info (height, body type)
  - Career and education
  - Location and lifestyle
  - Self-introduction and interests
  - Ideal type preferences
  - **Color Type**: 8 personality metaphors (Orange, Blue, Red, Pink, Green, Purple, Yellow, Gray)
  - Trust score (0-100) based on photo/video verification

- **ProfilePhoto**: Profile photos with AI trust analysis
  - Trust factors: SELFIE, TAKEN_BY_OTHERS, UNCLEAR, UNKNOWN
  - AI analysis: face detection, full body, quality score
  - Display order and primary photo

- **ProfileVideo**: Profile videos (5-30 seconds)

#### Matchmaker Aggregate
- **Matchmaker**: Matchmaking activity and rewards
  - Level system (1-5) based on successful matches
  - Commission rate: 30% (Lv.1) → 50% (Lv.5)
  - Statistics: total requests, approvals, rejections, successes, failures
  - Points system: total, withdrawn, pending
  - Success reward: 1,500 points per successful match

### Key Dependencies

- **Web Layer**: Spring Web MVC for REST API endpoints
- **Security**: Spring Security with OAuth2 Authorization Server and OAuth2 Client support
- **Data Access**: Spring Data JPA for database operations
- **Caching**: Spring Cache Abstraction
- **HTTP Client**: Spring RestClient for external API calls
- **Monitoring**: Spring Boot Actuator for application health and metrics
- **Database**: MySQL connector for production, H2 for development/testing

### Kotlin Configuration

The project uses Kotlin compiler options:
- JSR-305 strict mode enabled for null-safety
- Annotation default target set to `param-property` for constructor parameters

JPA entities use the `allOpen` plugin to automatically make JPA annotations open for proxy creation:
- `@Entity`
- `@MappedSuperclass`
- `@Embeddable`

## Development Notes

### Java Version

This project requires Java 21. Ensure your JAVA_HOME points to JDK 21:
```bash
java --version  # Should show version 21
```

### Database Configuration

The project supports both H2 (embedded) and MySQL. Database configuration should be set in `application.properties` or environment-specific property files.

### OAuth2 Setup

The application includes both OAuth2 Authorization Server and OAuth2 Client capabilities. When implementing authentication:
- Authorization Server configuration for issuing tokens
- OAuth2 Client configuration for third-party authentication providers (Kakao, Naver, Google, Apple)

## Business Logic Guidelines

### Matchmaking Flow (Phase 2)

1. **Network Building**: Users connect via phone contacts or invite codes
2. **Profile Browsing**:
   - 1촌 (direct friends): Free
   - 2촌 (friends of friends): 3,000원
   - 3촌 (further): 5,000원
3. **Matchmaking Request**: Requester → Matchmaker approval → Receiver approval
4. **Match Success**: Contact exchange + matchmaker reward (30-50% commission)
5. **Cooldown**: 10 days before next match request

### Trust Score Calculation

- Base: 0 points
- Photo upload: +10 per photo (max 3 photos = +30)
- Photo analysis bonuses:
  - +20: Taken by others (EXIF data)
  - +15: Full body photo
  - +10: Clear face
  - +5: Various situations
- Video upload: +50 (high trust)
- Penalties:
  - -10: Over-processed
  - -15: Unclear face
- Tiers: Bronze (0-40), Silver (41-70), Gold (71-100)

### Commission Structure

Matchmaker levels and commission rates:
- Lv.1 (0-2 matches): 30%
- Lv.2 (3-5 matches): 35%
- Lv.3 (6-10 matches): 40%
- Lv.4 (11-20 matches): 45%
- Lv.5 (21+ matches): 50%

## API Design Principles

When implementing APIs, follow these guidelines:

1. **RESTful Design**: Use standard HTTP methods and status codes
2. **DTO Layer**: Never expose domain models or entities directly
3. **Error Handling**: Use custom exceptions and global exception handler
4. **Validation**: Use Bean Validation annotations on DTOs
5. **Security**: Protect endpoints with Spring Security
6. **Documentation**: Use Swagger/OpenAPI for API documentation

## Testing Guidelines

- **Unit Tests**: Test domain logic in isolation (no Spring context)
- **Integration Tests**: Test repository layer with H2 database
- **API Tests**: Test controllers with MockMvc
- **Test Coverage**: Aim for 80%+ coverage on domain and application layers

## MVP 구현 현황 (2025-05)

### ✅ 구현 완료
- 이메일 인증 기반 회원가입/로그인 + JWT
- Kakao OAuth2 로그인
- 프로필 생성 플로우 (4단계: BasicInfo → PhotoUpload → AboutMe → IdealType)
- AI 프로필 분석 (OpenAI gpt-4o-mini) — `OPENAI_API_KEY` 필요
- 사진/영상 업로드 (S3 prod / 로컬 dev)
- 지인 네트워크 피드 (2촌 기반 + 필터)
- AI 시그널 추천 (현재 날짜+userId 시드 기반 랜덤, Phase 3에서 벡터 유사도로 교체)
- 주선 요청 플로우 (2단계 승인: 주선자 → 수신자)
- 주선자 대시보드 + 레벨 시스템 (Lv.1-5)
- 전화번호 인증 (NCP SENS prod / Mock dev)
- 푸시 알림 이벤트 발행 (FCM prod / Mock dev)
- 리그/랭킹 시스템
- 관계 단계 트래킹

### 🚧 MVP에서 제한/미완성
- **AI Signal unlock 결제**: paymentKey 존재 여부만 체크. Phase 2에서 Toss 검증 연동 필요
- **채팅**: 프론트 mock. WebSocket/SSE 백엔드 미구현
- **알림 화면**: 프론트 mock. 백엔드 알림 조회 API 미연동
- **매칭 상세 / 마켓플레이스**: 프론트 mock 데이터
- **사진 신원 검증**: 95% 통과 mock. Vision API 미연동
- **홈택스 직업 검증**: UI stub
- **Apple/Google/Naver OAuth**: UI 표시되나 백엔드 미지원 (graceful error 반환)

### 🔐 보안 규칙 (코드 기여 시 필수 준수)
- `JWT_SECRET`, `KAKAO_CLIENT_ID/SECRET` 등 실제 자격증명을 코드/application.yml 기본값으로 절대 커밋 금지
- 새로운 환경변수 추가 시 `.env.example`에 반드시 문서화
- `println` 대신 `LoggerFactory.getLogger()` 사용
- 새 엔드포인트는 반드시 `@AuthenticationPrincipal AuthUser`로 인증 체크