# Palette — Conventions

> 절대 룰. 워커가 어기면 reviewer 가 PR 차단, 사람이 어기면 self-review 로 잡음.
> 새 룰 추가는 ADR 동반 (`docs/DECISIONS/`).

---

## 1. 코드 (백엔드)

### 1.1 DDD 레이어 import 방향 (강제)
```
domain      ← persistence
domain      ← application
application ← presentation
infrastructure ← * (모든 레이어에서 가능)
```
- `domain/*` 에서 `org.springframework.*` import 금지
- `domain/*` 에서 `jakarta.persistence.*` (JPA) import 금지
- `domain/*` 에서 `persistence/*`, `presentation/*` import 금지
- → 컴파일 단위로 강제 어렵지만 reviewer 가 grep 으로 체크

### 1.2 Aggregate Root + Repository 패턴
- 도메인 객체는 `data class` 또는 일반 `class`, JPA Entity 아님
- Repository 인터페이스는 `domain/{domain}/` 에 정의
- 구현은 `persistence/{domain}/{Domain}RepositoryImpl.kt`
- Entity ↔ 도메인 변환은 `{Domain}Mapper.kt` 에서만

### 1.3 Kotlin 컨벤션
- nullable 은 `?` 명시, platform type (`!`) 의존 금지
- `@AuthenticationPrincipal authUser: AuthUser` 는 **non-null 강제** (SecurityConfig 의 permitAll 매처 검증과 함께 사용 — `docs/DECISIONS/0002-security-permitall-narrow.md` 참조)
- 컬렉션 반환 시 nullable list 보다 empty list 선호
- 도메인 메서드는 부수효과 최소화 (e.g. `User.completeProfile()` 은 새 User 반환)

### 1.4 트랜잭션
- `@Transactional` 은 application 또는 presentation 컨트롤러 메서드에 (도메인 X)
- 읽기 전용은 `@Transactional(readOnly = true)`
- repository 호출이 여러 번이면 묶어서 한 트랜잭션

### 1.5 예외
- 비즈니스 규칙 위반: `infrastructure/exception/` 의 사용자 정의 예외 사용
  - `DuplicateResourceException` → 409
  - `BusinessRuleViolationException` → 400
  - `PaymentRequiredException` → 402
  - `CoolTimeActiveException` → 429
  - `ResourceNotFoundException` → 404
- 일반 예외는 `GlobalExceptionHandler` 가 잡음 — 새 예외는 핸들러도 함께 추가
- **null body 로 `ResponseEntity.badRequest().build()` 금지** — 어떤 필드가 잘못됐는지 명확한 메시지로 예외 throw

### 1.6 로깅
- `println` 금지 — `LoggerFactory.getLogger()` 사용
- 사용자 입력 (이메일/전화/이름) 은 마스킹 후 로깅
- stacktrace 는 `log.error("msg", ex)` 형태로

### 1.7 시크릿
- `JWT_SECRET`, OAuth secret, API key 를 코드/yml 기본값에 절대 commit 금지
- `application*.yml` 의 placeholder 는 `${ENV_VAR}` 또는 `${ENV_VAR:dummy-*}` (반드시 `dummy` 접두)
- `.env` 는 gitignored — `.env.example` 만 commit

---

## 2. 코드 (프론트엔드)

### 2.1 디자인 토큰 (강제)
- **raw hex 금지** — `#xxx`, `#xxxxxx` 패턴이 `frontend/src/**.tsx`, `**.ts` 에 있으면 reviewer 차단
- 색은 항상 Tailwind 토큰 또는 CSS 변수:
  - `bg-primary`, `text-foreground`, `bg-card`, `border-border` 등
  - 또는 `hsl(var(--brand))` 같이 CSS variable
- 예외: `frontend/src/styles/theme.css` 만 raw hex 허용 (토큰 정의 자체)
- 디자인 토큰 변경은 ADR 동반 (`docs/DECISIONS/0001-mono-charcoal-design.md` 참조)

### 2.2 radius
- 토큰: `rounded-sm` (6px), `rounded-md` (10px), `rounded-lg` (12px, 카드 기본), `rounded-xl` (14px), `rounded-2xl` (18px), `rounded-full` (pill)
- 임의 `rounded-[24px]` 같은 arbitrary 값 금지

### 2.3 텍스트
- **사용자 노출 한국어**: "팔레트" 사용 (Palette 영문 금지, 단 코드 식별자/주석 영문은 OK)
- 변수/함수/타입 이름은 영문 camelCase / PascalCase

### 2.4 컴포넌트
- 1 컴포넌트 ≤ 300 LOC — 넘으면 분리 권장
- 디자인 시스템 컴포넌트(`ui/*`) 외에는 자유롭게 조합
- 라우팅: `App.tsx` 의 `currentScreen` state 추가 (React Router 미사용)

### 2.5 API 호출
- 모든 호출은 `lib/api/apiClient.ts` 의 `api.{get,post,put,patch,delete}` 경유
- `fetch` 직접 호출 금지
- 401 시 자동 refresh 가 이미 들어있음 — 컴포넌트에서 별도 처리 X

---

## 3. 보안

### 3.1 SecurityConfig 매처
- `permitAll` 에 새 path 추가는 ADR 필수
- 와일드카드 `**` 사용 시 그 아래 모든 endpoint 가 인증 없이 통과 — `@AuthenticationPrincipal AuthUser` 가 한 곳이라도 있으면 NPE 위험 (참조: `docs/DECISIONS/0002-security-permitall-narrow.md`)
- 새 컨트롤러 path 가 기존 와일드카드에 잡히는지 reviewer 가 체크

### 3.2 입력 검증
- DTO 에 `@Valid` + `@NotBlank` / `@Email` / `@Size` 등 명시
- 날짜는 ISO 형식 (`yyyy-MM-dd`) — 프론트에서 정규식 검증 (예: `EmailSignupScreen.tsx`)
- 길이 / 범위 제한 명시

### 3.3 PII / 시크릿
- 사진 URL 은 presigned (1시간 TTL)
- 전화번호는 본인 + 매칭 완료된 상대만 노출
- 실명은 1촌 + 매칭 후 노출 (그 외 닉네임)

---

## 4. 데이터

### 4.1 Migration
- 현재: `schema.sql` 부트스트랩 + `ddl-auto=none` (Hibernate 7 + MySQL `SEQUENCES` 버그 회피)
- Flyway 도입 예정 (BACKLOG P2) — 도입 후 변경 사항 적용

### 4.2 Entity 추가
- nullable 또는 default 값 있는 컬럼만 추가 (기존 row 호환)
- 마이그레이션 스크립트 동반 (`schema.sql` 임시 갱신, Flyway 전환 후 `V{N}__xxx.sql`)
- `docs/ARCHITECTURE.md` §3.3 표 갱신

### 4.3 시드 격리
- `SeedUserPolicy.isSeed(user)` 로 시드/비시드 판별
- 시드 유저 email: `dev@palette.kr` 또는 `@dev.palette.kr` 도메인
- 새 추천/리스트 API 는 시드 격리 적용 (`docs/DECISIONS/0003-seed-user-isolation.md` 참조)

---

## 5. 테스트

### 5.1 백엔드
- 도메인/application: 단위 테스트 (Spring context 없이)
- 컨트롤러: MockMvc 또는 통합 테스트
- 새 컨트롤러 추가 시 최소 1개 happy path 테스트
- `./gradlew test` 가 항상 통과해야 commit

### 5.2 프론트
- Vitest + Testing Library
- 새 컴포넌트 추가 시 최소 렌더 테스트
- `cd frontend && npx vitest run` 통과

---

## 6. 커밋 / PR

### 6.1 커밋 메시지
- 형식: `[TICKET-OR-ISSUE] type: 한국어 메시지`
- type: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `style`
- 코드 식별자는 영문 그대로 (e.g. `fix(auth): /api/v1/auth/** permitAll 매처 좁힘`)
- 워커 자동 커밋: `Co-Authored-By: {agent-name} <noreply@palette.local>` 추가

### 6.2 PR 본문 (필수 섹션)
```
## Summary
- 1-3 bullets

## 변경 사유
- 왜 이 변경이 필요한지

## Test plan
- [x] 실행한 테스트
- [ ] 사람 검수 항목

## SoT 갱신
- ARCHITECTURE.md / CONVENTIONS.md / DECISIONS/NNNN / 갱신 없음
```

### 6.3 SoT 갱신 강제 (reviewer 룰)
| 변경 | 동반 갱신 필수 |
|---|---|
| 새 컨트롤러 / API path | ARCHITECTURE §4, ADR (필요 시) |
| 새 Aggregate / Entity | ARCHITECTURE §3, db-schema (자동) |
| 새 외부 연동 | ARCHITECTURE §7 |
| SecurityConfig 매처 | ARCHITECTURE §5.1 + ADR 필수 |
| 디자인 토큰 변경 | ADR 필수 |
| 새 컨벤션 / 룰 | 이 문서 + ADR 필수 |
| 운영 변경 (swap, DB, 시크릿) | RUNBOOK |
| 큰 변경 (>10 파일) | ADR 필수 |

→ PR 본문에 위 갱신 항목 누락 시 reviewer 가 `agent:needs_human`.

---

## 7. 자동화 (Hermes 워커)

### 7.1 워커 권한
- `palette-pm`: read-only + 라벨 조작만
- `palette-executor`: branch/commit/PR, main 직접 push 금지, `data/`/`.env` commit 금지
- `palette-reviewer`: read + comment, approve/request-changes 금지

### 7.2 워커 커뮤니케이션
- 모든 자동 코멘트는 `🤖 {agent-name} · {timestamp}` prefix
- 사람 코멘트 (`🤖` prefix 없음) 가 마지막에 있으면 워커 작업 멈춤 (다음 cron 까지)

### 7.3 라벨
- `agent:ready` — 워커 작업 가능 (사람 또는 issue-finder 부여)
- `agent:in_progress` — 워커 점유 (PM 이 부여, 워커가 끝나면 다음 라벨로 교체)
- `agent:needs_human` — 사람 결정 대기 (워커는 이 라벨 붙은 거 건드리지 않음)

### 7.4 WIP / 재진입
- 동시 `agent:in_progress` ≤ 10
- 같은 issue/PR 24h 재진입 ≤ 3
- 30분 이상 stale → 자동 release + `needs_human`
