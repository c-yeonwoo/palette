# 0045 — 신규 사용자 트라이얼 시스템

- **상태**: Accepted (베타)
- **결정일**: 2026-06-10
- **결정자**: ys.choi
- **선행**: ADR 0044 (가격 v2), ADR 0042 (단일 잔액)

## 컨텍스트

ADR 0044 가격 인상으로 신규 가입자 진입 장벽 ↑. 핵심 가치(친친 풀 탐색·소개 요청·AI 추천) 체험 전 결제 의향 형성 어려움.

동시에 **출금 어뷰징 방어** 필수:
- 신규 가입 → 보너스 수령 → 즉시 출금 시도
- 다중 계정 가입 → 트라이얼 혜택 반복 수확
- 반값 패키지 결제 → 환불 후 paidPoints 보존

## 결정

신규 가입자에게 4개 트라이얼 + 환영 보너스 60 물감 (ADR 0044 §4) 부여.
**모든 혜택은 `bonusPoints` 또는 별도 카운터** — `paidPoints` 안 거침 → **출금 경로 차단**.

### 1. 프로필 열람 트라이얼 (3일 + 일 5명)

- 가입 후 3일간 친친 + 한 다리 더 건너 프로필 **무료 열람** (정상 단가 20/30 물감 차감 스킵)
- 일일 캡 5명 (다중 계정 어뷰징 가드)
- 열람한 프로필은 `paid_views` 에 unlock 영속화 → **트라이얼 종료 후에도 재열람 무료**
- 한계비용 ≈ 0 (DB read)

**필드**:
- `viewsTrialUntil: Instant?` (가입 + 3일)
- `viewsUsedToday: Int`
- `viewsTodayResetDate: LocalDate?`

### 2. 반값 묶음 트라이얼 (3일 + 110 물감 묶음 1회)

- 가입 후 3일 내 첫 결제 1회만 110 물감 묶음(10,000원→**5,000원**) 적용
- 다른 묶음(50/340/575)은 정가
- 손실 한도: -5,000원/가입자

**어뷰징 방어**:
- 환불 시 `bonusPoints` 로 환급 (출금 경로 차단)
- `halfPricePackageUsed: Boolean` flag 영구 (재가입해도 한 번뿐)

**필드**:
- `halfPricePackageUntil: Instant?` (가입 + 3일)
- `halfPricePackageUsed: Boolean` (한 번 사용 시 true)

### 3. 무료 소개 요청 (1회 / 7일 / 동일 주선자 1회)

- 가입 후 7일 내 소개 요청 1회 무료 (100 물감 차감 스킵)
- **동일 주선자에게 1회만** — 같은 주선자 반복 차단 (매칭 품질 보호)
- 거절 시 카운터 복원 X (신중함 유도)
- **팁(성의 표시)은 별도** — 무료 소개 요청도 팁은 정상 차감
- **주선자 보상은 정상 발생** — 플랫폼이 부담 (주선자 supply 보호)

**필드**:
- `freeIntroRequestsRemaining: Int` (초기 1)
- `freeIntroRequestsExpiresAt: Instant?` (가입 + 7일)
- `freeIntroUsedMatchmakerIds: Set<UUID>` (동일 주선자 차단)

### 4. 팔레트픽 첫 달 무료 (계정당 1회)

- 가입 후 자동 `AiPassSubscription` trial row 생성:
  - `validUntil = 가입 + 30일`
  - `paymentKey = "TRIAL"`
  - 카드 등록 X, 자동 결제 X
- 31일째 만료 → 결제 화면 노출 (29,900원/월)
- **계정당 1회만** — 재가입 시 미적용 (`firstSubscriptionUsed` flag)

**필드**:
- `palettePickTrialUntil: Instant?` (가입 + 30일)
- `palettePickFirstUsed: Boolean` (한 번 사용 시 true)

### 5. 환영 보너스 60 물감 (ADR 0044 §4)

- 가입 직후 자동 지급
- 7일 만료
- `bonusPoints` 적립 — 출금 X
- 친친 3명 열람 또는 작은 팁용

### 어뷰징 방어 총괄

| 가드 | 메커니즘 |
|---|---|
| 출금 봉인 | 가입 30일 + 1건 매칭 성사 + 본인인증 완료 시에만 출금 가능 (ADR 0033 강화) |
| bonusPoints 격리 | 모든 보너스는 `bonusPoints` — `paidPoints` 안 거침 |
| 환불 방어 | 반값 묶음 환불 시 `bonusPoints` 로 환급 (POLICY §2 강화) |
| 폰 인증 필수 | 모든 트라이얼은 폰 인증 완료된 계정만 활성 |
| 본인인증 필수 | 출금/큰 거래(50 물감 ↑ 팁)는 본인인증 필수 |
| 디바이스 핑거프린트 | T&S 도메인 hook — 동일 device_id 가입 시 트라이얼 비활성 |

## 1 가입자 worst-case 손실

| 항목 | 비용 |
|---|---|
| 열람 3일 일 5명 (DB read) | ≈0원 |
| 반값 110물감 묶음 1회 | -5,000원 |
| 무료 소개 1회 (주선자 보상 Lv.1=15 물감) | **-1,500원** (플랫폼 부담) |
| 팔레트픽 30일 무료 (LLM 호출 ≈한계비용) | ≈-1,000원 |
| 환영 60 물감 (주선자/판매자 흘러감) | -6,000원 |
| **합계** | **~13,500원** |

→ ARPU 가 **14,000원** 이상이면 break-even.
→ 팔레트픽 첫 달 무료 종료 후 1회 결제만 해도(29,900원) 단일 가입자 손익분기 + 잉여.

## 데이터 마이그레이션

`user_ticket_balances` 테이블에 컬럼 추가 (ddl-auto=update):

```sql
ALTER TABLE user_ticket_balances ADD COLUMN views_trial_until TIMESTAMP NULL;
ALTER TABLE user_ticket_balances ADD COLUMN views_used_today INT NOT NULL DEFAULT 0;
ALTER TABLE user_ticket_balances ADD COLUMN views_today_reset_date DATE NULL;
ALTER TABLE user_ticket_balances ADD COLUMN half_price_package_until TIMESTAMP NULL;
ALTER TABLE user_ticket_balances ADD COLUMN half_price_package_used BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE user_ticket_balances ADD COLUMN free_intro_remaining INT NOT NULL DEFAULT 0;
ALTER TABLE user_ticket_balances ADD COLUMN free_intro_expires_at TIMESTAMP NULL;
ALTER TABLE user_ticket_balances ADD COLUMN palette_pick_trial_until TIMESTAMP NULL;
ALTER TABLE user_ticket_balances ADD COLUMN palette_pick_first_used BOOLEAN NOT NULL DEFAULT FALSE;
```

`free_intro_used_matchmaker_ids` 는 별도 보조 테이블 또는 콤마-separated string (베타에선 JSON 컬럼).

## 결과

- 신규 가입자 첫 7일간 핵심 가치(친친 풀 탐색·소개 요청 1건·팔레트픽)를 **0원 또는 5,000원**에 체험 가능
- 어뷰징 가드 6중으로 다중 계정 어뷰징 비용 > 혜택 가치 → 합리적 어뷰저는 시도 안 함
- 정상 사용자는 30일 후 자연스럽게 결제 흐름 진입 (팔레트픽 만료 + 친친 매력 인지)

## 메모

- 트라이얼 종료 시 일괄 알림(푸시) 발송: D-1 / D-3 / 만료 당일 — retention nudge
- 카피 톤: 과장 X. "첫 3일간 친친 일 5명 무료" 같은 사실 noun phrase.
