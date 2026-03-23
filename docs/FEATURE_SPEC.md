# Palette 기능 명세서

> 최종 업데이트: 2026-03-23
> 테스트 커버리지: 211개 테스트 통과

Palette는 지인 네트워크 기반 신뢰 데이팅 앱입니다. 화가가 팔레트에서 색을 고르듯, 각자의 개성과 이상형이라는 고유한 색을 찾아 조화로운 관계를 만드는 서비스입니다.

---

## 목차

1. [인증 & 계정](#1-인증--계정)
2. [프로필](#2-프로필)
3. [친구 네트워크](#3-친구-네트워크)
4. [홈 피드](#4-홈-피드)
5. [주선 (매칭)](#5-주선-매칭)
6. [관계 단계 관리](#6-관계-단계-관리)
7. [AI 허브](#7-ai-허브)
8. [운세](#8-운세)
9. [알림](#9-알림)
10. [마이페이지 (보증)](#10-마이페이지-보증)
11. [주선자 대시보드](#11-주선자-대시보드)
12. [리그](#12-리그)
13. [결제](#13-결제)
14. [핸드폰 인증](#14-핸드폰-인증)

---

## 1. 인증 & 계정

### 이메일 회원가입 (일반)

- **설명**: 이메일/비밀번호로 일반 사용자(REGULAR) 계정을 생성하고 JWT 토큰을 반환합니다.
- **엔드포인트**: `POST /api/v1/auth/email/signup`
- **핵심 비즈니스 규칙**:
  - 이메일 중복 체크 (이미 존재하면 400)
  - 닉네임 중복 체크 (이미 존재하면 400)
  - 핸드폰 번호 중복 체크 (이미 존재하면 400)
  - 가입 시 `isPhoneVerified = true` (프론트에서 인증 완료 후 가입하므로)
  - 계정 유형 `REGULAR`, 프로필 완성 여부 `false`
  - 비밀번호는 BCrypt로 해시 저장
  - 성공 시 accessToken + refreshToken 반환
- **테스트**: ⚠️ 부분적

### 주선자 전용 이메일 회원가입

- **설명**: 이메일/비밀번호로 주선자 전용(MATCHMAKER_ONLY) 계정을 생성합니다.
- **엔드포인트**: `POST /api/v1/auth/email/matchmaker/signup`
- **핵심 비즈니스 규칙**:
  - 이메일, 닉네임, 핸드폰 번호 중복 체크
  - 계정 유형 `MATCHMAKER_ONLY` - 매칭 서비스 이용 불가, 주선만 가능
  - 가입 시 `isPhoneVerified = true`
  - `verificationCode` 파라미터 있으나 현재 실제 검증 미구현 (TODO)
- **테스트**: ⚠️ 부분적

### 이메일 로그인

- **설명**: 이메일과 비밀번호로 로그인하고 JWT 토큰을 반환합니다.
- **엔드포인트**: `POST /api/v1/auth/email/login`
- **핵심 비즈니스 규칙**:
  - 이메일로 사용자 조회, 없으면 401
  - BCrypt로 비밀번호 검증, 불일치 시 401
  - 성공 시 `lastLoginAt` 갱신
  - accessToken + refreshToken 반환
- **테스트**: ⚠️ 부분적

### 토큰 갱신

- **설명**: refreshToken으로 새 accessToken과 refreshToken을 발급합니다.
- **엔드포인트**: `POST /api/v1/auth/refresh`
- **핵심 비즈니스 규칙**:
  - 유효하지 않은 refreshToken이면 예외 발생
- **테스트**: ❌ 없음

### 내 정보 조회

- **설명**: 현재 로그인된 사용자의 기본 정보를 반환합니다.
- **엔드포인트**: `GET /api/v1/auth/me`
- **핵심 비즈니스 규칙**:
  - 계정 유형(REGULAR/MATCHMAKER_ONLY), 프로필 완성 여부, 핸드폰 인증 여부 포함
  - `canAccessMatchingService`: REGULAR + 프로필 완성 시 true
  - `canAccessMatchmakerService`: 모든 유저 true
- **테스트**: ✅ 있음 (AuthUserTest)

### 로그아웃

- **설명**: 현재 사용자를 로그아웃합니다.
- **엔드포인트**: `POST /api/v1/auth/logout`
- **핵심 비즈니스 규칙**:
  - 토큰 무효화
- **테스트**: ❌ 없음

### 회원 탈퇴

- **설명**: 계정을 삭제하고 모든 연관 데이터를 cascade 삭제합니다.
- **엔드포인트**: `DELETE /api/v1/auth/me`
- **핵심 비즈니스 규칙**:
  - 로그아웃 처리 후 `UserWithdrawalService.withdraw()` 호출
  - 소프트 삭제 (deletedAt 설정)
- **테스트**: ❌ 없음

### MATCHMAKER_ONLY → REGULAR 전환

- **설명**: 주선자 전용 계정을 일반 계정으로 전환합니다.
- **엔드포인트**: `PATCH /api/v1/auth/convert-to-regular`
- **핵심 비즈니스 규칙**:
  - 현재 계정 유형이 `MATCHMAKER_ONLY`인 경우에만 허용 (아니면 400)
  - 전환 후 `isProfileCompleted = false` (프로필 작성 필요)
- **테스트**: ⚠️ 부분적 (UserDomainTest)

### 기본 정보 수정

- **설명**: 실명, 이메일, 닉네임을 수정합니다.
- **엔드포인트**: `PATCH /api/v1/auth/basic-info`
- **핵심 비즈니스 규칙**:
  - 닉네임 변경 시 중복 체크
- **테스트**: ❌ 없음

### 주선자 정보 완성

- **설명**: 주선자 계정의 닉네임, 핸드폰 번호를 완성하고 Matchmaker 엔티티를 생성합니다.
- **엔드포인트**: `PUT /api/v1/auth/matchmaker/complete-info`
- **핵심 비즈니스 규칙**:
  - 닉네임 중복 체크
  - 핸드폰 번호 중복 체크
  - Matchmaker 레코드가 없는 경우에만 생성
- **테스트**: ⚠️ 부분적

---

## 2. 프로필

### 내 프로필 조회

- **설명**: 현재 로그인된 사용자의 전체 프로필을 반환합니다.
- **엔드포인트**: `GET /api/v1/profile`
- **핵심 비즈니스 규칙**:
  - 조회 시 `lastAccessedAt` 갱신
  - 프로필이 없으면 404
- **테스트**: ⚠️ 부분적

### 프로필 수정

- **설명**: 프로필의 각 섹션을 개별 또는 동시에 수정합니다.
- **엔드포인트**: `PUT /api/v1/profile`
- **핵심 비즈니스 규칙**:
  - 프로필이 없으면 자동 생성
  - 수정 가능한 섹션: basicInfo, careerInfo, educationInfo, locationInfo, lifestyleInfo, introduction, idealType, settings, personalityTests
  - 수정 후 `recalculateMetrics()` 호출 → completionRate 재계산
  - REGULAR 유저가 처음 프로필을 수정하면 `isProfileCompleted = true` 설정
- **테스트**: ✅ 있음 (ProfileDomainTest, ProfileTest)

### 프로필 완성도 계산 (`calculateCompletionRate()`)

- **설명**: 프로필 필드의 완성도를 0~100 사이 정수로 계산합니다.
- **총 23개 필드 기준**:

| 섹션 | 필드 수 | 조건 |
|------|---------|------|
| BasicInfo | 3 | height, bodyType, mbti (mbti는 항상 채워짐) |
| CareerInfo | 3 | category, company, incomeRange |
| EducationInfo | 3 | level, school, major |
| LocationInfo | 2 | sido, sigungu |
| LifestyleInfo | 3 | smoking, drinking, religion |
| Introduction (인터뷰) | 5 | hobby, charm, passion, happiness, motto |
| IdealType | 3 | datePreferences, importantValues, personalities (각각 비어있지 않으면) |
| Photos | 1 | 사진 3장 이상이면 완성 |

- **테스트**: ✅ 있음 (ProfileDomainTest, ProfileTest)

### 프로필 사진 업로드

- **설명**: 프로필 사진을 업로드합니다 (최대 6장).
- **엔드포인트**: `POST /api/v1/profile/photo`
- **핵심 비즈니스 규칙**:
  - 이미지 파일만 허용 (contentType 검사)
  - 파일 크기 10MB 이하
  - 첫 번째 사진이 자동으로 primary 설정
  - 업로드 후 completionRate 재계산
  - TrustFactor는 초기에 UNKNOWN, trustScore = 0
- **테스트**: ⚠️ 부분적 (ProfileDomainTest)

### 사진 순서 변경

- **설명**: 프로필 사진의 표시 순서를 변경합니다.
- **엔드포인트**: `PUT /api/v1/profile/photos/reorder`
- **핵심 비즈니스 규칙**:
  - 0번 인덱스(첫 번째) 사진이 자동으로 primary 설정
- **테스트**: ❌ 없음

### 프로필 설정 수정

- **엔드포인트**: `PATCH /api/v1/profile/settings`
- **설명**: 프로필 설정(매칭 수락 여부 등)을 수정합니다.
- **테스트**: ❌ 없음

### 프로필 공개/비공개 전환

- **엔드포인트**: `PATCH /api/v1/profile/settings/visibility`
- **설명**: 프로필을 숨기거나 공개합니다.
- **핵심 비즈니스 규칙**:
  - 비공개 시 `hiddenAt = now`, `isAcceptingMatches = false`
  - 공개 시 `hiddenAt = null`
- **테스트**: ❌ 없음

### 공개 프로필 조회 / 공유 링크

- **엔드포인트**: `GET /api/v1/profiles/{userId}` (PublicProfileController)
- **엔드포인트**: `GET /api/v1/profile/share/{profileId}` (ShareLinkController)
- **설명**: 다른 사용자의 공개 프로필 조회 및 공유 링크 생성.
- **테스트**: ❌ 없음

### ColorType (색깔 유형)

- **설명**: 8가지 색깔 메타포로 성격을 표현합니다.
- **ColorTypeEnum 목록**: WARM_ORANGE, CALM_BLUE, VIBRANT_RED, SOFT_PINK, FRESH_GREEN, ELEGANT_PURPLE, BRIGHT_YELLOW, SOPHISTICATED_GRAY
- **테스트**: ✅ 있음 (ProfileDomainTest)

---

## 3. 친구 네트워크

### 초대 코드 생성

- **설명**: 친구 연결을 위한 6자리 초대 코드를 생성합니다.
- **엔드포인트**: `POST /api/v1/friends/invite-code`
- **핵심 비즈니스 규칙**:
  - 유저당 1개의 초대 코드만 존재 (기존 코드 삭제 후 생성)
  - 코드 유효 기간: 24시간
  - 코드 형식: 대문자+숫자 6자리, 혼동 문자(O, 0, I, 1) 제외
  - 코드 문자 집합: `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32자)
- **테스트**: ✅ 있음 (InviteCodeTest)

### 초대 코드로 친구 연결

- **설명**: 초대 코드를 입력하여 즉시 친구 관계를 맺습니다.
- **엔드포인트**: `POST /api/v1/friends/join`
- **핵심 비즈니스 규칙**:
  - 코드가 없거나 만료된 경우 400 오류
  - 자기 자신의 코드 사용 불가
  - 이미 친구 관계이면 400 오류
  - 성공 시 즉시 ACCEPTED 상태로 친구 관계 생성 (PENDING 단계 없음)
  - 코드는 1회용 (사용 후 삭제)
- **테스트**: ⚠️ 부분적 (FriendshipDomainTest)

### 친구 요청 보내기

- **설명**: 닉네임으로 검색한 사용자에게 친구 요청을 보냅니다.
- **엔드포인트**: `POST /api/v1/friends/request/{targetUserId}`
- **핵심 비즈니스 규칙**:
  - 대상 사용자가 없으면 400
  - 이미 친구이거나 요청 중이면 400
  - 요청 후 대상자에게 `FRIEND_REQUEST` 알림 발송
- **테스트**: ⚠️ 부분적

### 친구 요청 수락

- **설명**: 받은 친구 요청을 수락합니다.
- **엔드포인트**: `PUT /api/v1/friends/request/{requestId}/accept`
- **핵심 비즈니스 규칙**:
  - 수락 권한: 요청의 user2Id만 수락 가능 (403)
  - 이미 처리된 요청이면 400
  - `Friendship.accept(now)` 호출 → 상태 ACCEPTED, acceptedAt 설정
  - 원래 요청자에게 `FRIEND_ACCEPTED` 알림 발송
- **테스트**: ✅ 있음 (FriendshipDomainTest)

### 사용자 검색

- **설명**: 닉네임으로 사용자를 검색합니다.
- **엔드포인트**: `GET /api/v1/friends/search?query=...`
- **핵심 비즈니스 규칙**:
  - 검색어 2자 미만이면 빈 목록 반환
  - 최대 20명 반환
  - 각 결과에 `isFriend`, `hasPendingRequest` 포함
- **테스트**: ❌ 없음

### 내 친구 목록 조회

- **엔드포인트**: `GET /api/v1/friends`
- **설명**: 수락된 친구 목록을 반환합니다.
- **테스트**: ⚠️ 부분적

### 받은 친구 요청 목록

- **엔드포인트**: `GET /api/v1/friends/requests/pending`
- **설명**: 수락 대기 중인 친구 요청 목록을 반환합니다.
- **테스트**: ❌ 없음

### Friendship 도메인 규칙

- 자기 자신과 친구 관계 생성 불가 (IllegalArgumentException)
- ACCEPTED 상태인데 acceptedAt이 null이면 생성 불가
- `getOtherUserId()`: 친구 관계에 없는 userId 전달 시 IllegalArgumentException
- **테스트**: ✅ 있음 (FriendshipDomainTest)

---

## 4. 홈 피드

### 홈 피드 조회

- **설명**: 2촌 친구들 중 상대 성별 사용자의 프로필을 피드로 반환합니다.
- **엔드포인트**: `GET /api/v1/feed`
- **핵심 비즈니스 규칙**:
  - **노출 대상**: 2촌 친구만 피드에 노출 (1촌은 이미 아는 사람이므로 제외)
  - **성별 필터**: 자신과 반대 성별만 노출
  - **매칭 이력 제외**: 이미 매칭 요청이 있었던 사용자(양방향, 모든 상태) 제외
  - **숨김 제외**: `FeedHideController`로 숨긴 사용자 제외
  - **공통 친구**: 주선 가능한 1촌 공통 친구 목록 포함
  - **카드 열람 비용**: 2촌은 3,000원
  - **열람 여부**: `isOpened` 필드 포함
  - **필터 파라미터**: ageMin, ageMax, heightMin, heightMax, region (sido), jobCategory
- **테스트**: ⚠️ 부분적 (FeedHideControllerTest)

### 카드 열람 기록 저장

- **설명**: 프로필 카드를 열람했음을 기록합니다 (최초 1회).
- **엔드포인트**: `POST /api/v1/feed/open/{targetUserId}`
- **핵심 비즈니스 규칙**:
  - 이미 열람한 경우 중복 저장하지 않음
- **테스트**: ❌ 없음

### 내 친구 목록 (피드용)

- **엔드포인트**: `GET /api/v1/feed/friends`
- **설명**: 1촌 친구 목록을 반환합니다 (주선 가능한 친구 확인용).
- **테스트**: ❌ 없음

### 프로필 숨기기 / 숨김 해제

- **설명**: 피드에서 특정 프로필을 숨기거나 숨김 해제합니다.
- **엔드포인트**: `POST /api/v1/feed/hide/{targetUserId}`
- **엔드포인트**: `DELETE /api/v1/feed/hide/{targetUserId}`
- **엔드포인트**: `GET /api/v1/feed/hide` (숨긴 목록 조회)
- **핵심 비즈니스 규칙**:
  - 사용자별로 격리된 숨김 목록 관리 (in-memory ConcurrentHashMap)
- **테스트**: ✅ 있음 (FeedHideControllerTest)

### AI 시그널 추천

- **설명**: AI 기반 하루 최대 2명 추천 (1번째 무료, 2번째 1,000원).
- **엔드포인트**: `GET /api/v1/feed/ai-signal`
- **엔드포인트**: `POST /api/v1/feed/ai-signal/unlock`
- **핵심 비즈니스 규칙**:
  - 날짜 + userId 시드 기반 랜덤 추천 (벡터 DB 기반 추천 미구현, TODO)
  - 1촌 + 2촌 + 숨긴 사람 제외
  - 잠금 카드에는 나이, 지역 티저 정보만 노출
  - 잠금 해제는 in-memory 처리 (실제 결제 미구현, TODO)
- **테스트**: ❌ 없음

---

## 5. 주선 (매칭)

### 주선 요청 생성

- **설명**: 특정 사용자를 대상으로 주선자를 통한 매칭 요청을 생성합니다.
- **엔드포인트**: `POST /api/v1/matchmaking/request`
- **핵심 비즈니스 규칙**:
  - **쿨타임**: 마지막 COMPLETED 매칭으로부터 10일 이내이면 429 반환
  - 이미 동일 대상에게 요청한 경우 400
  - 주선자는 realName으로 검색 (userRepository.findAll() 전체 스캔, 추후 개선 필요)
  - 요청 생성 후 주선자에게 이벤트 발행 (`PaletteEvent.MatchmakingRequested`)
  - 초기 상태: `PENDING`
- **테스트**: ✅ 있음 (MatchmakingRequestTest)

### 2단계 승인 플로우

```
요청자 → [PENDING] → 주선자 승인 → [MATCHMAKER_APPROVED] → 피주선자 수락 → [COMPLETED]
                    ↘ 주선자 거절 → [REJECTED_BY_MATCHMAKER]
                                   ↘ 피주선자 거절 → [REJECTED_BY_TARGET]
```

| 단계 | 엔드포인트 | 상태 전이 |
|------|-----------|---------|
| 주선자 승인 | `PUT /api/v1/matchmaking/requests/{id}/matchmaker/approve` | PENDING → MATCHMAKER_APPROVED |
| 주선자 거절 | `PUT /api/v1/matchmaking/requests/{id}/matchmaker/reject` | PENDING → REJECTED_BY_MATCHMAKER |
| 피주선자 수락 | `PUT /api/v1/matchmaking/requests/{id}/target/accept` | MATCHMAKER_APPROVED → COMPLETED |
| 피주선자 거절 | `PUT /api/v1/matchmaking/requests/{id}/target/reject` | MATCHMAKER_APPROVED → REJECTED_BY_TARGET |

- **테스트**: ✅ 있음 (MatchmakingRequestTest)

### 쿨타임 상태 조회

- **엔드포인트**: `GET /api/v1/matchmaking/cooltime-status`
- **핵심 비즈니스 규칙**:
  - 마지막 COMPLETED 이후 10일이 쿨타임
  - 쿨타임 중이면 `inCoolTime=true`, `remainingDays` 반환
- **테스트**: ❌ 없음

### 내가 보낸 요청 목록

- **엔드포인트**: `GET /api/v1/matchmaking/requests/pending`
- **설명**: PENDING 또는 MATCHMAKER_APPROVED 상태인 내 요청 목록을 반환합니다.
- **테스트**: ❌ 없음

### 주선자가 받은 요청 목록

- **엔드포인트**: `GET /api/v1/matchmaking/requests`
- **설명**: 주선자로서 받은 모든 요청 목록을 반환합니다.
- **테스트**: ❌ 없음

### 피주선자 대기 요청 조회

- **엔드포인트**: `GET /api/v1/matchmaking/requests/target/pending`
- **설명**: 나를 대상으로 주선자 승인된 요청 목록 (피주선자 입장).
- **테스트**: ❌ 없음

### 요청 중복 확인

- **엔드포인트**: `GET /api/v1/matchmaking/check/{targetUserId}`
- **설명**: 특정 사용자에게 이미 매칭 요청을 했는지 확인합니다.
- **테스트**: ❌ 없음

### 종료 상태 확인 (`isTerminal()`)

- COMPLETED, REJECTED_BY_MATCHMAKER, REJECTED_BY_TARGET → `true` (종료)
- PENDING, MATCHMAKER_APPROVED → `false` (진행 중)
- **테스트**: ✅ 있음 (MatchmakingRequestTest)

---

## 6. 관계 단계 관리

### 관계 단계 조회

- **설명**: COMPLETED 된 매칭의 현재 관계 단계를 조회합니다.
- **엔드포인트**: `GET /api/v1/relationships/{requestId}`
- **핵심 비즈니스 규칙**:
  - COMPLETED 상태의 요청만 조회 가능
  - 주선자의 응원 메시지(`matchmakerDecision.message`) 포함
- **테스트**: ❌ 없음

### 관계 단계 업데이트

- **엔드포인트**: `PUT /api/v1/relationships/{requestId}/stage`
- **단계 목록**: MATCHED → CONTACTS_EXCHANGED → MET → DATING
- **핵심 비즈니스 규칙**:
  - 요청자(requesterId) 또는 피주선자(targetUserId)만 업데이트 가능 (403)
  - COMPLETED 상태의 요청만 업데이트 가능
  - 단계는 in-memory 저장
- **테스트**: ❌ 없음

### 만남 후 사진 유사도 피드백

- **엔드포인트**: `POST /api/v1/relationships/{requestId}/photo-feedback`
- **핵심 비즈니스 규칙**:
  - MET 이상 단계에서만 피드백 가능
  - 유사도 레벨: VERY_SIMILAR, SIMILAR, DIFFERENT, VERY_DIFFERENT
- **테스트**: ❌ 없음

---

## 7. AI 허브

### AI 궁합 계산

- **설명**: MBTI, 별자리(생년월일), 오행, 색깔 유형 기반으로 두 사람의 궁합 점수를 계산합니다.
- **엔드포인트**: `POST /api/v1/ai-insight/compatibility`
- **점수 계산 방식**:

| 항목 | 가중치 | 설명 |
|------|--------|------|
| MBTI | 35% | 황금 궁합(90+), 기질 유사(80), 동일(70), 기본(75) |
| 별자리 | 30% | Fire-Air(95), 동일 원소(90), Water-Fire(55) 등 |
| 오행 | 20% | 상생(85), 동일(80), 기본(75), 상극(55) |
| 색깔 | 15% | 보완 색상(90), 동일(70), 기본(75) |

- **레벨 분류**: 운명적 인연(95+), 천생연분(85+), 잘 어울려요(75+), 노력이 필요해요(65+), 새로운 도전(65 미만)
- **테스트**: ✅ 있음 (CompatibilityCalculatorTest)

### AI 인터뷰

- **설명**: 10단계 인터뷰를 통해 사용자의 색깔 유형과 자기소개를 자동 생성합니다.
- **엔드포인트**: `GET /api/v1/ai-interview/questions`
- **엔드포인트**: `POST /api/v1/ai-interview/analyze`
- **엔드포인트**: `POST /api/v1/ai-interview/complete`
- **인터뷰 단계** (10단계):
  1. 직업 (chips)
  2. 주말 활동 (text)
  3. 성격 (chips)
  4. 관심사 (text)
  5. 행복한 순간 (text)
  6. 이상적인 데이트 (text)
  7. 연애에서 중요한 것 (chips)
  8. 끌리는 사람 (text)
  9. Deal breaker (text)
  10. 인생 좌우명 (text)
- **색깔 타입 결정 로직**:
  - 에너지틱 키워드 → VIBRANT_RED / WARM_ORANGE
  - 차분 키워드 → CALM_BLUE
  - 창의 키워드 → ELEGANT_PURPLE
  - 분석 키워드 → SOPHISTICATED_GRAY
  - 성격 키워드 보정: 긍정적 → BRIGHT_YELLOW, 낭만적 → SOFT_PINK, 자유로운 → FRESH_GREEN
- **테스트**: ❌ 없음

---

## 8. 운세

### 오늘의 운세

- **설명**: 날짜 + 사용자 ID 시드 기반 결정론적 운세를 생성합니다.
- **엔드포인트**: `GET /api/v1/fortune/today`
- **운세 항목**: title, message, loveScore(1~5), luckyNumber(1~99), luckyColor, luckyColorHex(#XXXXXX), compatibilityHint(성별 맞춤)
- **핵심 비즈니스 규칙**:
  - 같은 날짜 + 같은 유저 = 동일한 운세 (시드 기반 결정론)
  - 성별에 따른 궁합 힌트 차별화 (MALE/FEMALE)
- **테스트**: ✅ 있음 (FortuneControllerTest)

---

## 9. 알림

### 알림 목록 조회

- **엔드포인트**: `GET /api/v1/notifications`
- **설명**: 사용자의 모든 알림을 미읽음 수와 함께 반환합니다.
- **테스트**: ❌ 없음

### 알림 읽음 처리

- **엔드포인트**: `POST /api/v1/notifications/read/{notificationId}`
- **테스트**: ❌ 없음

### 전체 알림 읽음 처리

- **엔드포인트**: `POST /api/v1/notifications/read-all`
- **테스트**: ❌ 없음

### 미읽음 알림 수 조회

- **엔드포인트**: `GET /api/v1/notifications/unread-count`
- **테스트**: ❌ 없음

### 알림 유형 (`NotificationType`)

- `FRIEND_REQUEST` - 친구 요청 수신
- `FRIEND_ACCEPTED` - 친구 요청 수락됨
- `MATCHMAKING_REQUESTED` - 주선 요청 수신 (주선자)
- `MATCHMAKING_APPROVED` - 주선자 승인 (피주선자)
- `MATCHMAKING_COMPLETED` - 매칭 성사
- `MATCHMAKING_REJECTED` - 매칭 거절
- `SYSTEM` - 시스템 알림
- **테스트**: ❌ 없음

---

## 10. 마이페이지 (보증)

### 프로필 사진 보증

- **설명**: 1촌 친구 또는 매칭 완료된 사람의 프로필 사진을 보증합니다.
- **엔드포인트**: `POST /api/v1/vouch/{targetUserId}`
- **핵심 비즈니스 규칙**:
  - 자기 자신 보증 불가 (400)
  - 1촌 친구이거나 COMPLETED 매칭 이력이 있는 경우에만 보증 가능 (403)
  - 보증은 in-memory 저장 (재시작 시 초기화)
- **테스트**: ❌ 없음

### 보증 취소

- **엔드포인트**: `DELETE /api/v1/vouch/{targetUserId}`
- **테스트**: ❌ 없음

### 보증 현황 조회

- **엔드포인트**: `GET /api/v1/vouch/{targetUserId}`
- **반환 값**: 보증 수, 보증인 닉네임 목록, 내가 보증했는지 여부
- **테스트**: ❌ 없음

---

## 11. 주선자 대시보드

### 주선자 등록

- **설명**: 주선자 계정을 생성합니다.
- **엔드포인트**: `POST /api/v1/matchmakers`
- **핵심 비즈니스 규칙**:
  - 핸드폰 인증 완료 필수 (`user.canBeMatchmaker()` → 403)
  - 이미 등록된 경우 400
  - 초기 레벨 1, 커미션 30%, 포인트 0
- **테스트**: ✅ 있음 (MatchmakerDomainTest, UserDomainTest)

### 내 주선자 정보 조회

- **엔드포인트**: `GET /api/v1/matchmakers/me`
- **핵심 비즈니스 규칙**:
  - 주선자 레코드가 없으면 자동 생성 (Lv1)
- **반환 정보**: level, commissionRate, totalPoints, availablePoints, withdrawnPoints, pendingPoints, totalMatchRequests, approvedRequests, rejectedRequests, successfulMatches, failedMatches, successRate
- **테스트**: ✅ 있음 (MatchmakerDomainTest)

### 포인트 출금

- **엔드포인트**: `POST /api/v1/matchmakers/me/withdraw`
- **핵심 비즈니스 규칙**:
  - 출금액 > 0 (400)
  - 가용 포인트 이상 출금 불가 (400)
- **테스트**: ✅ 있음 (MatchmakerEarningsTest)

### 프로필 사진 업로드 (주선자용)

- **엔드포인트**: `POST /api/v1/matchmakers/me/photo`
- **핵심 비즈니스 규칙**:
  - 이미지 파일, 10MB 이하
  - 기존 사진 삭제 후 새 사진 저장
  - `hasProfile=false`인 경우에만 저장 (프로필 있으면 프로필 대표사진 사용)
- **테스트**: ✅ 있음 (MatchmakerDomainTest)

### 주선자 레벨 시스템

| 레벨 | 성공 건수 | 커미션율 |
|------|---------|---------|
| Lv.1 | 0~2건 | 30% |
| Lv.2 | 3~5건 | 35% |
| Lv.3 | 6~10건 | 40% |
| Lv.4 | 11~20건 | 45% |
| Lv.5 | 21건 이상 | 50% |

- 매칭 성공 시 1,500 포인트 보상 자동 적립
- 매칭 성공 시 레벨 자동 재계산
- **테스트**: ✅ 있음 (MatchmakerLevelTest, MatchmakerDomainTest)

---

## 12. 리그

### 큐피드 리그 조회

- **설명**: 이번 달 주선 성공 건수 기반의 주선자 랭킹을 조회합니다.
- **엔드포인트**: `GET /api/v1/league`
- **핵심 비즈니스 규칙**:
  - 시즌: 매월 1일 ~ 말일
  - 집계 범위: 이번 달 COMPLETED 상태 매칭
  - 상위 10명 반환
  - 내 랭킹 및 티어 포함
- **테스트**: ✅ 있음 (LeagueTierTest)

### 리그 티어 시스템

| 티어 | 이름 | 최소 성공 건수 | 이모지 |
|------|------|------------|-------|
| BRONZE | 브론즈 큐피드 | 0건 | 🥉 |
| SILVER | 실버 큐피드 | 3건 | 🥈 |
| GOLD | 골드 큐피드 | 6건 | 🥇 |
| PLATINUM | 플래티넘 큐피드 | 11건 | 💎 |
| DIAMOND | 다이아 큐피드 | 21건 | 👑 |

- **테스트**: ✅ 있음 (LeagueTierTest)

---

## 13. 결제

### 결제 기능 현황

- **엔드포인트**: `POST /api/v1/payment/...` (PaymentController)
- **설명**: 결제 관련 기능이 존재하나 상세 구현은 stub 또는 미완성 상태
- **결제가 필요한 기능들**:
  - 2촌 프로필 카드 열람: 3,000원
  - AI 시그널 2번째 카드 열람: 1,000원
- **테스트**: ❌ 없음

---

## 14. 핸드폰 인증

### 인증번호 발송

- **설명**: 핸드폰 번호로 인증번호를 발송합니다.
- **엔드포인트**: `POST /api/v1/verification/phone/send`
- **테스트**: ❌ 없음

### 인증번호 검증

- **설명**: 발송된 인증번호를 검증하고 사용자의 핸드폰 번호를 인증 완료 처리합니다.
- **엔드포인트**: `POST /api/v1/verification/phone/verify`
- **핵심 비즈니스 규칙**:
  - `userId` 파라미터가 있으면 해당 사용자의 `isPhoneVerified = true` 설정
  - `PrivateInfo.verifyPhone()`: phoneNumber가 null이면 IllegalArgumentException
- **테스트**: ✅ 있음 (UserDomainTest)

---

## 도메인 모델 요약

### User Aggregate

| 필드 | 타입 | 설명 |
|------|------|------|
| accountType | REGULAR / MATCHMAKER_ONLY | 계정 유형 |
| isProfileCompleted | Boolean | 프로필 완성 여부 |
| privateInfo.isPhoneVerified | Boolean | 핸드폰 인증 여부 |

- `canUseMatchingService()`: REGULAR + 프로필 완성 + 미삭제
- `canBeMatchmaker()`: 핸드폰 인증 완료 + 미삭제
- **테스트**: ✅ 있음 (UserDomainTest)

### Profile Aggregate

- 불변 도메인 객체 (copy() 패턴)
- 8가지 ColorType으로 개성 표현
- 총 23개 필드 기준 completionRate 계산
- TrustScore: 사진/영상 업로드 기반 (Bronze/Silver/Gold 티어)
- **테스트**: ✅ 있음 (ProfileTest, ProfileDomainTest)

### Matchmaker Aggregate

- 레벨별 커미션 시스템 (30~50%)
- 포인트 시스템: totalPoints - withdrawnPoints - pendingPoints = availablePoints
- 매칭 성공 시 자동 레벨 재계산
- **테스트**: ✅ 있음 (MatchmakerLevelTest, MatchmakerStatsTest, MatchmakerEarningsTest, MatchmakerDomainTest)

### MatchmakingRequest Aggregate

- 5가지 상태: PENDING, MATCHMAKER_APPROVED, REJECTED_BY_MATCHMAKER, COMPLETED, REJECTED_BY_TARGET
- 단방향 상태 전이 (이전 상태로 돌아갈 수 없음)
- **테스트**: ✅ 있음 (MatchmakingRequestTest)

---

## 테스트 현황 요약

| 테스트 파일 | 테스트 수 | 커버 범위 |
|------------|---------|---------|
| FriendshipDomainTest | 12 | Friendship 도메인 (accept, getOtherUserId, isFriendWith, 생성 규칙) |
| ProfileDomainTest | 14 | Profile 도메인 (colorType, photos, completionRate, recalculateMetrics) |
| MatchmakerDomainTest | 17 | Matchmaker 도메인 (recordMatch*, canEarnCommission, uploadPhoto, 레벨/커미션 경계값) |
| AuthUserTest | 9 | AuthUser (canAccessMatchingService, canAccessMatchmakerService, anonymous) |
| UserDomainTest | 14 | User 도메인 (canUseMatchingService, canBeMatchmaker, completeProfile, verifyPhone, delete, getAge) |
| InviteCodeTest | 9 | 초대 코드 형식 검증 (6자리, 유효 문자, 혼동 문자 제외) |
| LeagueTierTest | 13 | LeagueTier (fromMatches 경계값, minMatches, label) |
| FeedHideControllerTest | 9 | 프로필 숨기기/해제/목록/사용자 격리 |
| FortuneControllerTest | 9 | 운세 생성 (범위, 결정론, 성별 맞춤) |
| CompatibilityCalculatorTest | 26 | AI 궁합 (MBTI, 별자리, 오행, 컬러, 전체 점수, 레벨) |
| MatchmakingRequestTest | 10 | 주선 요청 상태 전이, 생성, 종료 상태 |
| MatchmakerLevelTest | 9 | 레벨 계산 경계값 |
| MatchmakerStatsTest | 9 | 통계 카운터, 성사율 계산 |
| MatchmakerEarningsTest | 8 | 포인트 추가/출금/가용 포인트 계산 |
| ProfileTest | 10 | 프로필 생성, BasicInfo 수정, PersonalityTest, completionRate |
| BasicInfoTest, MBTITest, PersonalityTestResultTest | 기타 | BasicInfo, MBTI, 퍼스널리티 테스트 결과 |
| PaletteApplicationTests | 1 | Spring Context Load |

**총 211개 테스트 통과**
