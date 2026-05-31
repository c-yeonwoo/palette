#!/usr/bin/env bash
# ============================================================================
# Palette PM — 라벨 큐 스캔 + 1건 dispatch (Hermes cron --no-agent 로 호출됨)
# ============================================================================
# 사용:
#   hermes cron create '5m' --no-agent \
#     --script palette-pm.sh \
#     --workdir /Users/ys.choi/dev-private/palette \
#     --name palette-pm
#
# 동작:
#   1) ah:in-progress 카운트 (WIP)
#   2) ah:needs-review PR 우선 → reviewer 호출
#   3) 없으면 ah:needs-execution issue → executor 호출
#   4) 락 부여 (ah:in-progress) + 큐 라벨 제거
#   5) executor/reviewer 호출 시 그 안에서 락 해제
#
# 종료 코드: 0 (idle) | 0 (dispatched, success) | 1 (worker crashed)
# 출력: 1줄 요약 (Hermes cron 이 delivery target 으로 전달)
# ============================================================================
set -euo pipefail

REPO="${PALETTE_REPO:-c-yeonwoo/palette}"
WIP_CAP="${PALETTE_WIP_CAP:-5}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 0. WIP 가드 ---------------------------------------------------------------
WIP_ISS=$(gh issue list --repo "$REPO" --label "ah:in-progress" --state open --json number | jq length)
WIP_PR=$(gh pr list --repo "$REPO" --label "ah:in-progress" --state open --json number | jq length)
WIP=$((WIP_ISS + WIP_PR))
if [ "$WIP" -ge "$WIP_CAP" ]; then
  echo "WIP=$WIP >= $WIP_CAP, skip"; exit 0
fi

# 1. 큐 스캔 (PR 우선) -------------------------------------------------------
TARGET_KIND=""; TARGET_NUM=""; WORKER=""

PR_NUM=$(gh pr list --repo "$REPO" --label "ah:needs-review" --state open \
        --json number,createdAt --jq 'sort_by(.createdAt) | .[0].number // empty')
if [ -n "$PR_NUM" ]; then
  TARGET_KIND=pr; TARGET_NUM="$PR_NUM"; WORKER="palette-reviewer"
else
  ISS_NUM=$(gh issue list --repo "$REPO" --label "ah:needs-execution" --state open \
            --json number,createdAt --jq 'sort_by(.createdAt) | .[0].number // empty')
  if [ -z "$ISS_NUM" ]; then
    # idle — Hermes cron --no-agent 는 empty stdout 이면 silent 전달 안 함
    exit 0
  fi
  TARGET_KIND=issue; TARGET_NUM="$ISS_NUM"; WORKER="palette-executor"
fi

# 2. 락 부여 ----------------------------------------------------------------
SUBCMD="$([ "$TARGET_KIND" = "pr" ] && echo pr || echo issue)"
QUEUE_LABEL="$([ "$TARGET_KIND" = "pr" ] && echo ah:needs-review || echo ah:needs-execution)"

gh "$SUBCMD" edit "$TARGET_NUM" --repo "$REPO" \
  --remove-label "$QUEUE_LABEL" --add-label "ah:in-progress" >/dev/null
gh "$SUBCMD" comment "$TARGET_NUM" --repo "$REPO" \
  --body "🤖 palette-pm · $(date -Iseconds) · dispatch → $WORKER" >/dev/null

# 3. 워커 호출 (foreground — 한 tick 안에 처리, timeout 은 Hermes 가 관리) ----
echo "dispatched #$TARGET_NUM → $WORKER (WIP $((WIP+1))/$WIP_CAP)"

if [ "$WORKER" = "palette-executor" ]; then
  exec bash "$SCRIPT_DIR/palette-executor.sh" "$TARGET_NUM"
else
  exec bash "$SCRIPT_DIR/palette-reviewer.sh" "$TARGET_NUM"
fi
