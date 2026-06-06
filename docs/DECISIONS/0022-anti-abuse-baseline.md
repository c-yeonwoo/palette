# 0022 — 어뷰징 방지 기준 (Anti-Abuse Baseline)

- **상태**: Accepted
- **결정일**: 2026-06-06
- **결정자**: ys.choi

## 컨텍스트

지인 네트워크 + 주선 커미션(현금 출금) + 열람권 과금 + 데이팅 안전이라는 컨셉상, 어뷰징 표면이 넓다. 전수 검토 결과 3대 공격면: ① 지인 그래프 진정성, ② 현금 유출 경로, ③ 베타 신원검증 공백. 전체 위협 모델·로드맵은 `docs/TRUST_AND_SAFETY.md`.

특히 즉시 손에 잡히는 두 가지가 있었다:
- **소개받기(isAcceptingMatches)/숨김(hiddenAt) 토글이 저장만 되고 필터링에 미사용** (ADR 0005, BACKLOG P1) → 끈 사람이 그대로 피드·AI시그널에 노출되고 주선 요청도 받음 (프라이버시 + 원치 않는 노출 어뷰징).
- **출금에 신원 게이트 없음** → 현금 유출 경로가 무방비.

## 결정

### 1) MatchabilityFilter — 매칭 노출 가능 여부를 서버가 강제
- 도메인 단일 기준 `ProfileSettings.canReceiveMatches() = isVisible() && isAcceptingMatches`.
- 강제 지점 3곳: `FeedController`(피드 대상 제외), `AiSignalController`(후보 제외), `MatchmakingController`(비매칭 대상 요청 403).
- → ADR 0005 의 "토글 미적용" 미해결 항목 해소.

### 2) 출금 본인인증 게이트
- `MatchmakerController.requestWithdrawal` 은 `isPhoneVerified` 계정만 허용(아니면 403).
- 현금 유출의 1차 신원 게이트. 정식 단계에서 NICE 실인증 + 계좌 실명(CI) 일치 + holding period 로 강화(후속).

### 3) 정책 기준 (코드 미구현이나 설계 확정)
- **감사포인트는 비출금 프로모 포인트** — 현금화 가능하면 "지인 무한 수락 → 파밍 → 출금" 익스플로잇. 신설 시 비출금.
- **현금성 보상은 외부 결제에서만 파생** — 플랫폼이 직접 지급하는 포인트는 비출금.
- **신뢰 신호는 서버가 진실원천** — 토글·쿨타임·시드격리·열람권 전부 서버 강제(클라 신뢰 금지).
- **모든 현금 이벤트는 회수 가능** — 차지백/부정 시 커미션 자동 회수 경로 확보.

## 후속 (TRUST_AND_SAFETY.md 로드맵)

- P0: 출금 holding+한도, 결제 Toss 서버검증, NICE 실인증 게이팅, 콜루전 기본 탐지.
- P1: rate limit(친구/매칭/Nudge), 유저간 신고·차단 양방향 격리, 디바이스/IP 시그널 캡처, 열람권 서버측 권한.
- P2: Vision/이미지해시 도용탐지, 리뷰 verified-match gate, 운영자 어뷰징 대시보드.

## 결과

- 끈 사람이 더는 노출·요청 대상이 되지 않음(프라이버시 + 어뷰징 해소).
- 출금이 미인증 계정에서 막힘.
- `ProfileSettingsTest` 단위 테스트 추가. compile/test 통과.

## 비고

- 열람권(선불 티켓) 과금 모델 ADR 은 별도(0023 예정) — 본 ADR 은 어뷰징 가드에 한정.
