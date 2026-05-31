#!/usr/bin/env bash
# ============================================================================
# Hermes cron 등록 — palette-pm 만 등록 (executor/reviewer 는 pm 이 직접 호출)
# ============================================================================
set -euo pipefail

HERMES="${HERMES_BIN:-$HOME/.local/bin/hermes}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORKDIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ ! -x "$HERMES" ]; then
  echo "❌ hermes 바이너리 없음: $HERMES" >&2
  echo "   설치: curl -fsSL https://hermes-agent.nousresearch.com/install.sh | bash" >&2
  exit 1
fi

# ~/.hermes/scripts/ 에 symlink — Hermes cron 은 그 디렉토리 안의 script 만 받음
HERMES_SCRIPT_DIR="$HOME/.hermes/scripts"
mkdir -p "$HERMES_SCRIPT_DIR"
for s in palette-pm.sh palette-executor.sh palette-reviewer.sh; do
  src="$SCRIPT_DIR/scripts/$s"
  dst="$HERMES_SCRIPT_DIR/$s"
  ln -sf "$src" "$dst"
  echo "  symlink: $dst → $src"
done

# 기존 job 있으면 pass (idempotent)
if "$HERMES" cron list 2>&1 | grep -q "palette-pm"; then
  echo "  palette-pm cron 이미 등록됨 (skip)"
  exit 0
fi

# 5분마다 — --no-agent: LLM 안 쓰고 script 만 실행 (watchdog 패턴)
# --workdir 로 CLAUDE.md 자동 주입 (사실 --no-agent 면 무의미하지만 명시)
"$HERMES" cron create '5m' \
  --no-agent \
  --script "palette-pm.sh" \
  --workdir "$WORKDIR" \
  --name palette-pm \
  --deliver local

echo ""
echo "✅ palette-pm cron 등록 완료. 확인:"
echo "   $HERMES cron list"
echo "   $HERMES cron run palette-pm    # 즉시 1회 실행 (테스트용)"
