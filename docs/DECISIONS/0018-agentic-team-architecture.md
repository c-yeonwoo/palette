# 0018 — agentic team 아키텍처 + palette 적용 plan

- **상태**: Accepted (platform 분리 결정 — 본 세션)
- **결정일**: 2026-06-01
- **결정자**: ys.choi

## 컨텍스트

palette 에 agentic 자동화를 도입하면서, 본질적으로 **platform / use case** 두 개념이 섞여있음을 발견:

- **platform** (agent-harness): 라벨 큐, ReAct, edit, worktree, PR, reviewer critique, SoT 4-tier, retry — **재사용 가능**
- **use case** (palette): project-specific SoT (CLAUDE.md, docs/*, ADRs), skill (palette-po), naming (palette-pm.sh), gh repo (c-yeonwoo/palette) — **palette 전용**

ADR 0017 (PoC) 에서는 둘이 섞여 있었으나, **agent-harness 가 platform 으로 독립**하고 **palette 는 첫 use case** 라는 위치로 정정.

## 다이어그램 (사용자 그림 — 본 ADR 의 source-of-truth)

```
[human] ─ hermes cli ──→ [task queue (t1, t2, t3 ...)]
                              │
                              ▼ need_execution
                         [palette-po]  ──←── SoT
                            (Hermes skill)
                              │
                              ▼
                       [github issue]
                              │
              ┌───────────────┴─────── hermes cron ───┐
              ▼                                        │
        [issue-finder] ──────→ [github issue]          │   ←── SoT
              │                                        │
              ▼ x N개 병렬                             │
        [code executor] ──→ [pr]  ──── need_review    │   ←── SoT
                                                       │
                              ┌────────────────────────┘
                              ▼ 반복 (need_execution)
                       [code reviewer (critique)]      ←── SoT
                              │
                              ▼ awaiting_human (작업 완료시)
                       [review comment] ─→ telegram alarm ─→ [human]
                              │                                │
                              │       comment, change label    │
                              │←───────────────────────────────┘
                              ▼ merge
                          [deploy]
                              │
                              ▼ trigger
                       [ssot manager] ──→ SoT 갱신 / 리인덱싱
```

## 결정

### 1. agent-harness 를 별도 git repo / platform 으로 분리

- 위치: `~/dev-private/agentic-harness/` (별도 GitHub repo: `c-yeonwoo/agentic-harness`)
- 책임: platform 차원의 모든 결정 (라벨 / ReAct / edit / amend / SoT 발견 / retry / cost / caching)
- palette 는 import 만 — `.hermes/scripts/*.sh` 가 `~/dev-private/agentic-harness/orchestrator/agents.py` 의 함수 호출

### 2. palette 는 첫 use case 로 platform 도입

- palette/.hermes/ 가 platform 의 import 점:
  - `skills/palette-po/SKILL.md` — project-specific PO (palette SoT 참조)
  - `scripts/palette-pm.sh` — dispatcher
  - `scripts/palette-executor.sh` — agent-harness 의 `run_code_executor` 호출
  - `scripts/palette-reviewer.sh` — agent-harness 의 `run_code_reviewer` 호출
  - `agent-context.md` — palette 도메인 한 페이지 요약
  - `bootstrap.sh` / `cron-setup.sh` — 1회 셋업
  - `aliases.sh` — shell wrapper (선택)
- palette/CLAUDE.md / docs/* / docs/DECISIONS/* — SoT (platform 이 자동 발견)

### 3. Phase plan (platform 의 README 와 동기화)

| Phase | 산출물 | 상태 | palette 영향 |
|-------|--------|------|---------------|
| **A** | MVP — PO + executor + reviewer + amend + EditApplyError retry | ✅ palette PoC 검증 | issue #10 → PR #12 merged, issue #11 OPEN (다음 phase 후 재시도) |
| **B** | LLM provider 추상화 (Anthropic / OpenAI) | 🔲 진행 예정 | `.env` 의 `LLM_PROVIDER`, model 선택 자유 |
| **C** | task queue 명시 + 병렬 executor (N건 동시) | 🔲 | palette-po 가 큰 agenda 분할, palette-pm 이 N건 dispatch |
| **D** | `issue-finder` agent — 코드 자동 scan → issue | 🔲 | palette 의 TODO / FIXME / ADR drift 자동 발견 |
| **E** | `ssot manager` — merge 후 SoT 자동 갱신 | 🔲 | palette/docs/ARCHITECTURE.md, GLOSSARY 자동 갱신 PR |
| **F** | telegram / slack alarm | 🔲 | reviewer awaiting-human 시 사람한테 push |

### 4. palette ↔ platform 의 인터페이스

```
palette-pm.sh
  bash → python -c "from orchestrator import agents; agents.run_code_executor(...)"
                                                                   ↑
                                                  ~/dev-private/agentic-harness/orchestrator/
```

platform 의 Python 모듈 path 가 palette 의 .hermes/scripts 에서 import. 그래서:
- agent-harness 의 venv 가 palette repo 와 별개 (각자 자기 .venv)
- palette/.hermes/scripts/palette-executor.sh 가 `$AH_DIR/.venv/bin/python` 으로 실행
- 두 repo 간 의존성은 path 만 (시스템 환경변수 `AGENTIC_HARNESS_DIR` 또는 hardcoded `~/dev-private/agentic-harness`)

### 5. 다음 세션 첫 작업

agent-harness platform 의 **Phase B (LLM provider 추상화)** + palette 의 issue #11 OpenAI 재시도. 자세한 내용은 platform 의 [`docs/ARCHITECTURE.md`](https://github.com/c-yeonwoo/agentic-harness/blob/main/docs/ARCHITECTURE.md) 와 본 ADR 의 Phase plan 참고.

## 영향

- palette 의 ADR 들은 **palette 자체 결정** (디자인 토큰, 도메인 용어, 흐름) 만 다룸
- platform 의 결정 (라벨 컨벤션, ReAct, edit, amend 등) 은 platform repo 의 ADR / docs 에서 관리
- 동일 platform 을 다른 프로젝트 (예: 사이드 프로젝트, lore) 에도 import 가능 — `.hermes/` scaffold 만 작성

## Follow-up

- platform repo 의 `docs/DECISIONS/` 가 비어있음 — 핵심 결정 9개를 platform 의 ADR 로 정리 (다음 세션)
- palette/.hermes 의 `agent-context.md` 보강 — palette 의 절대 룰 / 도메인 용어 / 코드 위치 cheat sheet (executor / reviewer 가 매번 읽음)
- platform repo 의 CI — pytest / ruff (없으면 추가)
