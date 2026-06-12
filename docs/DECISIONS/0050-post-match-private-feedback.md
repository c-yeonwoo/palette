# 0050 — 만남 후 주선자 전용 사적 피드백

- **상태**: Accepted (베타)
- **결정일**: 2026-06-12
- **결정자**: ys.choi
- **선행**: ADR 0013/0014 (주선자 시스템), 0023 (어뷰징 가드), 0035 (공개 범위), 0046 (외부송금 가드)

## 컨텍스트

매칭 성사 후 "어땠는지" 를 수치화/피드백하는 시스템이 없었다. 신뢰 데이터(매너·진정성)를 모을 수단 부재.

데이팅 앱에서 **공개 매너 평가**(별점·랭킹)는 양날의 검:
- 보복 평가, 평가 공포, 여성 사용자 이탈
- 공개 글은 다 좋게만 쓰여 신뢰 신호로서 약함
- ADR 0026 "등급 제거" 정신과 충돌

## 결정

**만남 후 후기를 주선자(+운영자)에게만 사적으로 전달.** 상대방에겐 절대 비공개.

### 왜 이 방향이 우월한가

| | 공개 매너평가 | 주선자 전용 사적 후기 (채택) |
|---|---|---|
| 보복·평가공포 | 높음 | 없음 (상대방 비노출) |
| 솔직함 | 낮음 (미화) | 높음 (사적) |
| 주선자 생태계 | 무관 | 강화 — 결과 학습 → 다음 추천 품질↑ |
| 자정작용 | 약함 | 강함 — 매너 나쁜 지인 자연 배제 |
| 컨셉 부합 | 낮음 | 높음 — "지인이 그려주는 인연" 의 피드백 루프를 지인(주선자)이 닫음 |

### 데이터 모델

`post_match_feedbacks` (PostMatchFeedbackEntity):
- `request_id` — 어떤 매칭
- `matchmaker_user_id` — 주선자 (조회 비정규화)
- `author_user_id` — 작성자 (당사자 A/B)
- `counterpart_user_id` — 후기 대상 (상대방, 운영자 패턴분석용. 상대에겐 비노출)
- `met_status` — MET / NOT_MET / SCHEDULED
- `sentiment` — GOOD / NEUTRAL / DISAPPOINTING (부드러운 3택)
- `message` — 주선자께 한마디 (비공개 자유 텍스트)
- `want_to_meet_again` — 재만남 의향
- UNIQUE (request_id, author_user_id) — 1회만

### 노출 범위 (사용자 결정: 주선자 + 운영자)

| 대상 | 조회 | 용도 |
|---|---|---|
| **주선자** | `GET /api/v1/matchmaker/feedback` | 내 매칭 결과 학습. 작성자·상대 닉네임 + 내용 |
| **운영자** | `GET /api/v1/admin/match-feedback/flags` | 반복 DISAPPOINTING·노쇼(NOT_MET) 누적 유저 플래그 |
| **상대방** | ❌ 영원히 불가 | — |
| **작성자 본인** | `GET .../feedback/mine` (작성 여부 확인) | — |

### 작성 조건·가드

- 매칭 `COMPLETED` 후에만
- 당사자(requester/target)만
- 1회 (UNIQUE 제약 + 백엔드 멱등 체크)
- 상대방 노출 경로 자체가 없음 (API 미존재)

## 1차 범위 (이 PR)

- ✅ 작성 API + 주선자 조회 + 운영자 flags
- ✅ 프론트: IntroductionHistoryScreen(MET/DATING 단계 진입 버튼) → PostMatchFeedbackSheet
- ✅ 주선자 대시보드 "받은 후기 💌" 섹션
- ✅ schema-mysql-migrations.sql + drift 가드 통과

## 보류 (수치화는 데이터 누적 후)

- trustScore 직접 반영 → 어뷰징·보복 설계 더 신중히 필요. 데이터 쌓인 뒤 별도 ADR
- 운영자 화면 프론트 (현재 endpoint 만, admin UI 는 후속)
- 노쇼 누적 자동 제재

## 결과

- 신뢰 데이터(매너·만남 결과)를 어뷰징 위험 없이 수집 시작
- 주선자가 피드백 루프의 중심 — 컨셉 강화 + 자정작용
- 운영자는 안전망 (반복 부정 패턴 감지)
