# Palette — Beta 운영 백로그

> 새 작업이 추가되면 우선순위에 맞춰 위치 재배치할 것.
> 완료 시 `~~취소선~~` + ✅ 또는 별도 CHANGELOG로 이동.

---

## 🔥 P0 — 베타 운영 중 즉시 대응

> _현재 비어 있음_

---

## 🟠 P1 — 1-2주 내 완료 (높은 우선순위)

### UX / 온보딩 (베타 이탈 방지 — 최우선)
- [x] **온보딩 단축** — BasicInfo step 2/4 선택화, 학력 선택, 건너뛰기 버튼 (2026-05-24)
- [x] **베타 환영 인트로 3-slide** — 베타 게이트 통과 후 가치 각인 (2026-05-24)
- [x] **빈 피드 가이드** — AI Signal 항상 표시 + FirstTimeGuide step-by-step (2026-05-24)
- [ ] **온보딩 진행률 정확히 표시** — 실제 화면 수 또는 예상 소요 시간
- [ ] **주선 탭 역할 명확화** — 일반 유저 / 주선자 뷰 분리

### 인프라 / 운영
- [x] **DB 로컬 접근 셋업** (SSH 터널 + 계정) — 2026-05-24 완료
  - docker-compose 에 `127.0.0.1:3306:3306` 바인딩 추가
  - SSH 터널 + DataGrip 가이드는 [README 또는 별도 문서] 참고

- [ ] **모니터링 기본 셋업**
  - `docker logs api` 주기적 확인 자동화
  - 에러 발생 시 슬랙/이메일 알림 (CloudWatch 또는 단순 cron + grep)

- [ ] **MySQL 자동 백업**
  - 매일 새벽 mysqldump → 압축 → S3 업로드
  - 보관 정책: 일별 30일, 주별 6개월

### 베타 기능 검증
- [ ] **S3 사진 presigned URL 검증**
  - 베타 테스터가 사진 업로드/조회 정상 동작 확인
  - presigned URL TTL (1시간) 적정한지 검증

- [ ] **카카오 OAuth 실 사용 검증**
  - Redirect URI 정상 동작
  - 신규 가입 + 재로그인 흐름 검증
  - 베타 코드 게이트와 함께 사용 시 문제 없는지

---

## 🟡 P2 — 1개월 내 (중간 우선순위)

### 모바일 앱 출시
- [ ] **Capacitor 도입** — React 코드 그대로 iOS/Android 패키징
  - `npm i @capacitor/core @capacitor/ios @capacitor/android`
  - `npx cap init && npx cap add ios && npx cap add android`
  - 카메라/푸시/딥링크 플러그인 추가 (App Store 심사 통과용)
  - Apple Developer Program 가입 ($99/년)
  - Xcode/Android Studio 빌드 → App Store/Play Store 제출
- [ ] **PWA 아이콘 정식 디자인** — 현재 placeholder SVG (frontend/public/PWA_ICONS_TODO.md 참조)

### UX 디테일 (P1 끝난 후)
- [ ] **사진 검증 안내 vs 실제 동작 일치** — 베타 동안은 검증 미구현 명시 또는 활성화
- [ ] **AboutMe 수동 작성 부담 완화** — 최소 답변 2개로, AI 보완
- [ ] **이메일 가입 계정 유형 선택 단일화** — 이중 노출 제거

### 인프라
- [ ] **무중단 배포 (Zero-downtime deploy)**
  - 현재: 매 배포 시 api 약 30-60초 다운타임
  - 옵션 A: nginx upstream + 컨테이너 2개 rolling restart
  - 옵션 B: ALB + 2개 인스턴스 blue/green
  - 정식 출시 전 반드시 적용

- [ ] **CI/CD 빌드 최적화 (Path 기반 변경 감지)**
  - frontend만 바뀌면 backend 재빌드 안 하도록
  - `dorny/paths-filter` 액션 사용

### 데이터 / 마이그레이션
- [ ] **Flyway 도입**
  - 현재: `schema.sql` 부트스트랩 + `ddl-auto=none`
  - Flyway 의존성 추가 → `V1__init.sql` 로 baseline
  - 이후 스키마 변경은 `V2__xxx.sql` 형태로 버전 관리

### 핵심 기능
- [ ] **NICE 본인인증 실제 키 발급**
  - 현재: DEV bypass 모드 (이름/전화번호 직접 입력)
  - NICE 가입 → `NICE_CLIENT_ID`, `NICE_CLIENT_SECRET` 발급 → .env 반영
  - 운영 전환 후 통합 테스트

---

## 🟢 P3 — 시간 여유 될 때 (낮은 우선순위)

- [ ] **CloudWatch 알람**
  - CPU > 80%, Memory > 85%, Disk > 80%
  - SNS → 이메일 또는 슬랙

- [ ] **CDN (CloudFront)**
  - S3 + CloudFront 로 사진 전송 속도 개선
  - 트래픽 늘면 (~동접 100+) 도입

- [ ] **API 응답 캐싱**
  - 프로필 조회 등 자주 호출되는 readonly 엔드포인트
  - Redis 활용

- [ ] **로그 집계 (Loki / CloudWatch Logs)**
  - docker logs 휘발성 → 검색 가능한 영구 저장소

---

## ✅ 완료 (참고용)

- 2026-05-24 — 📱 **PWA 설정** (vite-plugin-pwa, "홈 화면에 추가" 가능, manifest + service worker)
- 2026-05-24 — 🎨 **UX P1 3종 fix** (온보딩 단축 + 환영 인트로 + 빈 피드 가이드)
- 2026-05-24 — 🎉 **베타 로그인 정상 동작** (Redis + OAuth redirect_uri + 휴대폰 인증 다 해결)
- 2026-05-24 — Redis 컨테이너 docker-compose 에 추가 (refresh token 저장)
- 2026-05-24 — OAuth redirect_uri 가 localhost 로 가던 버그 (server.forward-headers + nginx X-Forwarded-Host)
- 2026-05-24 — GlobalExceptionHandler stacktrace 로깅
- 2026-05-24 — 휴대폰 인증 API permitAll (회원가입 401 fix)
- 2026-05-24 — Seeder 를 prod 베타 단계에도 활성 (app.seed-enabled 토글)
- 2026-05-24 — BetaGateScreen placeholder 제거
- 2026-05-24 — API BASE_URL 상대경로 (도메인 무관 호환)
- 2026-05-23 — NICE 본인인증 도입 (DEV bypass 모드)
- 2026-05-23 — 베타 코드 게이트 시스템
- 2026-05-23 — S3 비공개 버킷 + presigned URL
- 2026-05-23 — GitHub Actions CI/CD 인프라 (build + push + deploy)
- 2026-05-23 — Docker 컨테이너 셋업 (api, db, frontend)
- 2026-05-24 — Hibernate 7.2 + MySQL 호환성 (`schema.sql` 부트스트랩 + `ddl-auto=none`)
- 2026-05-24 — Firebase FCM 조건부 활성 (자격증명 없을 때 Stub fallback)
- 2026-05-24 — Elastic IP + 도메인 (`www.palette.ai.kr`) + Let's Encrypt SSL
- 2026-05-24 — BetaGateScreen 무한 refresh 버그 fix
