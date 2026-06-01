# 0017 — Hermes Agent (cron) × agentic-harness 결합 PoC

- **상태**: Phase A2 (scaffold) — Phase B/C 미수행
- **결정일**: 2026-05-31
- **결정자**: ys.choi

## 컨텍스트

별도 세션에서 만든 `~/dev/agentic-harness/` 가 GitHub 라벨 기반 agentic coding 흐름을
잘 처리함 (ReAct + edit action + worktree + PR + cost 추적). 다만 자체 daemon
(`ah run`) 의 launchd lifecycle 관리 부담 때문에 사내 platform "Hermes" 위로
한 사이클 옮겨 적합성 검증하려 함.

Phase A 처음 가정한 `hermes agent add <yaml>` 식 multi-agent 모델은 실제 Hermes
(`~/.local/bin/hermes` v0.15.1) 와 불일치. 실제 모델은:

- `hermes cron create '5m' --no-agent --script <bash>` — watchdog 패턴
- `hermes chat` — 대화형 단일-agent
- `hermes skills/bundles/plugins` — 확장점
- multi-agent 등록은 **없음**

→ Phase A2 에서 yaml 폐기, cron + bash script 모델로 재설계.

## 결정

### 1. 책임 분리

| 책임 | 담당 |
|------|------|
| cron 스케줄 / process lifecycle | **Hermes** (`hermes cron`) |
| LLM tool-loop (ReAct) / edit / worktree / PR / Closes #N / cost / SOT 4-tier | **agentic-harness** (그대로 import) |

Hermes 가 사라져도 `cd ~/dev/agentic-harness && ah run` 로 폴백 가능.

### 2. 구조

```
~/.hermes/scripts/ ─ symlink ─→ palette/.hermes/scripts/
├── palette-pm.sh             # 5분마다 호출 — 라벨 큐 스캔 + dispatch
├── palette-executor.sh       # pm 이 호출 — python -c "agents.run_code_executor"
└── palette-reviewer.sh       # pm 이 호출 — python -c "agents.run_code_reviewer"

cron job: 1개 (palette-pm, `5m`, `--no-agent`, workdir=palette repo)
```

### 3. 라벨 (변경 금지)

| 라벨 | 의미 |
|------|------|
| `ah:needs-execution` | executor 큐 (issue) |
| `ah:needs-review`    | reviewer 큐 (PR) |
| `ah:awaiting-human`  | 사람 결정 대기 |
| `ah:in-progress`     | 워커 점유 락 (자동 부여/해제) |

### 4. 흐름 (PO → cron → executor → reviewer)

0. **사람**이 `/add-task <자연어>` (Claude Code slash command, palette/.claude/commands/add-task.md)
1. **PO skill** (= Claude Code LLM 단계) 가 palette SOT 읽고 scope/AC/affected files/hints 채워
   `gh issue create + ah:needs-execution` 호출 (= `ah add-task` CLI 와 같은 역할)
2. **Hermes cron** (5m) → `palette-pm.sh` → 큐 스캔 (PR 우선) → 락 부여 → executor/reviewer 호출
3. **executor** → ReAct → worktree + push → `gh pr create --label ah:needs-review`
4. 다음 tick → **reviewer** → verdict
   - approve/concerns_noted → `ah:awaiting-human` (사람 merge)
   - request_changes → **PR 유지** + `ah:needs-review` 제거 + `ah:needs-execution` 부착
     → 다음 tick 에서 executor amend mode 가 같은 branch 에 추가 commit (PoC 검증됨)
5. 사람 **merge** → `Closes #N` 으로 issue 자동 close

PO 분리의 이유:
- 사람의 어수선한 자연어를 잘 정리된 issue 로 변환하는 작업은 LLM 가치 큼 (executor 시간 절약)
- 사람이 `gh issue create` 직접 치면 그 변환이 빠짐 → 다이어그램의 `po skill` 박스가 비어버림
- LLM 단계 = Claude Code slash command (현 세션의 컨텍스트 활용)
- Hermes 안에도 PO 가 들어갈 수 있지만 (skill) 현 트랙은 Claude Code 안

### 5. WIP / 안전 정책

- 동시 `ah:in-progress` ≤ **5** (pm 가드, `PALETTE_WIP_CAP` env 로 override)
- stale 30분 → `ah:awaiting-human` 으로 escalate (TODO)
- 재진입 cap 없음 — 사람이 라벨 떼서 멈춤 (무한 루프 방지 = 사람 결정)

## 영향

- 코드 변경 없이 issue 만 만들어두면 5분 내 PR 자동 생성
- Hermes 가 OS 레벨 cron 보다 lifecycle 추상화 (로그 / status / pause / resume)
- agentic-harness 가 검증한 모든 핵심 결정 (ReAct, fuzzy edit, SOT, Closes #N, OAuth token) 그대로 준수
- palette 베타 운영 중인데 main 직접 push 의 위험은 reviewer + 사람 merge 단계에서 차단

## PoC 결과 (Phase C / D)

**검증된 흐름 (사람 개입: PO 자연어 입력 + 최종 merge 만)**:
- ✅ Hermes cron `every 5m` + `--no-agent --script` watchdog
- ✅ PO 자연어 → issue 분할 (Hermes skill `palette-po`, sonnet-4-5)
- ✅ executor 신규 PR (ReAct 8 iter + edit action + worktree + `Closes #N`)
- ✅ reviewer approve → `ah:awaiting-human` → 사람 merge → issue 자동 close (#10 / PR #12)
- ✅ reviewer request_changes → **PR 유지 + 라벨 swap** (수정된 새 흐름)
- ✅ executor amend mode (existing_branch 체크아웃 + 추가 commit, PoC 동작 확인)
- ✅ executor 실패 시 atomicity (edit 매칭 실패 → push 안 됨 + `ah:awaiting-human` escalate)
- ✅ rate limit / connection error 처리 (자동 retry + sliding window)

**cost / latency (1 사이클 평균)**:
- PO: $0.10 (~30초)
- executor: $0.30~$0.40 (~5분)
- reviewer: $0.02~$0.04 (~15초)
- 총: **~$0.5 / 사이클**, **~6분**

**핵심 설계 결정 정정**:
- 핵심 결정 #7 ("request_changes → PR close + issue 재트리거") 폐기 →
  "PR 유지 + 라벨 swap + amend mode" 로 변경 (사용자 지적: review thread / git history 보존)

## PoC 추가 발견 (1차 종료 시점)

**해결된 것**:
- ✅ **prompt caching** — `system=[{..., "cache_control": {"type": "ephemeral"}}]` 적용. 단 model **alias 안 됨**, full name 필수 (`claude-haiku-4-5-20251001`). cache hit 확인 (cr=4202)
- ✅ **SoT 가 docs/* 안 봄 → 정정** — `source_of_truth.py` 가 이제 `docs/ARCHITECTURE.md` (fallback), `docs/CONVENTIONS.md` / `GLOSSARY.md` / `POLICY.md` / `PRD.md` / `RUNBOOK.md` 풀 inline + `docs/DECISIONS/*.md` 17개 요약 + `.hermes/agent-context.md` 자동 발견
- ✅ **request_changes → PR 유지 + amend mode** — close 안 함, 라벨 swap, existing_branch 추가 commit

**남은 한계 (LLM 자체) — 해결책 적용됨**:
- ⚠️ **multi-edit 매칭 실패** — LLM 이 같은 영역 여러 edit 만들 때 순서 의존성 무시 또는 outdated reference.
- ✅ **해결책: 라벨 기반 self-heal retry loop** 적용 — `git_apply.py` 에 `EditApplyError` 도입:
  - executor (issue / PR amend 둘 다) 가 잡으면 ❌ 코멘트 (파일/edit index/old_str preview) + `ah:needs-execution` 라벨 다시 부착
  - 다음 palette-pm tick 에 자동 재dispatch
- ✅ **retry cap = 1회** (amend mode) — 두 번째 amend 시도에서 또 edit 매칭 실패 (총 `❌ edit 매칭 실패` 코멘트 2회+) 면 자동 retry 중단:
  - `ah:needs-execution` 제거 + `ah:awaiting-human` 부여 + 🛑 코멘트
  - 무한 루프 + LLM 한계 반복 방지
- ✅ **retry hint** — retry #1 시 user_msg 에 강한 신호:
  - 직전 ❌ 코멘트 원문 inline (어떤 file / edit / old_str 실패)
  - "read_file 로 PR branch 의 현재 정확한 내용 확인 (추측 X)"
  - "직전과 같은 old_str 절대 금지"
  - "same area 여러 edit → single edit 으로 합치기 (순서 의존성 회피)"
  - "SoT 의 CONVENTIONS / GLOSSARY / ADR 참고해서 도메인 정합성 유지"
- atomicity 유지 (실패 시 push 안 됨), retry 흐름이 라벨로 표현됨

## Follow-up

### 다음 세션 — LLM provider 교체 (Anthropic → OpenAI)

**핵심**: agentic-harness 구조 (PO + executor + reviewer + 라벨 큐 + ReAct + edit + git_apply + SoT 4-tier) **그대로 유지**. **LLM 호출 layer 만 swap**.

사유: Anthropic haiku 의 multi-edit reasoning 한계 (본 ADR 의 PoC 결과 — PR #14 폐기). sonnet upgrade 직전 OpenAI 로 결정.

#### Transition plan

1. **`claude.py` → `llm.py` rename 또는 dual-support** — `LLM_PROVIDER=openai|anthropic` 환경변수 분기
2. **API 매핑** (Anthropic → OpenAI):
   | Anthropic | OpenAI |
   |-----------|--------|
   | `client.messages.create(system=, messages=, tools=)` | `client.chat.completions.create(messages=[{role: system}, ...], tools=)` |
   | response `content` (text + tool_use blocks) | `choices[0].message.content` + `tool_calls[]` |
   | `tool_result` content block | `tool` role message + `tool_call_id` |
   | `stop_reason = "tool_use"` / `"end_turn"` | `finish_reason = "tool_calls"` / `"stop"` |
   | `cache_control: {type: "ephemeral"}` | 자동 (system + user prefix auto-cache, 1024+ tokens) |
   | `usage.cache_read_input_tokens` | `usage.prompt_tokens_details.cached_tokens` |
3. **`code_tools.py` 의 `TOOL_SCHEMAS`** — Anthropic `input_schema` → OpenAI `function.parameters` 래핑 (`{type: "function", function: {name, description, parameters}}`)
4. **`_PRICING` 에 OpenAI 모델 추가** — gpt-4o, gpt-5, o1, o3 등
5. **`.env`**:
   ```
   LLM_PROVIDER=openai
   OPENAI_API_KEY=sk-...
   EXECUTOR_MODEL=gpt-5         # 또는 gpt-4o, o1
   REVIEWER_MODEL=gpt-4o-mini    # reviewer 작은 모델 OK
   ```
6. **검증** — issue #11 (mock 데이터 제거) 로 1 사이클 (PO → executor → PR → reviewer → merge)
7. **본 ADR 의 "OAuth token (sk-ant-oat...)" 항목 폐기** — OpenAI 전환 시 무관

### 그 외 follow-up

- agentic-harness 정식 git 저장소화 (현재 로컬 작업본)
- **LLM edit retry loop** — 매칭 실패 시 read_file → re-plan 자동 재시도 (cap = 1 회 이미 적용됨)
- amend mode 의 prompt 강화 — reviewer comment 의 file:line 매핑 명시
- gateway install — `hermes gateway install` 로 5분 자동 활성
- 추후: sot-manager (merge 후 ARCHITECTURE 자동 갱신) — agentic-harness Phase 3
- 추후: issue-finder (코드베이스 자동 스캔 → issue 생성) — agentic-harness Phase 2
