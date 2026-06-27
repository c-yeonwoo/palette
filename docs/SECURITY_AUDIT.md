# 배포 전 보안 감사 (2026-06-27)

> 인증/IDOR · 시크릿/prod 하드닝 · 결제 무결성/어뷰징 · PII/업로드/인젝션 · 프론트 · 의존성 6개 영역 전수 감사.
> 아래 "✅ 이번 수정"은 코드 반영 완료. "🔧 보류"는 후속(리스크/규모 큼). "⚙️ prod 설정"은 배포 시 env로 처리.

---

## ✅ 이번 PR에서 수정 (코드)

| 심각도 | 항목 | 파일 | 수정 |
|---|---|---|---|
| **CRITICAL** | prod 어드민 시드 `adminpass123` 하드코딩 → 어드민 패널 탈취 | `DevDataSeeder.kt` | 비번을 `${ADMIN_SEED_PASSWORD}` env 주입 + 로그에서 비번 제거 |
| **CRITICAL** | `DataInitializer` 테스트계정(`test1234`) prod 생성 | `DataInitializer.kt` | `@Profile("!prod")` 로 prod 차단 |
| **HIGH** | IDOR — 사진 재정렬이 소유권 미검증(타인 사진 대표/순서 조작) | `ProfileController.kt` reorderPhotos | `photo.profileId != profile.id` 가드 |
| **HIGH** | NICE dev-bypass(본인인증 우회)가 prod 미게이트 | `NiceIdentityController.kt` | `app.nice-dev-bypass-enabled=false`(prod) → 404 |
| **HIGH** | prod DEBUG 로그(SQL/시큐리티/JWT 클레임) 노출 | `application-prod.properties` | `kr.ai.palette=INFO`, security=WARN, SQL=WARN |
| **HIGH** | Swagger/OpenAPI prod 공개(전체 API 맵 노출) | `application-prod.properties` | `springdoc.*.enabled=false` |
| **MEDIUM** | Mass-assignment — PUT /profile 로 `hiddenAt` 임의 설정/해제 | `ProfileController.kt`, dto | PUT 에서 기존 hiddenAt 보존(전용 토글만 변경) |
| **MEDIUM** | 프론트 `window.__setFlag` prod 노출(페이월/플래그 조작) | `feature-flags.ts` | `import.meta.env.DEV` 가드 |
| **MEDIUM** | `.env.example` 에 Toss 테스트키 + 베타코드 실값 커밋 | `.env.example` | 값 제거(빈 값) |
| **HIGH(dep)** | 런타임 의존성 lodash/yaml 취약점 | `package-lock.json` | `npm audit fix` → prod 의존성 **0 vulnerabilities** |
| — | 업로드 크기 서버 상한 미설정 | `application-prod.properties` | multipart 10MB/12MB |

검증: 백엔드 `./gradlew test` 278 GREEN · 프론트 build + vitest 34 GREEN · prod 의존성 0 vuln.

---

## 🔧 보류 — 후속 처리 권장 (실재 취약점이나 규모/리스크 큼)

### 결제 무결성 (정식 결제 활성화 전 필수 — 현재 베타는 `freeUnlock`로 결제 UI 숨김)
- **AI Signal unlock/subscribe paymentKey 미검증** (`AiSignalController.kt`) — Toss confirm 미호출, 존재 여부만 체크 → 무료 해제/구독 가능. 멱등성(중복 paymentKey) 기록 없음. **Toss 서버검증 + `PaymentTransaction` UNIQUE 적용 필요.**
- **`/matchmaking/direct` 가 100물감 미과금** (`MatchmakingController.kt`) — 일반 경로와 달리 과금 누락. 동일 빌링 로직 적용.
- **잔액 차감 레이스** (`BillingService.consume`, profile-view, unlockColorReport) — 락 없음(last-write-wins) → 동시요청 이중차감/이중해제. `@Lock(PESSIMISTIC_WRITE)` 또는 `@Version` 낙관락.
- **보너스 멱등성** — 초대코드/가입/친구 보너스가 재가입·재요청으로 중복 적립 가능. 이벤트 로그/플래그로 1회 보장.
- **MockPaymentGateway 가 기본**(`matchIfMissing=true`) — prod 는 `payment.gateway=toss` 명시돼 있으나, 미설정 시 무결제 적립. 시작 시 fail-fast 권장.

### PII / 권한
- **매칭 응답에 실명 노출(매칭 완료 전)** (`MatchmakingController.kt` 요청 목록 DTO) — `status==COMPLETED` 전엔 `*RealName` 마스킹 권장.
- **`/api/v1/profile/public/{userId}` 무인증 + 전체 프로필**(시·군·구·회사·학교·소득·인터뷰 답변) — 인증 요구 또는 비친구에게 민감필드 strip. (공유링크 용도면 별도 축약 DTO)
- **matchmaker `/me/members`, feed 의 1촌 실명** — 본인 1촌이라 허용 가능하나, 닉네임 노출로 축소 검토.
- **`findUserByRealName` 전체 스캔 + 이름 해석**(`MatchmakingController.kt`) — 실명 열거/DoS. `matchmakerId(UUID)`를 클라이언트가 보내도록 변경.

### 업로드 / 인젝션 / OAuth
- **업로드 검증이 클라이언트 Content-Type 헤더 의존 + SVG 허용 + EXIF 미제거** — magic-byte 검증(Tika/ImageIO) + 확장자 화이트리스트(jpg/png/webp) + EXIF strip + 재인코딩. (데이팅앱 GPS 유출 방지)
- **OAuth2 성공 핸들러가 토큰을 URL 쿼리로 전달**(`OAuth2AuthenticationSuccessHandler`, 프론트 `OAuth2RedirectHandler`) — 브라우저 히스토리/로그 잔존. fragment(`#`) 또는 1회용 코드 교환으로. (iOS 는 이제 Apple 네이티브라 영향↓)
- **`PersonalityTestResult.link` URL 미검증** — `javascript:`/피싱 가능. https + 도메인 화이트리스트.

### 레이트리밋 / 토큰
- **로그인·회원가입·OTP 발송·결제confirm·초대코드 생성에 레이트리밋 없음** — 크리덴셜 스터핑/SMS 폭탄/열거. 키별 제한 추가. (in-memory 라이미터는 다중 인스턴스에서 무력 → Redis 필요)
- **JWT 를 localStorage 저장**(user+admin) — XSS 시 탈취. 모바일은 `@capacitor/preferences`(네이티브 보안저장), 어드민은 단기 토큰 권장.

---

## ⚙️ prod 배포 시 반드시 설정/확인 (env / 인프라)

| 변수/설정 | 값 | 미설정 시 위험 |
|---|---|---|
| `ADMIN_SEED_PASSWORD` | 강한 무작위 값 | 어드민 패널 탈취 (기본값 잔존) |
| `MYSQL` JDBC `useSSL` | `true`(+`requireSSL`) | PII/크리덴셜 평문 전송 (현재 `useSSL=false`) |
| `PHONE_VERIFICATION_BYPASS` | 정식 출시 시 `false` (+ NCP 키) | 아무 번호 자동 인증 (베타엔 리뷰 편의로 true 유지 가능) |
| `TOSS_CLIENT_KEY`/`TOSS_SECRET_KEY` | live 키 | 샌드박스 키로 동작 |
| `BETA_FREE_UNLOCK` | 수익화 시 `false` | 모든 결제 무료 통과 |
| `REDIS` | 다중 인스턴스 시 필수 | 레이트리밋/리프레시토큰 인스턴스별 분리 |
| `CORS_ALLOWED_ORIGINS` / `app.base-url` | **`palette.ai.kr`** 도메인으로 | 현재 prod 설정이 `palette.kr`(오타/구도메인) — 실도메인 `www.palette.ai.kr` 과 불일치. 동일출처 서빙이면 무해하나 교차출처 시 차단 |

> ⚠️ **도메인 불일치**: `application-prod.properties` 의 `cors.allowed-origins`·`app.base-url` 이 `palette.kr` 인데 실서비스는 `palette.ai.kr`. nginx 동일출처 프록시라 현재는 문제 없지만, NICE 콜백/교차출처 호출 도입 시 교정 필요.

---

## 점검 안 걸린 것 (양호 확인)
- SQL 인젝션: 네이티브 쿼리 없음, 전부 JPQL `:param` 바인딩 — **없음**.
- SSRF: OpenAI/Toss/NICE 모두 하드코딩 베이스 URL — **없음**.
- 관리자 인가: `/api/v1/admin/**` 전부 `hasRole("ADMIN")` 게이트 — **정상**.
- JWT: HMAC 서명 검증, `alg:none` 불가, userId 는 검증된 토큰 subject 에서만 추출 — **정상**.
- iOS/Android: ATS·cleartext 차단, remote `server.url` 없음 — **정상**.
