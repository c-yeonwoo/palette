#!/usr/bin/env bash
# ============================================================================
# Palette Executor — issue 번호 받아 agentic-harness.run_code_executor 호출
# ============================================================================
# 호출:
#   bash palette-executor.sh <issue_number>
#
# 의존:
#   - ~/dev/agentic-harness/.venv (pip install -e .)
#   - PALETTE_AGENT_PAT (GH token), ANTHROPIC_AUTH_TOKEN or ANTHROPIC_API_KEY
#
# 책임 분리:
#   ReAct + edit + worktree + push + PR + Closes #N + cost 추적 모두
#   agentic-harness 의 agents.run_code_executor() 가 처리.
#   이 script 는 venv activate + entrypoint 호출 + 락 해제만.
# ============================================================================
set -euo pipefail

ISSUE_N="${1:?need issue number}"
REPO="${PALETTE_REPO:-c-yeonwoo/palette}"
AH_DIR="${AGENTIC_HARNESS_DIR:-$HOME/dev/agentic-harness}"
REPO_CWD="${PALETTE_REPO_CWD:-$HOME/dev-private/palette}"

# agentic-harness venv 점검
if [ ! -d "$AH_DIR/.venv" ]; then
  echo "❌ $AH_DIR/.venv 없음 — bootstrap 미수행" >&2
  gh issue edit "$ISSUE_N" --repo "$REPO" \
    --remove-label "ah:in-progress" --add-label "ah:awaiting-human" || true
  gh issue comment "$ISSUE_N" --repo "$REPO" \
    --body "❌ palette-executor: agentic-harness venv 미설치 — 사람 확인" || true
  exit 1
fi

# entrypoint 실행 -----------------------------------------------------------
set +e
"$AH_DIR/.venv/bin/python" - <<PYEOF
import asyncio, os, sys
from pathlib import Path
sys.path.insert(0, os.environ['AH_DIR'])
from orchestrator import agents, gh, source_of_truth as sot_mod

async def main():
    repo = os.environ['REPO']
    issue_n = int(os.environ['ISSUE_N'])
    issue = await gh.get_issue(repo, issue_n)
    sot = sot_mod.SourceOfTruth.from_cwd(Path(os.environ['REPO_CWD']))
    bot_user = await gh.whoami()
    ok = await agents.run_code_executor(
        repo=repo,
        issue=issue,
        sot=sot,
        bot_user=bot_user,
        repo_cwd=Path(os.environ['REPO_CWD']),
    )
    sys.exit(0 if ok else 1)

asyncio.run(main())
PYEOF
EXIT=$?
set -e

# 락 해제 (성공 시 agents.run_code_executor 가 ah:needs-execution 제거함 — 락만) -
gh issue edit "$ISSUE_N" --repo "$REPO" --remove-label "ah:in-progress" 2>/dev/null || true
if [ "$EXIT" -ne 0 ]; then
  gh issue edit "$ISSUE_N" --repo "$REPO" --add-label "ah:awaiting-human" || true
fi

exit "$EXIT"
