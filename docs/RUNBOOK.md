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

### 10.1 로컬 환경 준비

```bash
# 한 번만
xcode-select --install                   # Xcode 풀버전 (Mac App Store) 후 설정 변경
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
brew install cocoapods                   # 또는 sudo gem install cocoapods
# Android Studio 설치 → SDK 확인 → ANDROID_HOME 환경변수 등록
export ANDROID_HOME=$HOME/Library/Android/sdk
```

### 10.2 디자이너 자산 → 아이콘/스플래시 자동 생성

```bash
cd frontend
# frontend/assets/icon.png (1024×1024), splash.png (2732×2732) 배치 후
npx capacitor-assets generate \
  --iconBackgroundColor '#F4EFE7' \
  --splashBackgroundColor '#F4EFE7'
```

### 10.3 빌드 & 동기화

```bash
cd frontend
npm run build                # vite build → dist/
npx cap sync ios             # dist + 플러그인을 ios/ 로 복사 (CocoaPods 자동 실행)
npx cap sync android         # 동일 for android/
```

### 10.4 iOS 빌드 (Xcode)

```bash
npx cap open ios             # Xcode 열기
# Xcode 상단:
#   Signing & Capabilities → Team 선택 (Apple Developer 계정 필수)
#   Sign in with Apple capability 추가 (정식 활성화 시)
#   Push Notifications capability 추가
# Product → Archive → Distribute App → App Store Connect
```

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
- [ ] App Store Connect: 메타데이터, 스크린샷, 17+ 등급, 데이팅 카테고리
- [ ] App Review Note (영어): "지인 기반 매칭 컨셉 / 본인 인증 / 신고·차단 매커니즘 / 결제는 비활성(베타)" 명시
- [ ] 데모 계정 (Reviewer 가입용): demo@palette.kr / 임시 비밀번호
- [ ] Privacy Manifest (`PrivacyInfo.xcprivacy`) — iOS 17 SDK 부터 필수
- [ ] 결제 활성화 시 IAP 등록 (외부 결제 거부)

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
