# 0023 — 어뷰징 방지 가드 구현 (출금 holding · rate limit · 차단/신고)

- **상태**: Accepted
- **결정일**: 2026-06-06
- **결정자**: ys.choi

## 컨텍스트

ADR 0022(어뷰징 방지 기준)의 로드맵 P0/P1 중, 외부 연동 없이 구현 가능한 가드를 순차 구현. 전체 위협 모델은 `docs/TRUST_AND_SAFETY.md`.

## 결정

### 1) 출금 holding + 한도 + 신규계정 cooldown (현금 유출 방어)
- `MatchmakerEarnings` 에 `reserveForWithdrawal`/`confirmWithdrawal`/`releaseWithdrawal` 추가 — 출금 요청 시 `pendingPoints` 로 **예약**(중복 출금 차단), holding 후 확정 시 pending→withdrawn, 거절 시 해제.
- `WithdrawalRequestEntity`(HOLD→PAID/REJECTED) + 리포. 요청 시 HOLD 레코드 + availableAt = now + holding(기본 14일).
- `requestWithdrawal` 재작성: 본인인증(휴대폰) + 최소금액(5,000P) + **신규계정 cooldown(7일)** + **일(20만)/월(100만) 한도** + 가용 검증.
- `WithdrawalSettlementScheduler`(매시간): holding 종료분 자동 확정. `AdminWithdrawalsController`: holding 중 의심건 거절(예약 해제). `GET /me/withdrawals` 내역.
- 설정: `app.withdrawal.*` (@Value).

### 2) Rate limit (스팸/콜드 add 차단)
- `RateLimiter`(고정 윈도우) — refresh token 과 동일한 `spring.data.redis.enabled` 분기: Redis(INCR+EXPIRE, 다중 인스턴스) / in-memory(단일 인스턴스·dev).
- 적용(429 `RateLimitExceededException`): 친구 요청 30/일, 매칭 요청 10/일, 연결 제안(Nudge) 30/일.

### 3) 유저간 신고/차단 + 양방향 격리
- `BlockEntity`/`ReportEntity` + 리포 + `BlockService`(양방향 카운터파트 집합).
- `BlockReportController`: `POST/DELETE /users/{id}/block`, `GET /users/me/blocks`, `POST /users/{id}/report`.
- `AdminReportsController`: 신고 검토 큐 + REVIEWED 처리.
- **양방향 격리**: "내가 차단했거나 나를 차단한" 상대를 **피드·AI시그널·매칭요청**에서 모두 제외.

## 결과

- 즉시 출금 → holding 라이프사이클(차지백/콜루전 적발 윈도우 확보) + 한도/cooldown.
- 스팸 쓰기 액션 429 차단.
- 차단/신고 + 양방향 노출 격리.
- 단위테스트: earnings 예약/확정/해제, InMemoryRateLimiter. compile/test 통과.

## 후속 (TRUST_AND_SAFETY 로드맵 잔여)

- 결제 Toss 서버검증 + 차지백 시 커미션 회수, NICE 실인증 게이팅, 콜루전 탐지 엔진(디바이스/IP/CI 시그널), Vision/이미지해시 도용탐지, 리뷰 verified-match gate. (외부 연동/대형)

## 비고

- 열람권(선불 티켓) 과금 모델 ADR 은 0024(예정)로 이동 — 본 ADR 은 어뷰징 가드에 한정.
