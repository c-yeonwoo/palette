# `palettepick` 패키지 — 팔레트픽 매칭 파이프라인

ADR 0047 §B 참조. 핵심 수입 파이프라인 (29,900원/월 구독, ADR 0044) 의 추천 엔진.

## 구조 (계획)

```
palettepick/
├── domain/
│   ├── PalettePickRecommendation.kt      # 추천 도메인
│   ├── PalettePickScore.kt               # 다단계 점수 모델
│   └── CompatibilityRubric.kt            # LLM 분석 결과
├── application/
│   ├── PalettePickRecommendationService.kt   # orchestrator
│   ├── CandidatePoolService.kt                # 1차: 후보 풀
│   ├── ScoringService.kt                      # 2차: 결정적 점수
│   ├── LlmCompatibilityScorer.kt              # 3차: LLM (top N만)
│   └── PalettePickBatchScheduler.kt           # 매일 자정 배치
├── persistence/
│   ├── PalettePickRecommendationEntity.kt
│   └── CompatibilityRubricCacheEntity.kt
└── presentation/
    └── PalettePickController.kt              # /api/v1/palette-pick
```

## 단계적 구현 (ADR 0047 §B.6)

- **B.0 (현재)**: ADR + 패키지 골격 + 도메인 stub
- **B.1**: 1·2단계 (Pool + Deterministic Score) — LLM 미사용
- **B.2**: 3단계 (LlmCompatibilityScorer) — top 8만 LLM, 캐시
- **B.3**: 배치 scheduler — 매일 자정 KST
- **B.4**: A/B 테스트
- **B.5**: 옵션 MSA 추출

기존 `presentation/feed/AiSignalController` 는 B.1 완성 시점에 deprecated → 본 패키지로 이관.
