# 0013 — 주선자 가입 흐름 단순화 (MatchmakerInfoScreen 제거)

- **상태**: Accepted
- **결정일**: 2026-05-31
- **결정자**: ys.choi

## 컨텍스트

기존 주선자 가입 흐름에서 **회원가입 후 별도 `MatchmakerInfoScreen` 단계** 가 있었고, 거기서 닉네임/휴대폰을 **다시 입력**받음. 사용자 피로 + 데이터 일관성 위협.

### 기존 3 경로 (중복 입력 위치 표시)

| 경로 | 1단계 | 2단계 | 3단계 |
|---|---|---|---|
| **A. 이메일 → 주선자 선택** | EmailSignup (닉네임/휴대폰/실명/생년월일 받음) | AccountType 선택 | **MatchmakerInfo — 닉네임/휴대폰 또 받음** 🔴 |
| **B. 카카오 → 주선자 선택** | 카카오 OAuth + RequiredInfo (휴대폰 보강) | AccountType 선택 | **MatchmakerInfo — 또 받음** 🔴 |
| **C. "주선자로 가입하기" 직진** | MatchmakerSignup (모든 정보 한 번에) | — | — ✅ |

C 는 깔끔. A/B 가 문제.

### `MatchmakerInfoScreen` 의 진짜 가치
- 입력 필드: `nickname`, `phoneNumber`, `verificationCode`, `profilePhoto`
- 회원가입에서 이미 받은 것: `nickname`, `phoneNumber`
- 주선자 전용: `profilePhoto` (Marketplace 노출용)

즉 nickname/phoneNumber 는 의미상 중복. profilePhoto 는 `POST /api/v1/matchmakers/me/photo` endpoint 로 ConnectorDashboard / MatchmakerProfileScreen 에서 나중에 입력 가능.

## 검토한 옵션

| 옵션 | 평가 |
|---|---|
| a. **MatchmakerInfoScreen 완전 제거** | ✅ 가장 깔끔. 회원가입 데이터로 충분. Matchmaker entity 만 자동 생성 |
| b. 닉네임/휴대폰 제거, 주선자 전용 필드만 남김 (자기소개/사진) | 한 단계 유지 — 의미 있는 입력만. 다만 화면 분리 가치 작음 |
| c. prefill + 읽기전용 | 단계는 그대로 — 피로 부분 해결 안 됨 |

## 결정

**옵션 a** 채택. `MatchmakerInfoScreen` 완전 제거.

### 프론트 변경
1. `App.tsx`
   - `handleAccountTypeSelection("MATCHMAKER_ONLY")` → 곧장 `setCurrentScreen("connectorDashboard")` + 성공 toast
   - Screen 타입에서 `"matchmakerInfo"` 제거
   - import / 라우트 / handler 정리
2. `MatchmakerInfoScreen.tsx` 파일 삭제

### 백엔드 변경
3. `AuthController.updateAccountType`:
   - MATCHMAKER_ONLY 로 전환 시 **Matchmaker entity 자동 생성** (이미 있으면 skip)
   - `MatchmakerStats.initial()`, `MatchmakerLevel.initial()`, `MatchmakerEarnings.initial()` 으로 초기화
   - `profilePhoto = null` — 사진은 추후 `POST /api/v1/matchmakers/me/photo` 로

### `PUT /api/v1/auth/matchmaker/complete-info` 는 그대로 유지
- 휴대폰 인증 누락 케이스를 위한 보조 path
- 프론트에서 호출 안 함 (라우트 제거)
- deprecation 처리 가치 작음 — 베타 단계라 그대로 둠

## 룰 (이후)

- `MATCHMAKER_ONLY` 계정의 추가 정보 (자기소개, 사진, 활동 지역 등) 는 ConnectorDashboard / MatchmakerProfileScreen 에서 입력
- Matchmaker entity 자동 생성 시 사진/소개는 비어있음 — Marketplace 노출은 사용자가 명시적으로 활성화 (`isPublicProfile` 토글)
- 회원가입 단계에서 받은 닉네임/휴대폰은 절대 다시 묻지 않음 (UX 룰)

## 영향

- 가입 흐름 단축 — A/B 경로에서 1 단계 제거
- 회원가입 데이터 일관성 ↑ — 단일 출처 (User entity)
- Matchmaker entity 생성 시점 명확화 — AccountType 변경 트리거

## Follow-up

- `MatchmakerSignupScreen` ("주선자로 가입하기" 직진) 흐름도 향후 검토 — 일반 가입과 거의 동일하므로 통합 가능
- `MatchmakerProfileScreen` 에 사진/자기소개 입력 위젯이 잘 노출되어 있는지 확인
- 카카오 OAuth 의 휴대폰 미수령 케이스 — RequiredInfoScreen 동작 검증
