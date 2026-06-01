#!/usr/bin/env bash
# ============================================================================
# Palette Reviewer — PR 번호 받아 agentic-harness.run_code_reviewer 호출
# ============================================================================
# 호출:
#   bash palette-reviewer.sh <pr_number>
#
# 책임 분리:
#   diff + linked issue + verdict 판정 + 라벨 전이 모두
#   agentic-harness 의 agents.run_code_reviewer() 가 처리.
#   request_changes 시 PR close + linked issue 재트리거도 자동.
# ============================================================================
set -euo pipefail

PR_N="${1:?need PR number}"
REPO="${PALETTE_REPO:-c-yeonwoo/palette}"
AH_DIR="${AGENTIC_HARNESS_DIR:-$HOME/dev-private/agentic-harness}"
REPO_CWD="${PALETTE_REPO_CWD:-$HOME/dev-private/palette}"

# .env 자동 로드 (cron 으로 호출 시 shell env 비어있음)
for env_file in "$AH_DIR/.env" "$REPO_CWD/.env"; do
  if [ -f "$env_file" ]; then
    set -a; . "$env_file"; set +a
  fi
done

# PAT 별칭 정규화 — PALETTE_AGENT_PAT > GH_TOKEN > GITHUB_TOKEN
if [ -n "${PALETTE_AGENT_PAT:-}" ]; then
  export GH_TOKEN="$PALETTE_AGENT_PAT"
  export GITHUB_TOKEN="$PALETTE_AGENT_PAT"
fi

# 빈 env 가드 — Anthropic SDK 가 ANTHROPIC_BASE_URL="" 자동 사용해 connection error
[ -z "${ANTHROPIC_BASE_URL:-}" ] && unset ANTHROPIC_BASE_URL || true
[ -z "${ANTHROPIC_AUTH_TOKEN:-}" ] && unset ANTHROPIC_AUTH_TOKEN || true

if [ ! -d "$AH_DIR/.venv" ]; then
  echo "❌ $AH_DIR/.venv 없음 — bootstrap 미수행" >&2
  gh pr edit "$PR_N" --repo "$REPO" \
    --remove-label "ah:in-progress" --add-label "ah:awaiting-human" || true
  gh pr comment "$PR_N" --repo "$REPO" \
    --body "❌ palette-reviewer: agentic-harness venv 미설치 — 사람 확인" || true
  exit 1
fi

export AH_DIR REPO REPO_CWD PR_N

set +e
"$AH_DIR/.venv/bin/python" - <<'PYEOF'
import asyncio, os, sys
from pathlib import Path
sys.path.insert(0, os.environ['AH_DIR'])
from orchestrator import agents, gh, source_of_truth as sot_mod

async def main():
    repo = os.environ['REPO']
    pr_n = int(os.environ['PR_N'])
    pr = await gh.get_pr(repo, pr_n)
    sot = await sot_mod.discover(Path(os.environ['REPO_CWD']))
    bot_user = await gh.whoami()
    ok = await agents.run_code_reviewer(
        repo=repo, pr=pr, sot=sot, bot_user=bot_user,
    )
    sys.exit(0 if ok else 1)

asyncio.run(main())
PYEOF
EXIT=$?
set -e

# 락 해제 (verdict 별 라벨은 run_code_reviewer 가 부여함) ---------------------
gh pr edit "$PR_N" --repo "$REPO" --remove-label "ah:in-progress" 2>/dev/null || true
if [ "$EXIT" -ne 0 ]; then
  gh pr edit "$PR_N" --repo "$REPO" --add-label "ah:awaiting-human" || true
fi

exit "$EXIT"
