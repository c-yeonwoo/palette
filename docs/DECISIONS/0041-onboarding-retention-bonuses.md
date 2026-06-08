# 0041 — 온보딩/리텐션 보너스 정책 + P0 retention 트리거

- **상태**: Accepted (베타)
- **결정일**: 2026-06-08
- **결정자**: ys.choi

## 컨텍스트

2026-06-08 전략 점검(`docs/BACKLOG.md` 참조) 결과 가장 큰 약점은 **Discover 단계**(가입 → 첫 매칭 도달)와 **주선자 동기 부족**. 결제 진입 friction 도 큼.

가격 정책(ADR 0039) 자체는 유닛 이코노믹스 합리적 — 단, **신규 유저가 가치 체감 전 결제 도달**하는 흐름이 문제. 또 주선자 Lv.1 매칭 1건당 225P (≈225원)는 노력 대비 박해 활동 stall.

## 결정

### 1. 보너스 티켓 모델 — 유료/보너스 분리

`UserTicketBalance` 에 paid / bonus 두 갈래 잔액 + 만료일:

| 컬럼 | 용도 |
|---|---|
| `viewTicketCount`, `introRequestTicketCount` | 유료 충전분, 만료 없음 |
| `bonusViewTicketCount`, `bonusIntroRequestTicketCount` | 보너스/체험권, `bonusExpiresAt` 만료 |

소비 순서: **보너스 → 유료** (사용자에 유리). 만료된 보너스는 조회·소비 시 lazy 0 reset.

### 2. 환영 보너스 (B-001)

가입 직후 1회 자동 지급 — `WelcomeBonusService.grantSignupBonus`:

| 종류 | 수량 | 유효 |
|---|---|---|
| 프로필 열람 티켓 | 3장 | 7일 |
| 소개 요청 티켓 | 1장 | 7일 |

이메일(`EmailAuthController.signup`) + 카카오(`AuthenticationServiceImpl.authenticateOAuth`) 양쪽 가입 hook. 보너스 실패는 가입 자체를 막지 않음 (로그만).

### 3. 친구 가입 보너스 (B-002)

`FriendshipController.acceptFriendRequest` 에서 양쪽 사용자에 열람권 1장 (14일 유효).
어뷰징 가드: PENDING → ACCEPTED 도메인 전이가 1회만 가능해 자연스럽게 1회 발생.

### 4. 주선자 마일스톤 보너스 (B-003)

`MatchmakerMilestonePolicy` SoT — `successfulMatches` 누적치 임계값 도달 시 1회성 포인트:

| 누계 | 보너스 |
|---|---|
| 1건  | +500P |
| 5건  | +2,000P |
| 10건 | +5,000P |
| 20건 | +10,000P |
| 50건 | +25,000P |
| 100건 | +50,000P |
| 150건 (다이아 도달) | +100,000P |

등급별 커미션(ADR 0038)과 별개. `MatchmakingService.acceptByTarget` 후처리에서 `applyMilestoneBonus()` 호출.

### 5. P0 retention 푸시 트리거 (B-007 부분)

| 타입 | 트리거 | 발화 지점 |
|---|---|---|
| `FRIEND_NEW_SIGNUP` | 즉시 | 친구 수락 시 양쪽 |
| `POST_MATCH_NUDGE` D+1 | 매일 오전 10시 | 매칭 성사 후 1일 — "첫 메시지" |
| `POST_MATCH_NUDGE` D+3 | 매일 오전 10시 | 매칭 성사 후 3일 — "만남 일정" |
| `POST_MATCH_NUDGE` D+7 | 매일 오전 10시 | 매칭 성사 후 7일 — "소감" (기존 동작) |

스케일·옵트인 결정 필요한 나머지 3종은 P1 (`B-115/116/117`).

### 6. 친구 초대 마법사 (B-005)

신규 가입 온보딩 마지막 단계(`aiProfileEnhance`) 완료 → `InviteWizardScreen` 1회 노출 → `mainFeed`.
재가입·재분석 흐름엔 노출 X. 스킵 가능. 친구 코드 + 시스템 Share API + 클립보드 복사.

### 7. 결제 화면 (B-004)

`BillingScreen` 신설 — 잔액 카드(보너스/유료 분리 표시) + 묶음 카탈로그(1/5/10장).
5장에 `BEST VALUE` 배지, 10장에 `MAX 할인` 배지.
베타엔 결제 미연동 → 클릭 시 "정식 출시 후 지원" 토스트.

## 정책 튜닝 (application.yml)

```yaml
app:
  bonus:
    signup-view-tickets: 3
    signup-intro-tickets: 1
    signup-valid-days: 7
    friend-signup-view-tickets: 1
    friend-signup-valid-days: 14
```

운영 중 KPI 보고 튜닝. 다이아 마일스톤 (150건) 도달 데이터 확보 후 적정 보너스 재검토.

## 결과

- 신규 유저 가입 후 7일간 매칭 1건 시도 가능 (열람 3 + 소개 1 = ≈ 6,000원 가치).
- 친구 1명 가입마다 양쪽 ≈ 1,000원 가치 + 14일 유효.
- 주선자 첫 매칭에 +500P 보너스로 Lv.1 동기 부여.
- BillingScreen 으로 결제 UX baseline.
- 매칭 후 D+1/D+3/D+7 nudge 로 매칭 → 실제 만남 전환율 ↑.

## 가격 정책 — 미래 방향 (확정 X)

`docs/BACKLOG.md` 메모. 정식 결제 활성화 시점에 ADR 0042 로 분리해 확정 예정.

- 소개 요청 티켓 번들: 1장 10,000원 / 5장 40,000원 / 10장 80,000원
- 팔레트 Pick 패스: 9,900원 → 인상 (가치 번들 재설계 함께)
- 초반엔 보너스·체험권으로 할인 폭 ↑

## 후속

`docs/BACKLOG.md` P1·P2 항목. 다음 sprint 후보:
- B-115/116/117 — 나머지 푸시 트리거
- B-101 — 팔레트 Pick 패스 번들 재설계
- B-102 — 가격 A/B 테스트
- B-114 — 데모 풀 옵트인 전환
