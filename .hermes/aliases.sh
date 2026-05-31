# ============================================================================
# Palette × Hermes shell aliases
# ============================================================================
# 사용:
#   source ~/dev-private/palette/.hermes/aliases.sh    # 1회 — ~/.zshrc 에 영구
#   palette-po "친구 카운트 +1 안 됨"                  # → issue 생성
#
# 패턴 (다중 프로젝트 확장):
#   <project>-po "<자연어 task>"  →  hermes chat -s <project>-po --quiet -q "..."
#
# Hermes chat 의 LLM 은 입력만으로는 어떤 프로젝트 task 인지 알 수 없으므로
# 호출 시점에 명시적 routing 이 필요. 이 wrapper 가 그 역할.
# ============================================================================

HERMES_BIN="${HERMES_BIN:-$HOME/.local/bin/hermes}"

# Palette PO — task 1건 받아 issue 생성
palette-po() {
  if [ $# -eq 0 ]; then
    echo "usage: palette-po '<자연어 task 설명>'"
    echo "예:    palette-po '친구 수락 후 mypage 지인 카운트 +1 안 됨'"
    return 1
  fi
  if [ ! -x "$HERMES_BIN" ]; then
    echo "❌ hermes 바이너리 없음: $HERMES_BIN" >&2; return 1
  fi
  # --quiet: banner/spinner 숨김
  # --max-turns 8: PO 는 SOT 스캔(3-4 read) + gh issue create 1회 — 8 회면 충분
  # --yolo: 매 tool 호출마다 confirm 묻지 않음 (PO 는 read + gh issue create 만 — 안전)
  "$HERMES_BIN" chat \
    -s palette-po \
    --quiet \
    --max-turns 8 \
    --yolo \
    -q "$*"
}

# Palette PM — 즉시 1 tick (큐 폴링) 실행. 평소엔 Hermes gateway 가 5분마다 자동.
palette-tick() {
  if [ ! -x "$HERMES_BIN" ]; then
    echo "❌ hermes 바이너리 없음: $HERMES_BIN" >&2; return 1
  fi
  "$HERMES_BIN" cron run palette-pm
}

# Palette 큐 상태 — 한 줄 요약
palette-queue() {
  local REPO="${PALETTE_REPO:-c-yeonwoo/palette}"
  echo "── palette queue ──"
  echo "  needs-execution: $(gh issue list -R $REPO --label ah:needs-execution --state open --json number --jq length)"
  echo "  needs-review:    $(gh pr list   -R $REPO --label ah:needs-review     --state open --json number --jq length)"
  echo "  in-progress:     $(($(gh issue list -R $REPO --label ah:in-progress --state open --json number --jq length) + $(gh pr list -R $REPO --label ah:in-progress --state open --json number --jq length)))"
  echo "  awaiting-human:  $(($(gh issue list -R $REPO --label ah:awaiting-human --state open --json number --jq length) + $(gh pr list -R $REPO --label ah:awaiting-human --state open --json number --jq length)))"
}

# 도움말
palette-help() {
  cat <<'EOF'
Palette × Hermes 명령:
  palette-po "<자연어>"     issue 생성 (PO skill, Hermes 트랙)
  palette-tick              cron 즉시 1회 실행 (gateway 미설치 시 manual)
  palette-queue             큐 상태 한 줄 요약
  palette-help              이 도움말

Claude Code 트랙 (이 alias 없이도 동작):
  /add-task <자연어>        Claude Code 채팅창에서

cron 자동 실행 활성화 (1회):
  $HERMES_BIN gateway install
EOF
}
