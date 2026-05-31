# Palette × Hermes Agent — 자동 작업 하네스

> palette 레포 위에 도는 3-에이전트 하네스.
> GitHub 라벨이 곧 상태 머신, Hermes 가 scheduler + lifecycle, agentic-harness 가 ReAct/edit/PR.

설계 결정 기록: `docs/DECISIONS/0017-hermes-agentic-harness.md` (Phase B 진입 시 작성)

---

## 구성

| 에이전트 | 역할 | sandbox | 권한 |
|---|---|---|---|
| `palette-pm` | 5분마다 라벨 스캔 → 1건 dispatch | local | read-only |
| `palette-executor` | issue → ReAct + edit + 테스트 + PR | **docker** (격리 필수) | write |
| `palette-reviewer` | PR → review + verdict 라벨 전이 | local | read + comment |

세 yaml 의 핵심 LLM/tool-loop 로직은 모두 **`~/dev/agentic-harness/orchestrator/agents.py`** 의
`run_code_executor` / `run_code_reviewer` 를 `python -c '...'` 로 import 호출. Hermes 의 역할은:
- cron 트리거 / WIP 가드 / 동시성 (1 tick 1건)
- sandbox 격리 (executor 만 Docker)
- timeout / 로그 / 재시작 lifecycle

agentic-harness 가 이미 검증한 결정 (핵심 설계 결정 — 변경 금지):
1. **라벨 4개** (`ah:` prefix) — `needs-execution` / `needs-review` / `awaiting-human` / `in-progress`
2. **state machine 없음** — 라벨이 state. DB/Redis 안 씀.
3. **SOT 4-tier** — `~/.claude/CLAUDE.md` → `~/dev-private/CLAUDE.md` → `palette/CLAUDE.md` → `palette/docs/*` + recent PRs (20)
4. **ReAct + edit action 필수** — 500줄+ 파일에 `replace` 금지 (max_tokens). `old_str` 1회 매칭, 실패 시 whitespace fuzzy fallback.
5. **plan 은 PR description 에만** — issue 엔 "PR 생성됨" 링크 + cost 한 줄.
6. **`Closes #N` 자동 추가** — merge 시 issue 자동 close.
7. **reviewer request_changes → PR close + issue 재트리거** — 무한 루프는 사람이 라벨 떼서 멈춤.
8. **`claude-haiku-4-5` 기본** — Opus 비용 부담 보류.
9. **OAuth token** (`sk-ant-oat...`) 는 SDK 의 `auth_token` 으로. `api_key` 로 보내면 401.

## 라벨 상태 머신 (4개)

```
[사람] gh issue create + ah:needs-execution
    ↓ (pm cron 5min)
ah:in-progress (pm 이 락 부여 + executor dispatch)
    ↓ executor: ReAct → edit → worktree → push → PR 생성
PR 에 ah:needs-review (executor 가 부여), issue 에 PR 링크 코멘트
    ↓ (pm 다음 tick)
ah:in-progress (PR 에 락 + reviewer dispatch)
    ↓ reviewer: diff + linked issue 보고 verdict 판정
verdict=approve|concerns_noted → PR 에 ah:awaiting-human (사람 merge 결정 대기)
verdict=request_changes        → PR close + linked issue 에 ah:needs-execution 재부착
    ↓
[사람] merge → PR 의 `Closes #N` 으로 issue 자동 close
       또는 라벨 떼서 흐름 멈춤
```

---

## 첫 셋업 (Phase B 진입 시)

```bash
# 1. 환경변수
export PALETTE_AGENT_PAT="ghp_..."        # repo + write + pr 권한
export ANTHROPIC_AUTH_TOKEN="sk-ant-oat..."   # 또는 ANTHROPIC_API_KEY

# 2. agentic-harness 점검 (없으면 clone + venv)
test -d ~/dev/agentic-harness || (
  git clone https://github.com/c-yeonwoo/agentic-harness ~/dev/agentic-harness
  cd ~/dev/agentic-harness && python3.12 -m venv .venv && .venv/bin/pip install -e .
)

# 3. 라벨 + worktree dir + 환경변수 점검
bash .hermes/bootstrap.sh

# 4. Hermes 설치 + agent 등록
curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash
hermes setup
hermes agent add .hermes/agents/palette-pm.yml
hermes agent add .hermes/agents/palette-executor.yml
hermes agent add .hermes/agents/palette-reviewer.yml
hermes agent start palette-pm

# 5. 첫 test task — 가장 작은 변경 (예: README 의 오타)
gh issue create -R c-yeonwoo/palette \
  --title "test: README 오타 수정 (PoC)" \
  --label "ah:needs-execution" \
  --body "frontend/README.md 의 'develpoment' → 'development' 오타 수정"

# 6. 흐름 추적
watch -n 30 'gh issue list -R c-yeonwoo/palette --label "ah:needs-execution" \
            && gh pr list -R c-yeonwoo/palette --label "ah:needs-review,ah:awaiting-human"'
```

---

## WIP / 안전 정책

- 동시 `ah:in-progress` 라벨 ≤ **5** (pm 가드)
- stale 30분 초과 → `ah:awaiting-human` 으로 escalate
- 재진입 cap 없음 — 사람이 라벨 떼서 멈춤 (무한 루프 방지)

## Hermes ↔ agentic-harness 책임 분리

| 책임 | Hermes | agentic-harness |
|------|--------|-----------------|
| cron 트리거 / WIP 가드 | ✅ | — |
| sandbox / Docker 격리 | ✅ | — |
| timeout / 로그 / 재시작 | ✅ | — |
| LLM tool-loop (ReAct) | — | ✅ (`claude.call_with_tools`) |
| `submit_plan` JSON + plan 정규화 | — | ✅ |
| git worktree + edit action + fuzzy fallback | — | ✅ (`git_apply.py`) |
| GitHub label 전이 + PR 생성 + Closes #N | — | ✅ (`gh.py` + `agents.py`) |
| SOT 4-tier 컨텍스트 주입 | — | ✅ (`source_of_truth.py`) |
| cost 추적 / model 선택 | — | ✅ (`claude.py`) |

→ Hermes scaffold 가 사라져도 agentic-harness 의 `ah run` daemon 으로 백업 가능.
→ 반대로 Hermes 가 더 안정적이면 자체 daemon 폐기.

## 검증 시나리오 (Phase C)

1. PM 이 5분 후 `ah:needs-execution` issue 발견 → executor dispatch
2. executor 가 worktree + edit + commit + push + PR 생성 (라벨 `ah:needs-review`)
3. PM 이 다음 5분 후 `ah:needs-review` PR 발견 → reviewer dispatch
4. reviewer 가 verdict → `ah:awaiting-human`
5. 사람 검토 후 merge → PR 의 `Closes #N` 으로 issue close

성공 기준: 사람 개입 0회로 1~4 자동 진행. 5 만 사람.

## 보고 항목 (Phase D)

- Hermes 가 actually 지원하는 기능 ↔ 가정 사이 gap
- 자체 daemon (launchd) 대비 비용 / latency / 안정성
- 사이드 프로젝트 PR URL + cost 한 줄
- 본 프로젝트 (다른 repo) 확대 권장 여부
