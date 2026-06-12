# 0051 — 관계 단계 동기화 + 만남 피드백 설문(종결 판단)

- **상태**: Accepted (베타)
- **결정일**: 2026-06-12
- **결정자**: ys.choi
- **선행**: ADR 0013/0014 (주선자 시스템), 0050 (만남 후 주선자 전용 사적 후기)

## 컨텍스트

매칭 성사 후 관계 단계(`MATCHED → CONTACTS_EXCHANGED → MET → DATING`)를 양쪽 당사자가 각각 기록했지만, 두 가지 빈틈이 있었다.

1. **단계 충돌**: 단계는 `request_id` 로 공유되어 구조적으로는 동기화되지만, 한쪽이 이미 다음 단계로 올려둔 상태에서 다른 쪽이 같은(또는 이전) 단계로 다시 올리면 그냥 덮어써졌다. "이미 바뀌었다"는 안내가 없었다.
2. **만남 결과 → 관계 지속 판단 부재**: `MET`(만남 완료)에 도달해도 "그래서 계속 볼지" 를 시스템이 묻지 않았다. 한쪽이 더 만나고 싶지 않은데도 관계가 `DATING` 으로 흘러갈 수 있었다.

ADR 0050(주선자 전용 사적 후기)은 **주선자/운영자**를 향한 신뢰 데이터 수집이다. 이번 건은 결이 다르다 — **당사자 본인의 "계속 이어갈지" 의사**로 관계를 종결할지 정하는 것.

## 결정

### 1. 단계 동기화 + 충돌 안내

- 단계는 `request_id` 단위로 단일 진실(이미 그러함).
- 선형 진행 순서를 `LINEAR_STAGES = [MATCHED, CONTACTS_EXCHANGED, MET, DATING]` 로 명시. `ENDED` 는 별도 종료 상태로 선형에서 제외.
- `PUT /stage` 업데이트 시 **요청 단계가 현재보다 앞서거나 같으면**(이미 상대가 올려둠) 또는 **현재가 `ENDED`** 면 → 덮어쓰지 않고 `conflict=true` + 현재 단계를 반환. 프론트는 `이미 'OO' 상태로 바뀌었어요` 안내(toast.info) 후 동기화.

### 2. 만남 피드백 설문 → 종결 판단

`MET`(만남 완료) 도달 시 **양쪽 당사자에게 설문**:

> 만남은 어떠셨어요?
> - 다시 만나고 싶어요 (`MEET_AGAIN`)
> - 잘 모르겠어요 (`UNSURE`)
> - 인연이 아닌 것 같아요 (`NOT_FOR_ME`)

**종결 규칙 (사용자 결정): 한쪽이라도 `NOT_FOR_ME` → 즉시 종결(`ENDED`).**

- 양쪽 다 `MEET_AGAIN`/`UNSURE` 면 관계 유지 → `DATING` 진행 가능.
- `ENDED` 로의 전환은 **만남 피드백에서만** 발생. 일반 `PUT /stage` 로는 `ENDED` 불가.
- `MET` 에서 본인 설문에 답하기 전에는 `DATING` 으로 올리는 버튼을 숨김(설문이 결정 지점).

#### 왜 "한쪽이라도 NOT_FOR_ME → 종결" 인가

| 규칙 | 트레이드오프 |
|---|---|
| **한쪽이라도 부정 → 종결 (채택)** | 한쪽이 원치 않는 관계를 끌지 않음. 안전·존중 우선. 미스매치 빠른 정리 → 다음 인연으로. |
| 양쪽 다 부정해야 종결 | 한쪽의 일방적 호감으로 관계가 지속 → 부담·불쾌 위험 |

데이팅에서 **상호 동의**가 핵심 가치이므로, 한쪽의 명시적 거부는 곧바로 존중되어야 한다.

### 데이터 모델

`meeting_feedbacks` (MeetingFeedbackEntity):
- `request_id` — 어떤 매칭(관계)
- `user_id` — 답변자(당사자 본인)
- `intent` — `MEET_AGAIN` / `UNSURE` / `NOT_FOR_ME`
- `created_at`
- UNIQUE (request_id, user_id) — 1인 1회 (upsert)
- index `idx_meetfb_request`

PostMatchFeedback(주선자 후기)·PhotoFeedback(사진 유사도)과는 별개 테이블 — 관심사가 "관계 지속 판단"으로 다름.

### API

| 메서드 | 경로 | 동작 |
|---|---|---|
| `PUT` | `/api/v1/relationships/{id}/stage` | 단계 업데이트 (+`conflict` 플래그) |
| `POST` | `/api/v1/relationships/{id}/meeting-feedback` | 만남 피드백 제출. 한쪽이라도 `NOT_FOR_ME` 면 `stage=ENDED` 반영 후 반환 |
| `GET` | `/api/v1/relationships` / `/{id}/status` | 응답에 `myMeetingFeedback`(내 의향) 포함 |

작성 조건: 매칭 `COMPLETED` + 당사자(requester/target) + 단계 `MET` 이상.

## 프론트 (IntroductionHistoryScreen)

- `RelationshipStatus.myMeetingFeedback` 추가.
- `MET` 단계: 미응답이면 설문 3택, 응답하면 "내 만남 후기" + (부정 아니면) "두 분 다 긍정이면 이어갈 수 있어요".
- `MET` 미응답 동안 `연애 중으로 업데이트` 버튼 숨김.
- `stage === ENDED`: 단계바·설문·업데이트 없이 마무리 카드("이번 인연은 여기서 마무리됐어요")만.
- `PUT /stage` 응답이 `conflict` 면 `이미 'OO' 상태로 바뀌었어요` 안내 후 재동기화.

## 보류 (후속)

- `ENDED` 전환 시 양쪽 푸시 알림 (현재 toast 만)
- 종결 사유 익명 집계 → 추천 품질 학습
- 쿨타임(매칭완료 후 5일) 과 `ENDED` 의 상호작용 정교화

## 결과

- 양쪽이 같은 관계 단계를 보고, 덮어쓰기 대신 충돌을 안내.
- 만남 결과를 당사자 의사로 닫음 — 원치 않는 관계 지속 방지(상호 동의 가치).
- 신뢰·안전 신호를 어뷰징 위험 없이 수집(상대에겐 의향 비노출, 결과만 "종결/유지").
