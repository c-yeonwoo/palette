# 0056 — AI 색깔 분석 고도화 (답변 + MBTI + 사주 오행 혼합)

- **상태**: Accepted
- **결정일**: 2026-06-13
- **결정자**: ys.choi
- **선행**: ADR 0037(인사이트 카드), 0047(LLM 안전바), 0009(색 분석 영속화)

## 컨텍스트

색깔 판별이 너무 단순했다 — `OpenAIService` 가 답변 텍스트의 **키워드 몇 개**만 보고 단정("긍정적·다정한·재밌는" → 즉시 오렌지). MBTI·생년월일은 LLM 에 **전혀 전달되지 않았다**. 다중 근거 없이 단정하니 신뢰감이 낮았다.

## 결정

색 판별을 **세 출처(자기 서술 답변 + MBTI + 사주 오행)의 종합 분석**으로 고도화하고, 출처별 근거를 함께 제시한다.

**사용자 결정**: 사주는 **생년월일 기반 결정적 오행**(출생시간·만세력 라이브러리 X) 수준.

### 사주 — `SajuService` (결정적, 라이브러리 없음)
- `birthDate: LocalDate` → 연주((year-4) 간지, 입춘 2/4 이전은 전년 보정) + 일주(epochDay 60갑자, anchor 2000-01-07=甲子) + 월지(양력 월 근사).
- 천간·지지 → **오행 분포(목화토금수)** + 일간(日干) + 띠 + 한국어 한 줄 요약.
- 정통 명리(시주/절기 정밀)는 아니고 색 분석에 곁들이는 'flavor' 신뢰 신호. 기존 `AiInsightController`/`CompatibilityCalculator` 의 year%10 오행(궁합용)은 컨벤션이 달라 **건드리지 않음**(테스트 보호) — 통합은 후속.
- 단위테스트: 연주(1984=갑자, 2000=경진, 입춘 보정) + 오행 합=5 + 결정성.

### LLM 입력·프롬프트
- `ProfileGenerationRequest` + `GenerateRequest` 에 `mbti`, `sajuSummary`/`birthDate` 추가.
- `AIProfileController`: **생년월일은 서버 `User.publicInfo.birthDate` 우선**(권위), 없으면 요청값(온보딩 draft). MBTI 는 온보딩 draft(프로필 미저장 시점)라 요청값. → `SajuService` 로 오행 요약 생성 후 주입.
- `buildUserPrompt`: 【MBTI】 + 【사주 오행】 섹션 추가.
- `SYSTEM_PROMPT` 재설계: **세 근거를 각각 따져 교차검증 후** 색 선택, 단일 키워드 즉단 금지. 가중치(답변 우선 → MBTI 보강 → 사주 보조). 8색 × 성향축(+MBTI·오행 경향 힌트) 루브릭. 출력 JSON 에 `evidenceFromAnswers/Mbti/Saju` 추가(없으면 빈 문자열).
- `parseResult`: 새 evidence 필드 파싱(중첩/평면 둘 다 허용, 하위호환 default). stub 폴백도 evidence 채움(더미키 환경).

### 노출
- `AIProfileEnhanceScreen`: 색 근거를 **답변/MBTI/사주 3블록**으로 표시(신뢰감). generate 요청에 mbti·birthDate 전송.

## 범위 / 한계
- 이번 PR: 위 백엔드 + 프론트 표시 + 테스트. evidence 영속화는 보류(종합 `colorReasoning` 은 기존대로 영속) — 후속에서 ColorType 확장 검토.
- 모델은 `gpt-4o-mini` 유지. 더 깊은 추론 필요 시 이 호출만 `gpt-4o` 분리(비용 로그 이미 존재) — 후속 옵션.
- 오행 계산 통합(궁합 ↔ 색분석)·시주(출생시간) 정밀화는 후속.

## 검증
- `./gradlew test`(SajuServiceTest + AIProfileControllerTest 갱신 포함) BUILD SUCCESSFUL.
- `npm run build` + vitest 39 passed.
- 로컬: generate 호출 시 프롬프트에 MBTI/사주 포함(로그) — 더미키면 stub 가 evidence 채움.

## 결과
- 키워드 단정 → **다근거 종합 + 출처별 근거 제시**로 색 분석 신뢰도↑. MBTI·생년월일이 처음으로 분석에 반영됨.
