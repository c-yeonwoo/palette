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

# ~/.hermes/scripts/ 에 **실제 파일 복사** (Hermes 가 symlink path traversal 차단함)
# palette repo 의 원본이 변경될 때마다 이 스크립트 재실행해서 sync.
HERMES_SCRIPT_DIR="$HOME/.hermes/scripts"
mkdir -p "$HERMES_SCRIPT_DIR"
for s in palette-pm.sh palette-executor.sh palette-reviewer.sh; do
  src="$SCRIPT_DIR/scripts/$s"
  dst="$HERMES_SCRIPT_DIR/$s"
  cp "$src" "$dst"
  chmod +x "$dst"
  echo "  copy: $src → $dst"
done

# 기존 job 있으면 pass (idempotent)
if "$HERMES" cron list 2>&1 | grep -q "palette-pm"; then
  echo "  palette-pm cron 이미 등록됨 (skip — 재등록하려면 hermes cron remove palette-pm 먼저)"
  exit 0
fi

# Hermes schedule syntax: 'every 5m' (반복). 단순 '5m' 은 once-only (Repeat 0/1).
"$HERMES" cron create 'every 5m' \
  --no-agent \
  --script "palette-pm.sh" \
  --workdir "$WORKDIR" \
  --name palette-pm \
  --deliver local

echo ""
echo "✅ palette-pm cron 등록 완료. 확인:"
echo "   $HERMES cron list"
echo "   $HERMES cron run palette-pm    # 다음 scheduler tick 에 1회 실행"
echo ""
echo "⚠ Hermes gateway 미설치 시 cron 은 manual trigger 만 — 자동 5분 주기는 안 돕니다."
echo "  $HERMES status  로 gateway 상태 확인."
echo "  설치:  $HERMES gateway install   # launchd 서비스로 등록"
