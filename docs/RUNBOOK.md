# Palette — Operations Runbook

> prod 운영 현재 상태. 변경 시 갱신 (자동 or 사람).
> 워커가 "지금 prod 가 어떤 상태인가" 즉답해야 할 때 참조.

---

## 1. 환경 개요

| 환경 | URL | 인프라 |
|---|---|---|
| **prod (베타)** | https://www.palette.ai.kr | EC2 t3.small (54.116.183.195), Elastic IP, Let's Encrypt SSL |
| **dev** | (DEV_EC2_HOST) | EC2 동일 |
| **local** | http://localhost:3000 (frontend), :8081 (backend) | H2 file, dummy secrets |

### prod 컨테이너 (docker-compose.server.yml)
- `palette-api-1` — Spring Boot
- `palette-db-1` — MySQL 8.0
- `palette-redis-1` — Redis 7 (refresh token)
- `palette-frontend-1` — nginx + React build

### 시스템 정책 (2026-05-30 적용)
- **Swap 2GB** (`/swapfile`, `/etc/fstab` 영구화)
- `vm.swappiness=10`
- → ADR `0004-prod-swap-and-memory.md` 참조

---

## 2. 배포 흐름

| 트리거 | 동작 |
|---|---|
| `main` 브랜치 push | GitHub Actions `deploy-prod.yml` 자동 실행 |
| `v*` 태그 push | 동일 (롤백/버전 마커) |
| `workflow_dispatch` | 수동 |

### Actions 단계
1. **build-push** — Docker 이미지 빌드 + `ghcr.io/c-yeonwoo/palette-{api,frontend}:main-{sha7}` push
2. **deploy** — SSH (appleboy/ssh-action) → EC2 에서 `docker compose pull` + `up -d`
3. **downtime**: API ~30-60초 (정식 출시 전 무중단 적용 P2)

### 환경변수 (prod `.env`)
- `OPENAI_API_KEY` ✅ (실키, `sk-...`)
- `JWT_SECRET`, `KAKAO_CLIENT_ID/SECRET`
- `MYSQL_*` (자격증명, DATABASE)
- `BETA_CODE=palette-beta-2026`
- `APP_BASE_URL=https://www.palette.ai.kr`
- `AWS_*`, `S3_BUCKET_NAME`
- `NICE_PRODUCT_ID=2101979031` (실키 미발급 — DEV bypass)
- `NCP_SENS_*` 미설정 (bypass 모드)
- `TOSS_*` test 키 (live 미전환)
- `FIREBASE_*` 미설정 (FCM stub)
- `IMAGE_TAG` (배포 시 갱신)

---

## 3. 시드 데이터 정책

- `app.seed-enabled=true` (베타 단계 — 시드 25명 활성)
- 시드 식별: `dev@palette.kr` + `@dev.palette.kr` 도메인
- 신규 가입자에게 시드 노출 격리: `SeedUserPolicy` (ADR `0003`)
- 정식 출시 전: `app.seed-enabled=false` 검토

### 시드 테스트 계정
- `dev@palette.kr` / `devpass123` (모든 기능 풀 접근)
- `user{1..12}@dev.palette.kr` (REGULAR)
- `mm{1..2}@dev.palette.kr` (MATCHMAKER_ONLY)

---

## 4. 모니터링 / 진단

### 빠른 진단 명령 (SSH 후)
```bash
docker ps --format "{{.Names}}\t{{.Status}}" | grep palette
free -m && swapon --show
docker logs palette-api-1 --tail 200 2>&1 | grep -E "ERROR|Exception|OutOfMemoryError"
docker stats --no-stream
curl -s -o /dev/null -w "%{http_code}\n" https://www.palette.ai.kr/actuator/health
```

### 라이브 메트릭 (현재)
- 누적 OOM: 0 (swap 추가 후)
- API healthy, MySQL/Redis healthy
- 메모리: 1300MB used / 1.9GB, swap 21MB / 2GB

### 알람 (미구현)
- CloudWatch CPU>80% / Mem>85% / Disk>80% (BACKLOG P3)
- `agent:needs_human` 라벨 Slack/Discord ping (Hermes 추후)

---

## 5. 알려진 문제 / 임시 fix

| 문제 | 상태 | 참조 |
|---|---|---|
| 소개받기/주선받기 토글 백엔드 미적용 | P1 fix 필요 | ADR `0005` |
| 휴대폰 인증 SMS 미발송 (베타 bypass) | 의도, P2 활성 | BACKLOG P2 |
| NICE 본인인증 DEV bypass | 의도, P2 실키 | BACKLOG P2 |
| Apple/Google/Naver OAuth UI 노출되나 백엔드 미지원 | 의도, graceful error | — |
| 채팅 / 알림 화면 / 매칭 상세 frontend mock | MVP 제한 | BACKLOG (P2-P3) |
| 사진 신원 검증 95% 통과 mock | MVP 제한 | BACKLOG P2 |
| EC2 t3.small 메모리 빠듯 | swap 으로 mitigate, P2 업그레이드 검토 | ADR `0004` |

---

## 6. 운영 계정 / 접근

| 자산 | 위치 | 권한자 |
|---|---|---|
| EC2 prod | 54.116.183.195 (Elastic IP) | ys.choi (SSH key: `~/.ssh/palette-prod-key.pem`) |
| GitHub repo | https://github.com/c-yeonwoo/palette | ys.choi (자기 계정), nick603 (PAT 별도) |
| 도메인 | www.palette.ai.kr (Let's Encrypt) | — |
| S3 버킷 | `palette-data-v1` (ap-northeast-2) | — |
| OpenAI 키 | console.anthropic.com 별개, OpenAI: console.openai.com | — |

---

## 7. 백업 / 복구

### 현재 (미구현)
- MySQL: docker volume `mysql-data` — 자동 백업 없음
- Redis: `appendonly yes` (재시작 후 복원), 영구 백업 없음
- S3: 버전 미설정 — 삭제 위험

### 추가 예정 (BACKLOG P1)
- 매일 새벽 `mysqldump` → S3 (일별 30일, 주별 6개월 보관)
- S3 versioning 활성

### 복구 절차 (현재 manual)
```bash
# DB 백업 (ad-hoc)
ssh ubuntu@54.116.183.195 \
  'docker exec palette-db-1 mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" palette' \
  > backup-$(date +%Y%m%d).sql

# 복구
ssh ubuntu@54.116.183.195 \
  'docker exec -i palette-db-1 mysql -u root -p"$MYSQL_ROOT_PASSWORD" palette' \
  < backup-YYYYMMDD.sql
```

---

## 8. 비상 대응

| 시나리오 | 1차 행동 |
|---|---|
| 500 폭증 | `docker logs palette-api-1 --tail 200 \| grep ERROR` 후 stacktrace 분석 |
| 메모리 부족 (OOM) | `free -m`, `docker stats` — swap 사용량 확인. 한계 시 `docker restart palette-api-1` |
| DB 연결 실패 | `docker logs palette-db-1`, `docker exec palette-db-1 mysqladmin ping` |
| SSL 만료 | `certbot renew` (90일 자동 갱신 설정됨) — 실패 시 nginx 재시작 |
| 배포 실패 | GitHub Actions 로그, 이전 `IMAGE_TAG` 로 롤백 (`docker compose up -d --no-deps api` 으로 특정 태그) |

---

## 9. 정식 출시 전 체크리스트

`BACKLOG.md` §정식 출시 체크리스트 참조. 핵심:
- `app.seed-enabled=false`
- `app.phone-verification-bypass=false` + NCP 실키
- NICE 본인인증 실키
- 베타 코드 게이트 비활성
- Toss 결제 live 키
- CORS / S3 CORS 도메인 한정
- Flyway 도입
- 무중단 배포
- CloudWatch 알람 + MySQL 자동 백업

---

## 10. 모바일 앱 (iOS / Android) 배포 — ADR 0040

### 10.0 빠른 경로 — TestFlight 1차 (검증된 자동 단계)

```bash
# 자동화된 전 단계 (프론트 빌드 → cap sync → Xcode 열기)
scripts/ios-release.sh            # 또는 --bump (빌드번호 +1), --no-open
```
이 스크립트가 **3/5 까지** (자산·빌드·sync) 끝내고 Xcode 로 핸드오프한다.
**Archive / TestFlight 업로드만 Xcode 에서 수동** (코드 서명 때문). 4·5 단계는 §10.4 참조.

**전제 조건 (사람이 1회 준비):**
- ✅ Apple Developer Program 가입 (완료)
- ⛔ **풀 Xcode.app 설치 필수** — 현재 CommandLineTools 만으론 `pod install`·Archive 불가:
  ```bash
  # Mac App Store 에서 Xcode 설치 후
  sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
  ```
- ✅ CocoaPods (`brew install cocoapods`)

**이미 리포에 준비됨 (재작업 불필요):**
- `frontend/.env.mobile` — 네이티브 빌드 시 `VITE_API_BASE_URL=https://www.palette.ai.kr` 주입
  (웹 prod 빌드 `npm run build` 는 상대경로 유지 — 영향 없음)
- `frontend/assets/{icon,splash,splash-dark}.png` — 브랜드 임시 자산 (정식 전 디자이너 교체)
  - 재생성: `python scripts/gen-app-assets.py`
- `frontend/ios/App/App/PrivacyInfo.xcprivacy` — iOS 17 필수 프라이버시 매니페스트
- Info.plist 권한 문구·URL 스킴·ATS 설정

> ⚠️ **로케일 함정**: 최신 Homebrew Ruby + CocoaPods 는 `LANG`/`LC_ALL` 미설정 시
> `pod install` 이 `Unicode Normalization not appropriate for ASCII-8BIT` 로 죽는다.
> `ios-release.sh` 는 자동 `export LANG=en_US.UTF-8` 한다. 수동 실행 시 직접 지정.

### 10.1 수동 단계 (스크립트 안 쓸 때)

```bash
cd frontend
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8   # 로케일 함정 회피
npm run assets               # capacitor-assets generate (아이콘/스플래시 전 사이즈)
npm run build:mobile         # vite build --mode mobile (절대 API URL)
npx cap sync ios             # dist + 플러그인 → ios/, pod install (풀 Xcode 필요)
npx cap open ios             # Xcode 열기
# Android: npm run build:mobile && npx cap sync android
```

### 10.2 npm 스크립트 (frontend/package.json)

| 스크립트 | 동작 |
|---|---|
| `npm run build` | 웹 prod 빌드 (상대경로, nginx 동일-origin) — **모바일과 분리** |
| `npm run build:mobile` | `vite build --mode mobile` → 절대 API URL 주입 |
| `npm run assets` | capacitor-assets generate (브랜드 컬러 배경) |
| `npm run sync:ios` | build:mobile + cap sync ios |
| `npm run ios` | sync:ios + cap open ios |

### 10.3 버전 / 빌드 번호

- `MARKETING_VERSION` (예 1.0) — 사용자 노출 버전. Xcode 또는 pbxproj 수동.
- `CURRENT_PROJECT_VERSION` (빌드 번호) — TestFlight 업로드마다 **+1 필수**.
  - `scripts/ios-release.sh --bump` 가 자동 증가.

### 10.4 iOS 빌드 → TestFlight (Xcode, 수동)

```bash
npx cap open ios             # 또는 scripts/ios-release.sh 가 자동으로 열어줌
```
Xcode 에서:
1. **App 타깃 → Signing & Capabilities** → Team 선택 (자동 서명 체크). Bundle ID `kr.ai.palette`.
   - Push Notifications capability 추가 (FCM 사용 시)
   - Sign in with Apple capability 추가 (정식 활성화 시 — 베타는 생략 가능)
2. 디바이스 타깃을 **Any iOS Device (arm64)** 로 변경 (시뮬레이터로는 Archive 불가)
3. **Product → Archive**
4. Organizer 창 → **Distribute App → TestFlight & App Store → Upload**
5. [App Store Connect](https://appstoreconnect.apple.com) → 해당 앱 → **TestFlight** 탭
   - 업로드된 빌드가 "처리 중" → 수 분 후 활성화
   - **수출 규정 준수**(Export Compliance): 표준 HTTPS 만 사용 → "면제" 선택
   - **내부 테스터** 그룹에 빌드 할당 (App Store Connect 사용자 = 즉시, 심사 불필요)
   - 외부 테스터(최대 10,000명)는 첫 빌드에 한해 경량 베타 심사 필요

> 첫 업로드 전 App Store Connect 에 앱 레코드가 없으면: My Apps → + → 신규 앱
> (플랫폼 iOS, 이름 "팔레트", 기본 언어 한국어, Bundle ID `kr.ai.palette`, SKU 임의).

### 10.5 Android 빌드 (Android Studio)

```bash
npx cap open android         # Android Studio 열기
# 또는 CLI:
cd android && ./gradlew bundleRelease    # AAB 생성 → Play Console 업로드
```

키스토어:
```bash
keytool -genkey -v -keystore palette-release.keystore -alias palette -keyalg RSA -keysize 2048 -validity 10000
# android/app/build.gradle 의 signingConfigs.release 에 경로/비밀번호 등록 (커밋 금지)
```

### 10.6 App Store Connect 제출 체크리스트

- [ ] App ID `kr.ai.palette` 등록 (Apple Developer)
- [ ] Sign In with Apple capability + Service ID + .p8 키 다운로드
- [ ] AASA (Universal Link) 발급 — `https://palette.kr/.well-known/apple-app-site-association`
- [ ] App Store Connect: 메타데이터, 스크린샷, 17+ 등급, 데이팅 카테고리 (정식 심사 시)
- [ ] App Review Note (영어): "지인 기반 매칭 컨셉 / 본인 인증 / 신고·차단 매커니즘 / 결제는 비활성(베타)" 명시
- [ ] 데모 계정 (Reviewer 가입용): demo@palette.kr / 임시 비밀번호
- [x] Privacy Manifest (`PrivacyInfo.xcprivacy`) — 작성 완료 (추적 false, 수집항목·Required Reason API 선언)
- [ ] 결제 활성화 시 IAP 등록 (외부 결제 거부)

> **TestFlight 내부 테스트(1차)는 위 메타데이터·스크린샷·심사 노트 불필요.**
> Export Compliance + 내부 테스터 할당만 하면 즉시 배포. 위 항목은 정식 App Store 심사 단계에서 채운다.

### 10.7 Google Play Console 체크리스트

- [ ] 패키지명 `kr.ai.palette` 등록
- [ ] 키스토어 백업 (분실 시 앱 업데이트 불가)
- [ ] Data Safety form — 수집 데이터 매핑 (POLICY §1·§3 참조)
- [ ] 콘텐츠 등급 — 데이팅 카테고리 IARC 설문
- [ ] 만 19세 이상 대상 — 광고 노출 제한 설정
- [ ] AAB 업로드 (APK 아님, 2021.8 부터 의무)
- [ ] 테스트 트랙(내부/비공개) → 프로덕션 단계 승격

### 10.8 OTA 업데이트 정책

- 웹 자산(dist)만 변경 시: `cap sync` 후 재제출 (Apple Live Update 정책상 JS 동적 로딩은 제한, 정적 빌드 권장)
- 네이티브 플러그인 변경 시: 반드시 새 빌드 번호 + 심사 제출
- Capacitor Live Updates / Ionic Appflow 도입은 트래픽 확보 후 검토

---

## 11. 결제 활성화 — BACKLOG PA sprint

### 11.1 환경 변수 (application.yml 또는 env)

```bash
# Toss Payments — 가맹 통과 후 발급
PAYMENT_GATEWAY=toss             # mock(베타) → toss(정식)
TOSS_SECRET_KEY=test_sk_...      # test → live_sk_... (가맹 통과 후)

# 참고: application.yml 매핑
# payment.gateway: ${PAYMENT_GATEWAY:mock}
# toss.payments.secret-key: ${TOSS_SECRET_KEY:dummy}
```

### 11.2 Toss 활성화 절차 (PA-002 완료 후)

1. Toss 가맹 신청 → test 키 발급 (즉시) — https://developers.tosspayments.com
2. `.env` 또는 배포 환경변수에 `PAYMENT_GATEWAY=toss` + `TOSS_SECRET_KEY=test_sk_...`
3. 백엔드 재시작 → `TossPaymentGateway` 활성, `MockPaymentGateway` 비활성
4. 프론트 SDK 결제 위젯 호출 → paymentKey 발급 → `POST /api/v1/billing/checkout/confirm`
5. 백엔드가 `confirm()` → PaymentTransaction 멱등 저장 → `grantPaidTickets`
6. 정식 출시 직전 live 키 (`live_sk_...`) 로 교체

### 11.3 결제 검증 테스트 (test 키 단계)

```bash
# Toss 테스트 카드 (4330-1234-1234-1234, CVC 123) 로 위젯 결제 → paymentKey 받음
curl -X POST "$API_URL/api/v1/billing/checkout/confirm" \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"kind":"VIEW","quantity":5,"expectedAmount":4500,"paymentKey":"<TOSS>","orderId":"<UUID>"}'
# → { "status": "OK", "transactionId": "...", "viewTickets": ... }

# 같은 paymentKey 로 재요청 → "ALREADY_PROCESSED" (PA-001 멱등성)
```

### 11.4 IAP 활성화 (Apple/Google, PA-003/004)

각각 별도 sprint. 구현 시 RUNBOOK 보강.
