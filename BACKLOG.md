# Palette — Beta 운영 백로그

> 새 작업이 추가되면 우선순위에 맞춰 위치 재배치할 것.
> 완료 시 ✅ 처리 후 완료 섹션으로 이동.

---

## 🔖 현재 상태 (Resume here)

**최근까지 한 일 (2026-05-24):**
- 🎉 베타 가동 성공 (https://www.palette.ai.kr)
- UX P1 fix 3종 (온보딩 단축, 환영 인트로, 빈 피드 가이드)
- PWA 셋업 ("홈 화면에 추가" 가능)
- 휴대폰 인증 bypass (베타용 — "000000" 자동 통과)
- 베타 쿠키 TTL 1h → 30d

**진행 중 / 중단된 작업:**
- 🚧 **API 500 에러 디버깅 (로컬에서 재현)** — 회원가입 외 여러 API 가 500 반환 중
  - 시작 방법: `SPRING_PROFILES_ACTIVE=local ./gradlew bootRun` + `cd frontend && npm run dev`
  - 우선 확인: 백엔드 콘솔의 stacktrace, Network 탭의 정확한 URL/응답
  - 가능성 후보: GlobalExceptionHandler 가 잡고있는 unhandled 예외 (NPE? UserMapper 매핑 이슈?)

**미푸시 커밋 (확인):**
```bash
git log origin/main..HEAD --oneline
```

---

## 🔥 P0 — 즉시 대응 (베타 운영 중)

- [ ] **API 500 에러 전체 점검** (현재 진행 중)
  - 회원가입 흐름
  - 그 외 영향받은 API 들 파악
  - 로컬에서 재현 → stacktrace 보고 root cause 잡기

---

## 🟠 P1 — 1-2주 내 완료 (높은 우선순위)

### 🛡️ 프라이버시 가드 누락 (현재 토글 무동작)
- [ ] **`소개받기`(=hiddenAt) / `주선받기`(=isAcceptingMatches) 토글이 실제로 동작하도록**
  - 현재: UI 토글은 있는데 백엔드에서 **어디서도 필터링에 사용되지 않음** (DB 저장만 됨)
  - 검증한 위치 — 누락:
    - `FeedController.getHomeFeed` — 피드 노출 시 대상자의 `hiddenAt` / `isAcceptingMatches` 미체크
    - `FriendshipRepositoryImpl.findSecondDegreeFriendIds` — 중간 주선자의 `isAcceptingMatches` 미체크 (주선받기 off 한 사람을 경유한 2촌 매칭이 그대로 노출됨)
    - `MatchmakingController.request` 등 매칭 요청 생성 시 대상자의 `isAcceptingMatches` 미체크
  - 의도된 동작 (확인 필요):
    - 소개받기 off → 내가 누구의 피드에도 보이지 않음
    - 주선받기 off → 내가 주선자로 경유되지 않음 (내 1촌 A 의 피드에 내 1촌 B 가 안 보임)
    - 둘 다 off 시 매칭 요청 생성 자체가 막혀야 함
  - 적용 방향: 1) 도메인 서비스에 `MatchabilityFilter` 도입, 2) JPA repository 쿼리에 join + WHERE 추가, 3) Feed 결과 매핑 시 필터

### UX / 온보딩 (베타 이탈 방지)
- [ ] **온보딩 진행률 정확히 표시** — 실제 화면 수 또는 예상 소요 시간 표기
- [ ] **주선 탭 역할 명확화** — 일반 유저 / 주선자 뷰 분리

### 인프라 / 운영
- [ ] **모니터링 기본 셋업**
  - `docker logs api` 주기적 확인 자동화
  - 에러 발생 시 슬랙/이메일 알림 (CloudWatch 또는 단순 cron + grep)
- [ ] **MySQL 자동 백업**
  - 매일 새벽 mysqldump → 압축 → S3 업로드
  - 보관 정책: 일별 30일, 주별 6개월
- [ ] **에러 응답 표준화** — GlobalExceptionHandler 가 잡는 일반 Exception 의 메시지 / 추적 ID 강화

### 베타 기능 검증
- [ ] **S3 사진 presigned URL 검증** — 베타 테스터가 사진 업로드/조회 정상 동작 확인
- [ ] **카카오 OAuth 실 사용 검증** — Redirect URI 정상 동작 (베타 테스터 1명 직접 가입)

---

## 🟡 P2 — 1개월 내 (중간 우선순위)

### 📱 모바일 앱 패키징 (Capacitor)
- [ ] **Capacitor 셋업** — React 코드 그대로 iOS/Android 앱으로
  - `npm i @capacitor/core @capacitor/ios @capacitor/android`
  - `npx cap init Palette kr.ai.palette --web-dir=dist`
  - `npx cap add ios && npx cap add android`
- [ ] **네이티브 플러그인 추가** (App Store 심사 통과용)
  - `@capacitor/camera` — 프로필 사진 직접 촬영
  - `@capacitor/push-notifications` + FCM — 매칭 알림
  - `@capacitor/app` — 딥링크 (친구 초대)
  - `@capacitor/share` — 프로필 공유
- [ ] **App Store 출시 준비**
  - Apple Developer Program 가입 ($99/년)
  - Bundle ID 등록: `kr.ai.palette`
  - 앱 아이콘 / 스플래시 / 스크린샷 디자인
  - 개인정보처리방침 + 이용약관 URL 준비
  - 19+ 등급 심사 (데이팅 카테고리)
- [ ] **Play Store 출시 준비**
  - Google Play Console 가입 ($25 일회성)
  - APK/AAB 빌드 + 서명
  - 콘텐츠 등급 설문
- [ ] **PWA 아이콘 정식 디자인** — placeholder SVG 교체
  - 참고: `frontend/public/PWA_ICONS_TODO.md`

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

### 핵심 기능 정식 활성화
- [ ] **NICE 본인인증 실제 키 발급**
  - 현재: DEV bypass 모드 (이름/전화번호 직접 입력)
  - NICE 가입 → `NICE_CLIENT_ID`, `NICE_CLIENT_SECRET` 발급 → .env 반영
  - 운영 전환 후 통합 테스트
- [ ] **NCP SENS 휴대폰 인증 정식 활성화**
  - 현재: bypass=true, 자동 "000000" 통과
  - NCP 가입 → `NCP_SENS_ACCESS_KEY/SECRET/SERVICE_ID` 발급
  - 발신번호 사전 등록
  - .env: `SMS_PROVIDER=ncp`, `PHONE_VERIFICATION_BYPASS=false`
  - 프론트 toast 문구 원복 ("인증번호가 발송되었습니다")

### UX 디테일
- [ ] **사진 검증 안내 vs 실제 동작 일치** — 베타 동안은 검증 미구현 명시 또는 활성화
- [ ] **AboutMe 수동 작성 부담 완화** — 최소 답변 2개로, AI 보완
- [ ] **이메일 가입 계정 유형 선택 단일화** — 이중 노출 제거
- [ ] **이상형 — "연인과 어떤 데이트를 선호" 답정너 개선**
  - 현재 4개 옵션(액티브/실내/문화/자연) 다 선택하기 쉬움 → 변별력 없음
  - 아이디어: ① "주중 vs 주말" 분리, ② 정렬형(가장 선호하는 순서 1~3위), ③ Quadrant 그래프(에너지×실내외) 선택, ④ "이건 안 좋아" 한 가지 제외형
- [ ] **이상형 — "중요하게 보는 가치 3가지" 답정너 개선**
  - 대외 프로필이라 "성격, 외모, 가치관"으로 모이는 답정너 패턴
  - 본심: 경제력/직업/학력도 보지만 프로필에 안 쓰고 싶음
  - 아이디어: ① 모두에게 노출 안 되는 "비공개 가치" 필드 분리 (매칭 알고리즘만 사용), ② "이건 본인 한정" 토글, ③ 페어 비교(A vs B 어느 쪽?)로 답정너 회피, ④ 응답 분포 보여줘서 답정너 회피 동기 부여

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
- [ ] **React Native 리라이트 검토**
  - 사용자 1000명+ 안정 후 의사결정
  - 성능 차별화 가치 있을 때만 (Capacitor 로 보통 충분)

---

## ✅ 완료 (참고용 — 최신순)

### 2026-05-24
- 📱 **PWA 설정** — vite-plugin-pwa, "홈 화면에 추가" 가능, manifest + service worker
- 📞 **휴대폰 인증 bypass** — 베타용 SMS 미발송, "000000" 자동 통과 + 토스트 안내
- 🍪 **베타 쿠키 TTL** 1h → 30d + 만료 시 자동 게이트 복귀
- 🎨 **UX P1 3종 fix** — 온보딩 단축 + 환영 인트로 + 빈 피드 가이드
- 🎉 **베타 로그인 정상 동작** — Redis + OAuth redirect_uri + 휴대폰 인증
- Redis 컨테이너 docker-compose 에 추가 (refresh token 저장)
- OAuth redirect_uri localhost 버그 (server.forward-headers + nginx X-Forwarded-Host)
- GlobalExceptionHandler stacktrace 로깅 추가
- 휴대폰 인증 API permitAll (회원가입 401 fix)
- DevDataSeeder 를 prod 베타 단계에도 활성 (app.seed-enabled 토글)
- BetaGateScreen placeholder 제거
- API BASE_URL 상대경로 (도메인 무관 호환)
- BetaGateScreen 무한 reload 버그 fix
- Hibernate ddl-auto=none + schema.sql 부트스트랩 (SEQUENCES 버그 회피)
- Firebase FCM 조건부 활성 (자격증명 없을 때 Stub fallback)
- Elastic IP 발급 + 도메인 (`www.palette.ai.kr`) + Let's Encrypt SSL
- DB 로컬 접근 (127.0.0.1:3306 SSH 터널)

### 2026-05-23
- 베타 가이드 문서 (`BETA_GUIDE.md`)
- NICE 본인인증 도입 (DEV bypass 모드)
- 베타 코드 게이트 시스템
- S3 비공개 버킷 + presigned URL
- GitHub Actions CI/CD (build + push + deploy)
- Docker 컨테이너 셋업 (api, db, frontend)
- EC2 인스턴스 (palette-prod, t3.small)

---

## 📚 참고 문서

- `BETA_GUIDE.md` — 베타 테스터에게 공유할 안내 문서
- `CLAUDE.md` — 프로젝트 전반 가이드 (코드베이스 구조, 컨벤션)
- `frontend/public/PWA_ICONS_TODO.md` — PWA 아이콘 정식 교체 가이드
- `scripts/server-init.sh` — EC2 서버 초기 셋업 스크립트
- `.env.example` — 환경변수 전체 목록 + 설명

---

## 🎯 정식 출시 전 최종 체크리스트

- [ ] `app.seed-enabled=false` (시드 유저 시딩 비활성)
- [ ] `app.phone-verification-bypass=false` + 실제 NCP SMS 발송 검증
- [ ] `SMS_PROVIDER=ncp` + NCP 키 채움
- [ ] NICE 본인인증 실제 키 발급 + DEV bypass 제거
- [ ] 베타 코드 게이트 비활성 (`BETA_CODE=` 빈 값)
- [ ] Toss 결제 키 test → live 전환
- [ ] CORS 정책 도메인 한정 (`https://www.palette.ai.kr` 만)
- [ ] S3 CORS 도메인 한정
- [ ] App Store / Play Store 출시
- [ ] 개인정보처리방침 / 이용약관 URL 게시
- [ ] 사진 신원 검증 (Vision API) 활성화
- [ ] Flyway 마이그레이션 정착
- [ ] 무중단 배포 적용
- [ ] CloudWatch 알람 + MySQL 자동 백업
