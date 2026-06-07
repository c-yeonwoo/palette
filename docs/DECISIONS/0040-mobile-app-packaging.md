# 0040 — 모바일 앱 패키징: Capacitor 7 + 심사 필수 기능 일괄 셋업

- **상태**: Accepted (Phase 1 베타 패키징 완료, 심사 직전 D-day 작업 별도)
- **결정일**: 2026-06-08
- **결정자**: ys.choi

## 컨텍스트

베타 PWA 로 운영 중인 팔레트(React + Vite + Tailwind v4)를 App Store / Google Play 정식 심사에 올려야 함. 옵션:

| 후보 | 평가 |
|---|---|
| **Capacitor 7** | Vite/React 그대로 활용, 네이티브 플러그인 풍부, Ionic 사 active 메인테넌스, 최근 Apple 심사 성공 사례 다수 |
| Cordova | 레거시, 메인테넌스 둔화 |
| React Native (WebView 임베드) | 오버엔지니어링, 기존 코드 큰 변경 |
| PWABuilder | iOS 약함, 데이팅 카테고리 거부 사례 있음 |
| Tauri Mobile | 베타 단계, 프로덕션 부적합 |

→ **Capacitor 7**.

또한 데이팅 앱 특성상 Apple/Google 의 추가 심사 항목이 많아 패키징 셋업과 함께 심사 필수 기능을 한 묶음으로 처리.

## 결정

### 1. Capacitor 통합

- `appId`: `kr.ai.palette` (iOS/Android 공통)
- `appName`: `팔레트`
- `webDir`: `dist`
- 핵심 플러그인 7개 설치: `app`, `splash-screen`, `status-bar`, `keyboard`, `browser`, `share`, `preferences`, `push-notifications`
- URL 스킴: `palette://oauth-callback`
- iOS contentInset = `always` / Android `allowMixedContent = false`

### 2. 심사 필수 기능 (P0)

| 항목 | 가이드라인 | 구현 |
|---|---|---|
| **계정 삭제** | Apple 5.1.1(v) / Google Play 2024.5 | `DELETE /api/v1/users/me` + `User.anonymize()` 즉시 PII 익명화 + 30일 보관 후 hard delete |
| **개인정보 처리방침** | Apple 5.1.1 / Play Data Safety | `PrivacyPolicyScreen` — 수집·이용·보유·제3자·이용자권리 8섹션 |
| **이용약관** | 표준 | `TermsOfServiceScreen` — 17+ 등급 명시, 신고·차단·결제·탈퇴 9조 |
| **권한 사용 문자열** | Apple 5.1.1(i) | `NSCameraUsageDescription` 외 7종 한국어 사유 |
| **Android 권한** | Play 정책 | CAMERA / READ_MEDIA_IMAGES / POST_NOTIFICATIONS 등 + cleartext disabled |

### 3. Apple Sign In (P1, baseline only)

- App Store 4.8 — 다른 third-party SSO 있으면 Apple Sign In 의무. 카카오 사용 중 → 필요.
- 베타: 백엔드 `AppleSignInController` stub (501 Not Implemented) + iOS 노출 버튼 placeholder.
- 정식 활성화 절차: Apple Developer 콘솔에서 Sign In with Apple capability + Service ID + .p8 키 → application.yml 주입 → identityToken JWT 검증 (jose4j) → 기존 JWT 발급 흐름 합류.

### 4. 결제 (백로그, P2)

- Apple 의무: 디지털 재화는 IAP 필수 (외부 결제 거부).
- **베타엔 결제 미연동(무료)이라 즉시 영향 없음**.
- Phase 2 결제 활성화 시: 티켓(VIEW/INTRO_REQUEST) + 팔레트 Pick 패스 = IAP, Toss 는 웹/Android 결제 경로로 분리.

## 결과

- `frontend/capacitor.config.ts` + `ios/` + `android/` 셸 생성 완료.
- 백엔드: `UserController.deleteAccount` + `AppleSignInController` stub.
- 프론트: `PrivacyPolicyScreen` / `TermsOfServiceScreen` / `DeleteAccountScreen` 3종 신설, MyPage 설정 메뉴 4항목 (약관·개인정보·로그아웃·탈퇴).
- iOS `Info.plist` 권한 7종 + Android `AndroidManifest` 권한 8종.
- ADR + RUNBOOK 동기.

## 후속 (심사 D-day 전 필수)

1. **앱 아이콘·스플래시** — 디자이너가 1024px 원본 제공 후 `npx capacitor-assets generate`
2. **Apple Sign In 실연동** — Developer 콘솔 셋업 + JWT 키 + identityToken 검증
3. **AASA / Universal Link** — `apple-app-site-association` 발급
4. **Google Play Data Safety form** — POLICY/GLOSSARY 의 데이터 처리 매핑
5. **데이팅 카테고리 심사 메모** — Apple Reviewer Note 한국어/영어 작성 (지인 네트워크 컨셉·신원 인증 흐름·신고/차단 매커니즘 설명)
6. **Crashlytics** — 베타 단계 크래시 수집
7. **In-App Purchase** — 결제 활성화 시점

## 메모

- 패키지명 변경 시 App Store Connect / Play Console 등록 ID 와 충돌 — 베타 운영 중엔 `kr.ai.palette` 고정.
- WebView 단순 wrap 만으로는 Apple 4.2 (Minimum Functionality) 거부 위험 — 푸시·카메라·딥링크·Apple Sign In 네이티브 통합으로 회피.
