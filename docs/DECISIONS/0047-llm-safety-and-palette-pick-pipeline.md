# 0047 — LLM 안전바 + 팔레트픽 매칭 파이프라인 아키텍처

- **상태**: Implemented (B.1·B.2·B.3 완료, B.4 관측·variant tagging)
- **결정일**: 2026-06-10
- **마지막 갱신**: 2026-06-11
- **결정자**: ys.choi
- **선행**: ADR 0025 (팔레트픽 구독 패스), 0044 (가격 v2 — 팔레트픽 29,900원/월)
- **구현 PR**:
  - A 안전바: `palettepick/llm-safety` (merged) — LlmUsageLog · ProfileGenerationCache · OpenAIService 강화 · AdminLlmUsage
  - B.1 임베딩: `palettepick/b1-embedding` (merged) — ProfileEmbedding · EmbeddingService · MutualFitScoring
  - B.2 오케스트레이터: `palettepick/b2-orchestrator` (PR 검토) — ColorCompat · ActivityMomentum · CandidatePool · EmbeddingRefresh · RecommendationService · AiSignal 위임
  - B.3 LLM Stage 3: `palettepick/b3-llm-compat` (PR 검토) — CompatibilityAnalysis · LlmCompatibilityScorer · 자정 KST 배치
  - B.4 관측: `palettepick/b4-observability` (본 갱신과 함께)

## 컨텍스트

LLM 사용 현황 점검 결과:

1. **LLM 호출 진입점은 단 1곳** — `/api/v1/ai-profile/generate` (프로필 색 분석 + 소개글 생성)
2. **운영 공백 다수** — 백엔드 rate-limit X, 캐시 X, timeout X, retry X, audit log X, fallback 약함
3. **팔레트픽은 핵심 수입 파이프라인** (29,900원/월 구독) 인데 현재 deterministic random — LLM 활용 0
4. **LLM 비용 폭주 위험** — 캐시·rate-limit 없는 상태에서 사용자 abuse 시 무방어

본 ADR 은 두 축을 묶어 설계:
- **A. 모든 LLM 호출의 공통 안전바** — 호출 1곳이든 N곳이든 동일하게 적용되는 가드 (timeout/retry/cache/rate-limit/audit/fallback)
- **B. 팔레트픽 매칭 파이프라인** — LLM 을 핵심 가치(매일 1-3장 깊이있는 추천)에 효율적으로 활용. 패키지 분리로 향후 MSA 가능성 열어둠

## A. LLM 안전바 (즉시 구현)

### A.1 인프라

| 컴포넌트 | 책임 |
|---|---|
| **`LlmUsageLogEntity`** | 모든 LLM 호출의 audit log (`user_id`, `purpose`, `model`, `input_tokens`, `output_tokens`, `cost_won`, `outcome`, `latency_ms`, `error`, `input_hash`) |
| **`ProfileGenerationCacheEntity`** | `input_hash → response_json` 캐시 (동일 입력 = 동일 결과, LLM 안 부름) |
| **`OpenAIService` 강화** | timeout 15s, retry 1회, try/catch → fallback stub, cache 우선, 모든 호출 audit |
| **rate-limit** | `RateLimiter.enforce("llm:profile-generate:{userId}", limit=5, window=1d)` — 백엔드 우회 차단 |
| **`AdminLlmUsageController` + Screen** | outcome 별 집계 (OK/CACHED/FAILED/RATE_LIMITED) · 비용 추적 · 캐시 hit률 |

### A.2 outcome 분류

| outcome | 의미 | LLM 호출 | 비용 |
|---|---|---|---|
| `OK` | 정상 응답 + 파싱 성공 | ✅ | 정상 |
| `CACHED` | 캐시 hit (동일 입력) | ❌ | 0 |
| `FAILED` | timeout / 5xx / 파싱 실패 → fallback stub | ✅ (실패) | 정상 (호출은 했음) |
| `RATE_LIMITED` | 백엔드 rate-limit 차단 | ❌ | 0 |

### A.3 비용 절감 효과

- 사용자 평균 재분석 시도 2회 → 2번째는 hash 동일 시 캐시 hit
- 가입 1,000명 × 1.2회 = 1,200건 호출 중 캐시 hit 약 30% 가정 → **360건 절감 (~500원)**
- 정식 운영 시 hit률 50%+ 기대 (재방문·롤백 등)

## B. 팔레트픽 매칭 파이프라인 (점진 구현)

### B.1 컨텍스트

팔레트픽은 ADR 0025/0044 에서 정의된 **유료 구독(29,900원/월)** 의 핵심 가치. 현재 구현은:
- 일일 1-2장 랜덤 추천 (`AiSignalController`)
- LLM 미사용 — "왜 이 사람을 추천하는가" reasoning 부재
- 구독자에게도 deterministic random — 가치 약함

### B.2 새 아키텍처 — 별도 패키지 분리

```
kr.ai.palette.palettepick/
├── domain/
│   ├── PalettePickRecommendation.kt      # 추천 도메인
│   ├── PalettePickScore.kt               # 다단계 점수 모델
│   └── CompatibilityRubric.kt            # LLM 분석 결과 (reasoning + score)
├── application/
│   ├── PalettePickRecommendationService.kt   # orchestrator
│   ├── CandidatePoolService.kt                # 1차: 후보 풀 (지인망 + 색 필터)
│   ├── ScoringService.kt                      # 2차: 결정적 점수 (활동·관심사·색 궁합)
│   ├── LlmCompatibilityScorer.kt              # 3차: LLM 종합 분석 (top N 만)
│   └── PalettePickBatchScheduler.kt           # 매일 자정 (KST) 배치
├── persistence/
│   ├── PalettePickRecommendationEntity.kt
│   └── CompatibilityRubricCacheEntity.kt     # (viewer, candidate) → 분석 결과 캐시
└── presentation/
    └── PalettePickController.kt              # /api/v1/palette-pick (구독자 전용)
```

→ 향후 트래픽 폭증 시 이 패키지를 별도 모듈/서비스로 추출 가능 (MSA 옵션 열어둠).
→ 현재는 모놀리스 내 패키지 분리만 — over-engineering 회피.

### B.3 3-단계 파이프라인 — 양방향 매칭 핵심

```
[ 1. Candidate Pool — Cheap ]
   ↓ 지인망 2촌·3촌 + 매칭 받기 토글 ON
   ↓ 가입 30일 이상 + 프로필 완성도 60%+
   ↓ 매칭 이력 60일 미노출 (ADR 0009)
   ↓
[ 2. Deterministic Scoring — Free (DB + 벡터 코사인) ]
   ↓ ── 4축 weighted score (max 100) ──
   ↓ ① 상호 이상형 적합도 (50%) — 매칭의 본질 (곱셈)
   ↓     cos(A.idealEmb, B.introEmb) × cos(B.idealEmb, A.introEmb)
   ↓     → 양방향 모두 적합해야 ↑ (한 쪽만 적합 = 짝사랑 페널티)
   ↓ ② 자기소개 유사도 (15%) — 가치관·결
   ↓     cos(A.introEmb, B.introEmb)
   ↓ ③ 색 궁합 (20%) — 보완 90 / 유사 75 / 대비 60 (기존 룰 백엔드 이식)
   ↓ ④ 활동 모멘텀 (15%) — 최근 7일 로그인·매칭 시도 정규화
   ↓ → Top 5-10 후보
   ↓
[ 3. LLM Compatibility Analysis — Expensive ]
   ↓ Top 5-10 만 LLM 으로 종합 분석
   ↓ (viewer 프로필 + candidate 프로필) → JSON
   ↓   { score: 0-100, reasoning: "왜 잘 맞는가 3-4문장",
   ↓     strengths: [...], conversation_starters: [...] }
   ↓ 캐시 키: hash(viewerId + candidateId + 양쪽 profile updatedAt)
   ↓
[ 4. 일일 1-3장 최종 선정 ]
   → DailyRecommendationEntity 저장 (기존 인프라 재사용)
```

### B.3a 벡터 임베딩 — 파트 분리 필수

자기소개와 이상형은 **서로 다른 의미공간**. 한 벡터로 합치면 이상형↔자기소개 매칭 불가능.
→ `ProfileEmbeddingEntity` 에 두 컬럼 분리 저장:

| 필드 | 임베딩 대상 | 사용 |
|---|---|---|
| `intro_embedding` | `introduction.text` + `interviewAnswers` + `interests` + `colorReasoning` | A·B intro 유사도, A·B ideal → 상대 intro 매칭 |
| `ideal_embedding` | `idealType.{personalities · datePreferences · importantValues · dealBreakers}` 를 자연어 prompt 로 변환 | A·B ideal → 상대 intro 매칭 |

**모델**: OpenAI `text-embedding-3-small` (1,536 차원, $0.020/1M, 한국어 충분)
**저장**: `byte[]` 1,536 × 4 bytes = 6KB/벡터, DB 컬럼 `LONGBLOB`
**갱신**: Profile 변경 시 async 재임베딩 (`profile.metadata.updatedAt > embedding.updatedAt`)
**Phase 3 옵션**: pgvector / Pinecone (사용자 1만 명 + 트래픽 폭증 시)

### B.3b 비용 비교

| 항목 | 1구독자/월 |
|---|---|
| 임베딩 (신규 + 변경 추정 2회/월) | 0.022원 |
| LLM compatibility (top 8 × 30일) | 168원 |
| **합계** | **~168원/월** |
| 구독료 | 29,900원 |
| LLM 비용 비율 | **0.56%** |

### B.4 비용 모델 (1구독자 기준)

- 후보 풀 ~50명 → 점수화 후 Top 8 → LLM 분석 8건/일
- 1건 평균 700 토큰 in + 400 토큰 out = ~0.7원
- **1일 5.6원/구독자 × 30일 = 168원/월**
- 구독료 29,900원 → **LLM 비용 0.56%** (충분히 흑자)

캐시 hit 시 거의 0원 — 사용자 프로필 변경 빈도 낮아 hit률 60%+ 기대.

### B.5 배치 vs 실시간

**배치 (매일 자정 KST)** 추천:
- 모든 구독자 미리 계산 → 사용자 진입 시 즉시 응답
- LLM 호출 시간 집중 — OpenAI rate limit 관리 용이
- 비구독자에게 미리보기 1장 노출도 함께 계산
- Spring `@Scheduled(cron = "0 0 0 * * *")` + KST

**실시간** 비추천:
- 사용자 매번 5-8초 대기 (UX 최악)
- LLM 호출 분산 어렵

### B.6 단계적 구현 로드맵 (실제 진행)

| 단계 | 내용 | 상태 |
|---|---|---|
| **B.0** | ADR 0047 + 패키지 골격 (entity·service stub) | ✅ Done |
| **B.1** | 임베딩 인프라 — `ProfileEmbeddingEntity` (intro/ideal 분리 LONGBLOB) · `EmbeddingService` · `MutualFitScoringService` · `PalettePickScore` 4축 가중 | ✅ Done |
| **B.2** | 결정적 스코어링 — `ColorCompatibility` · `ActivityMomentum` · `CandidatePool` · `EmbeddingRefresh` · `PalettePickRecommendationService` orchestrator · `AiSignalController` 위임 | ✅ Done |
| **B.3** | LLM Stage 3 — `CompatibilityAnalysisEntity` 캐시 · `LlmCompatibilityScorer` (gpt-4o-mini JSON) · `PalettePickBatchService` (자정 KST cron) · AiSignal `PalettePickInsight` 응답 노출 | ✅ Done |
| **B.4** | **관측 + variant tagging** (이번 갱신) — DailyRecommendation.variant 컬럼으로 추천 출처 기록, 어드민 메트릭에서 variant 별 카드 오픈/매칭 요청 비율 추적. 본격 A/B (control=random)는 사용자 1,000명+ 이후 재검토 | ✅ Done |
| **B.4b** | **배치 실행 관측** — `PalettePickBatchRunEntity` 로 야간 배치 실행(활성유저·처리·LLM호출·실패·소요·에러샘플)을 영속화. `AdminPalettePickBatchController` (`/api/v1/admin/palette-pick/batch/runs` 조회 + `/run` 수동 실행) + `AdminPalettePickBatchScreen`. 배치가 로그로만 남아 어드민에서 진척·오류를 볼 수 없던 문제 해소. 콜드스타트(활성유저 0 → no-op) 정상 동작 확인 포함 | ✅ Done |
| **B.5** | 옵션: MSA 추출 — 트래픽 폭증 시 별도 deploy. **현재는 too much, 결정 미룸** | 후속 |

## C. LLM 확장 활용 — 향후 검토 항목

서비스 성장과 함께 LLM 을 효율적으로 적용 가능한 영역. **모든 항목은 캐시·rate-limit·async 적용 전제.**

| # | 영역 | 시나리오 | LLM 모델 | 우선순위 |
|---|---|---|---|---|
| 1 | **첫 메시지 추천** | 매칭 성공 후 두 사람 프로필·색 조합 기반 첫 인사 5종 | mini | **P0** (이미 mock UI 있음, ADR 0030) |
| 2 | **신고 자동 분류** | 신고 detail 텍스트 → 카테고리·심각도 추론. 운영자 검토 가속 | mini | P1 |
| 3 | **AI 매칭 commentary** | 어드민 매칭 풀에서 "이 매칭이 왜 좋은가" 자동 코멘트 | mini | P1 |
| 4 | **AI 인터뷰 follow-up** | 답변이 짧으면 후속 질문 자동 생성 → 깊이 ↑ | mini | P2 |
| 5 | **외부송금 유도 탐지** | 채팅 메시지 어조 분석 (정규식 + LLM 보조). 채팅 구현 후 | mini | P2 (채팅 의존) |
| 6 | **프로필 품질 코칭** | "당신의 소개글에 부족한 점" — 자기 프로필 분석 | mini | P2 |
| 7 | **위클리 인사이트 (ADR 0037 L-001)** | 사용자 주간 활동 회고 — 색 변화·매칭 패턴 | mini | P2 |
| 8 | **매칭 후 대화 토픽 추천** | 두 사람 공통 관심사 기반 대화 주제 5종 | mini | P2 (채팅 의존) |
| 9 | **고객센터 1차 응대 봇** | CS 인입 → FAQ 매칭 → 답변 초안 | mini | P3 (베타 종료 후) |
| 10 | **소개글 검수 / 부적절 표현 필터** | 소개글 작성 후 욕설·과한 자기과시 점검 | mini | P3 |

### 공통 가드

- **반드시 hash 기반 캐시** — 동일 입력 동일 결과
- **rate-limit** — per-user 일 N회
- **async** — 사용자 즉시 응답 보장 (배치 또는 fire-and-forget)
- **fallback** — LLM 실패 시 정적 텍스트 또는 deterministic 결과
- **audit** — `LlmUsageLogEntity.purpose` 별로 메트릭 추적

### 모델 선택 가이드

- **gpt-4o-mini** — 모든 케이스 기본. 가격 효율적이고 한국어 품질 충분
- **gpt-4o** — 팔레트픽 깊은 분석에만 옵션 검토 (4-6배 비싸나 reasoning 품질 ↑)
- **embedding 모델** — Phase 3 vector 유사도 (관심사·소개글 임베딩) → 후보 풀 확장

## 결과

- **A 안전바 적용 완료**: 모든 LLM 호출(profile_generate · profile_embedding_intro · profile_embedding_ideal · palette_pick_score)이 동일한 안전바(stub·cache·timeout·retry·fallback·audit)를 통과. AdminLlmUsage 화면에서 purpose 별 outcome·비용 추적.
- **B 팔레트픽 파이프라인 구현 완료** (B.1·B.2·B.3): 4축 가중 점수 + 양방향 매칭 + LLM 종합 분석을 자정 KST 배치로 사전 캐시. 추천 응답은 즉시 반환 + `PalettePickInsight` (summary/strengths/watchOuts/firstQuestion) 노출.
- **B.4 관측**: DailyRecommendation.variant 로 추천 출처 기록. variant 별 카드 오픈률·매칭 요청률을 어드민 메트릭에서 비교 → 추천 품질 회귀 감지.
- **C 확장 활용**: 10개 시나리오 우선순위화. P0 첫 메시지 추천은 B.3 의 `firstQuestion` 으로 부분 충족, 별도 endpoint 화는 후속.

## 메모

- 본 ADR 은 단일 호출 시점의 안전바 + 매칭 파이프라인 + 확장 청사진을 한 문서에 통합.
- B 파이프라인 구현은 5개 PR 로 분할 (B.0 골격 → B.1 임베딩 → B.2 오케스트레이터 → B.3 LLM → B.4 관측). 각 PR 은 독립 검증·롤백 가능.
- 본격 A/B (random 대조군)는 사용자 규모 1,000명+ 이전에는 통계적 유의성 부족 → variant tagging 으로 회귀만 감지하고, 알고리즘 비교는 사용자 확보 후로 미룸.
- C 시나리오들은 운영 데이터 + 사용자 피드백 누적 후 우선순위 재조정.
